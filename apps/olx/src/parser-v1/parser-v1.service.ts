import * as uuid from 'uuid';
import { Injectable, Logger } from '@nestjs/common';
import { GeocoderAddress, RentObject, RentObjectPhoto } from '@types';
import { sleep } from '@utils';

import { ProxyServersService } from '@app/proxy-servers';
import { RentObjectService } from '@app/rent-object';
import { RentObjectCheckerService } from '@app/rent-object-checker';
import { jobRunner } from '@app/job-runner';
import { GeocordService } from '@app/geocord';
import { RentObjectPhotosUploaderService } from '@app/rent-object-photos';

import { OlxExtractor } from './extractor.class';
import { OlxApi } from './api.class';

const OLX_PAGINATE_LIMIT = 50;
const OLX_PAGINATE_START_PAGE = 0;

export type ParserOptions = {
  category: number;
  region: {
    region_id: number;
    city_id: number;
    region: string;
    city: string;
  };
  owner: {
    owner_type: string;
    filter_bool_commission?: number;
  };
  pages: number;
  offset?: number;
};

@Injectable()
export class ParserV1Service {
  private readonly logger = new Logger(`Olx::${ParserV1Service.name}`);

  private readonly api = new OlxApi();

  constructor(
    private readonly proxyServersService: ProxyServersService,
    private readonly geocordService: GeocordService,
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
    props: ParserOptions & {
      id: string;
      timestamp: number;
      checkStop: () => boolean;
    },
  ) {
    const id = props.id;
    const timestamp = props.timestamp;
    const category = props.category;
    const owner = props.owner;
    const region = props.region;
    const countPages = props.pages;
    const checkStop = props.checkStop;

    ///

    const proxy = await this.proxyServersService.getRandomProxyServer('ua');

    const offset = props.offset || 0;
    for (
      let page = OLX_PAGINATE_START_PAGE + offset;
      page < countPages;
      ++page
    ) {
      if (checkStop()) {
        return;
      }

      this.logger.log(`Загрузка объявлений со страницы ${page}`, id);

      const announcementsResponse = await this.api.getAnnouncements({
        category,
        regionItem: region,
        owner_type: owner.owner_type,
        filter_bool_commission: owner.filter_bool_commission,
        offset: OLX_PAGINATE_LIMIT * page,
        limit: OLX_PAGINATE_LIMIT,
        proxy,
      });
      await sleep(30);

      if ('error' in announcementsResponse) {
        if (announcementsResponse.error === '404-not-found') {
          return;
        }

        this.rentObjectService.logSkipRentObjectParse({
          id,
          timestamp,
          source: 'olx',
          cause: 'error-page',
          description: `[SkipPage] [${announcementsResponse.error}] ${announcementsResponse.message}`,
          meta: {
            category,
            region,
            owner,
            page,
            proxy,
          },
        });
        continue;
      }

      const announcements = announcementsResponse.ok.data;
      if (announcements.length === 0) {
        this.logger.log('Пропускаем пустую страницу', id);
        return;
      }

      const { notExisted } = await this.rentObjectCheckerService.groupedItems({
        items: announcements,
        source: 'olx',
        getIdFromItem: (item) => item.id,
      });

      if (notExisted.length === 0) {
        this.logger.log(
          `Все объекты среди ${announcements.length} найденных уже существуют`,
          id,
        );
        continue;
      }

      for (const item of notExisted) {
        if (checkStop()) {
          return;
        }

        const extractor = new OlxExtractor({ item, input: { category } });

        this.logger.log(`Попытка загрузить фотографии`, id);

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
            source: 'olx',
            cause: 'error-photos',
            description: `[SkipItem] [${maybePhotos.error}] ${maybePhotos.message ?? ''}`,
            meta: {
              category,
              region,
              owner,
              item,
              page,
              proxy,
            },
          });
          continue;
        }

        /// Получение дополнительных данных, если получиться/если они есть

        const geocordAddress =
          await this.geocordService.tryLoadAddressByGeocord({
            getter: () => extractor.geocord(),
          });

        this.logger.log(`Попытка построить объект RentObject ${item.id}`, id);

        const maybeRentObject = this.buildRentObject({
          startRegion: region.region,
          startCity: region.city,

          extractor,

          geocordAddress: geocordAddress as GeocoderAddress,
          photos: maybePhotos.ok,
        });

        if ('error' in maybeRentObject) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            source: 'olx',
            cause: maybeRentObject.error,
            description: `[SkipItem] ${maybeRentObject.message}`,
            meta: {
              category,
              region,
              owner,
              page,
              item,
            },
          });
          continue;
        }

        try {
          this.logger.log(
            `Попытка опубликовать объект RentObject ${item.id}`,
            id,
          );
          await this.rentObjectService.publishRentObject({
            id,
            timestamp,
            source: 'olx',
            rentObject: maybeRentObject.rentObject,
            meta: {
              item,
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

    extractor: OlxExtractor;

    geocordAddress?: GeocoderAddress;
    photos?: RentObjectPhoto[];
  }):
    | { rentObject: RentObject }
    | {
        error: string;
        message: string;
      } {
    const { startRegion, startCity } = props;
    const { extractor, geocordAddress } = props;

    try {
      const description = extractor.description();
      const objectType = extractor.objectType();
      const storey = extractor.storey();
      const areas = extractor.areas();
      const deposit = extractor.deposit();
      const seller = extractor.seller();

      if (typeof objectType !== 'string') {
        const message = '' || (objectType && objectType.message);

        return {
          error: 'object-type-not-found',
          message: `не известный тип объекта; ${message}`,
        };
      }

      const rentObject: RentObject = {
        photos: props.photos ?? [],

        region: startRegion,
        city: startCity,

        fee: null,
        phone: null,
        deposit: null,

        street: null,
        houseNumber: null,
        district: null,

        foreignId: description.id,
        title: description.title,
        description: description.description,
        src: description.url,
        storey: storey.storey,
        storeyNumber: storey.storeyNumber,
        area: areas.area,
        areaKitchen: areas.areaKitchen,
        areaLiving: areas.areaLiving,
        objectType: objectType,
        price: deposit.price,
        name: seller.seller,
      };

      /// заполняем адрес
      {
        const address = extractor.address();

        rentObject.region = address.region;
        rentObject.city = address.city;

        rentObject.district = geocordAddress?.district || address.district;
        rentObject.houseNumber = geocordAddress?.houseNumber || null;
        rentObject.street = geocordAddress?.street || null;
      }

      return { rentObject };
    } catch (error) {
      return { error: 'error-extractor', message: error.message };
    }
  }
}
