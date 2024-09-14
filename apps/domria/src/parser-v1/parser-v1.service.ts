import * as uuid from 'uuid';
import { Injectable, Logger } from '@nestjs/common';

import { RentObject, RentObjectPhoto } from '@types';
import { sleep } from '@utils';

import { ProxyServersService } from '@app/proxy-servers';
import { RentObjectService } from '@app/rent-object';
import { RentObjectCheckerService } from '@app/rent-object-checker';
import { jobRunner } from '@app/job-runner';
import { RentObjectPhotosUploaderService } from '@app/rent-object-photos';

import { DomriaExtractor } from './extractor.class';
import { DomriaApi } from './api.class';

const DOMRIA_PAGINATE_LIMIT = 20;
const DOMRIA_PAGINATE_START_PAGE = 0;

export type ParserOptions = {
  category: {
    id: number;
    realty_type: number;
  };
  region: {
    city_id: number;
    region: string;
    city: string;
  };
  pages: number;
  offset?: number;
};

@Injectable()
export class ParserV1Service {
  private readonly logger = new Logger(`Domria::${ParserV1Service.name}`);

  private readonly api = new DomriaApi();

  constructor(
    private readonly proxyServersService: ProxyServersService,
    private readonly rentObjectService: RentObjectService,
    private readonly rentObjectCheckerService: RentObjectCheckerService,
    private readonly rentObjectPhotosUploaderService: RentObjectPhotosUploaderService,
  ) {}

  public startJobParseAnnouncements(props: {
    options: ParserOptions[];
    name?: string;
    checkStop?: () => boolean;
  }) {
    const id = uuid.v4();
    const timestamp = Date.now();

    this.logger.log(`Инициализация задачи парсинга ${props.name || ''}`, id);

    jobRunner({
      options: props.options,
      logger: this.logger,
      logcontext: id,
      job: async (options) => {
        return this.jobParseAnnouncements({
          ...options,
          id,
          timestamp,
          checkStop: props.checkStop || (() => false),
        });
      },
    });

    return { id };
  }

  private async jobParseAnnouncements(
    options: ParserOptions & {
      id: string;
      timestamp: number;
      checkStop: () => boolean;
    },
  ) {
    const id = options.id;
    const timestamp = options.timestamp;
    const category = options.category;
    const region = options.region;
    const countPages = options.pages;
    const checkStop = options.checkStop;

    ///

    const proxy = await this.proxyServersService.getRandomProxyServer('ua');

    const offset = options.offset || 0;
    for (
      let page = DOMRIA_PAGINATE_START_PAGE + offset;
      page < countPages;
      ++page
    ) {
      if (checkStop()) {
        return;
      }

      this.logger.log(`Загрузка объявлений со страницы ${page}`, id);

      const idsResponse = await this.api.getAnnouncementIds({
        categoryId: category.id,
        categoryRealtyType: category.realty_type,
        cityId: region.city_id,
        limit: DOMRIA_PAGINATE_LIMIT,
        page,
        proxy,
      });
      await sleep(10);

      if ('error' in idsResponse) {
        if (idsResponse.error === '404-not-found') {
          return;
        }

        this.rentObjectService.logSkipRentObjectParse({
          id,
          timestamp,
          source: 'domria',
          cause: 'error-pages',
          description: `[SkipPage] [${idsResponse.error}] ${idsResponse.message}`,
          meta: {
            page,
            category,
            region,
          },
        });
        continue;
      }

      const announcementIds = idsResponse.ok;

      if (announcementIds.count === 0 || announcementIds.items.length === 0) {
        this.logger.log(`Пропускаем пустую страницу ${page}`, id);
        return;
      }

      const { notExisted } = await this.rentObjectCheckerService.groupedItems({
        items: announcementIds.items.map(String),
        source: 'domria',
        getIdFromItem: (id) => id,
      });

      if (notExisted.length === 0) {
        this.logger.log(
          `Все объекты среди ${announcementIds.items.length} найденных уже существуют`,
          id,
        );
        continue;
      }

      for (const itemId of notExisted) {
        if (checkStop()) {
          return;
        }

        this.logger.log(`Попытка загрузить объявление ${itemId}`, id);

        const itemResponse = await this.api.getItem({
          itemId,
          proxy,
        });
        await sleep(10);

        if ('error' in itemResponse) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            source: 'domria',
            cause: 'error-item',
            description: `[SkipItem] [${itemResponse.error}] ${itemResponse.message.slice(0, 500)}`,
            rentId: itemId,
            meta: {
              url: itemResponse.url,
              proxy,
              category,
              region,
              page,
              itemId,
              errorMessage: itemResponse.message,
            },
          });
          continue;
        }

        this.logger.log(`Попытка загрузить стейт страницы ${itemId}`, id);

        const initstatePageResponse = await this.api.getInitstatePage({
          item: itemResponse.ok,
          proxy,
        });
        await sleep(10);

        if ('error' in initstatePageResponse) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            source: 'domria',
            cause: 'error-item.page',
            description: `[SkipItem/page] [${initstatePageResponse.error}] ${initstatePageResponse.message}`,
            rentId: itemId,
            meta: {
              url: initstatePageResponse.url,
              category,
              region,
              page,
              itemId,
              item: itemResponse.ok,
            },
          });
          continue;
        }

        this.logger.log(
          `Попытка загрузить информацию о владельце ${itemId}`,
          id,
        );

        const ownerstatePageResponse = await this.api.getOwnerstate({
          initstate: initstatePageResponse.ok.initstate,
          proxy: proxy,
        });
        await sleep(20);

        if ('error' in ownerstatePageResponse) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            source: 'domria',
            cause: 'error-item.ownerstate',
            description: `[SkipItem/ownerstate] [${ownerstatePageResponse.error}] ${ownerstatePageResponse.message}`,
            rentId: itemId,
            meta: {
              url: initstatePageResponse.url,
              category,
              region,
              page,
              itemId,
              item: itemResponse.ok,
              initstate: initstatePageResponse.ok.initstate,
            },
          });
          continue;
        }

        const extractor = new DomriaExtractor({
          item: itemResponse.ok,
          initstate: initstatePageResponse.ok.initstate,
          ownerstate: ownerstatePageResponse.ok,
        });

        this.logger.log(`Попытка загрузить фотографии ${itemId}`, id);

        const maybePhotos =
          await this.rentObjectPhotosUploaderService.uploadPhotos({
            getOriginalPhotosUrls: () => extractor.photos(),
            downloadPhoto: ({ originalPhotoUrl }) =>
              this.api.downloadPhoto({ url: originalPhotoUrl, proxy }),
            delayPerPhotoSec: 0,
          });
        await sleep(30);

        if ('error' in maybePhotos) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            source: 'domria',
            cause: 'error-photos',
            description: `[SkipItem] [${maybePhotos.error}] ${maybePhotos.message ?? ''}`,
            meta: {
              itemId,
              category,
              region,
              item: extractor.item,
              initstate: extractor.initstate,
              ownerstate: extractor.ownerstate,
              page,
              proxy,
            },
          });
          continue;
        }

        this.logger.log(`Попытка построить объект RentObject ${itemId}`, id);

        const maybeRentObject = this.buildRentObject({
          startRegion: region.region,
          startCity: region.city,

          extractor,

          photos: maybePhotos.ok,
        });

        if ('error' in maybeRentObject) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            source: 'domria',
            cause: maybeRentObject.error,
            description: `[SkipItem] ${maybeRentObject.message}`,
            rentId: itemId,
            meta: {
              itemId,
              category,
              region,
              item: extractor.item,
              initstate: extractor.initstate,
              ownerstate: extractor.ownerstate,
              page,
              proxy,
            },
          });
          continue;
        }

        try {
          this.logger.log(
            `Попытка опубликовать объект RentObject ${itemId}`,
            id,
          );
          await this.rentObjectService.publishRentObject({
            id,
            timestamp,
            source: 'domria',
            rentObject: maybeRentObject.rentObject,
            meta: {
              itemId,
              item: extractor.item,
              initstate: extractor.initstate,
              ownerstate: extractor.ownerstate,
            },
          });
        } catch (error) {
          const lid = uuid.v1();
          this.logger.error(
            'Ошибка публикации объекта: ' + error?.message,
            lid,
          );
          this.logger.debug(error, lid);
        }
      }
    }
  }

  private buildRentObject(props: {
    startRegion: string;
    startCity: string;

    extractor: DomriaExtractor;

    photos?: RentObjectPhoto[];
  }):
    | {
        rentObject: RentObject;
      }
    | {
        error: string;
        message: string;
      } {
    try {
      const { startRegion, startCity } = props;
      const { extractor } = props;

      const objectType = extractor.objectType();
      if (!objectType) {
        return {
          message: `не известный тип объекта`,
          error: 'object-type-not-found',
        };
      }

      const description = extractor.description();
      const address = extractor.address();
      const deposit = extractor.deposit();
      const areas = extractor.areas();
      const storey = extractor.storey();
      const seller = extractor.seller();
      const phone = extractor.phone();

      const rentObject: RentObject = {
        photos: props.photos ?? [],

        region: startRegion,
        city: startCity,

        foreignId: description.id,
        description: description.description,
        title: description.title,
        src: description.url,
        objectType: objectType,
        street: address.streetName,
        houseNumber: address.houseNumber,
        district: address.district,
        price: deposit.price,
        area: areas.area,
        areaKitchen: areas.areaKitchen,
        areaLiving: areas.areaLiving,
        storey: storey.storey,
        storeyNumber: storey.storeyNumber,
        name: phone.seller ?? seller.seller,
        phone: phone.phone,

        deposit: null,
        fee: null,
      };

      rentObject.region = address.region;
      rentObject.city = address.city;

      return { rentObject };
    } catch (error) {
      return { error: 'error-extractor', message: error.message };
    }
  }
}
