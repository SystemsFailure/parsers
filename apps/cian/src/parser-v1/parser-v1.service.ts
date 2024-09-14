import * as uuid from 'uuid';
import { Injectable, Logger } from '@nestjs/common';
import { RentObject, RentObjectPhoto } from '@types';
import { sleep } from '@utils';

import { ProxyServersService } from '@app/proxy-servers';
import { RentObjectService } from '@app/rent-object';
import { RentObjectCheckerService } from '@app/rent-object-checker';
import { jobRunner } from '@app/job-runner';
import { RentObjectPhotosUploaderService } from '@app/rent-object-photos';

import { CianApi } from './api.class';
import { CianExtractor } from './extractor.class';

const CIAN_PAGINATE_START_PAGE = 1;

export type ParserOptions = {
  region: {
    region: string;
    id: number;
    name: string;
    origin: string;
  };
  category: {
    type: string;
  };
  pages: number;
  offset?: number;
};

@Injectable()
export class ParserV1Service {
  private readonly logger = new Logger(`Cian::${ParserV1Service.name}`);

  private readonly api = new CianApi();

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
    const kind = options.category.type;
    const city = options.region;
    const tryCountPages = options.pages;
    const checkStop = options.checkStop;

    const proxy = await this.proxyServersService.getRandomProxyServer('ro');

    ///

    const offset = options.offset || 0;
    for (
      let page = CIAN_PAGINATE_START_PAGE + offset;
      page <= tryCountPages;
      ++page
    ) {
      if (checkStop()) {
        return;
      }

      this.logger.log(`Загрузка объявлений со страницы ${page}`, id);

      const cianAnnouncementsResponse = await this.api.getAnnouncements({
        city,
        kind,
        page,
        proxy,
      });

      await sleep(20);

      if ('error' in cianAnnouncementsResponse) {
        if (cianAnnouncementsResponse.error === '404-not-found') {
          return;
        }

        this.rentObjectService.logSkipRentObjectParse({
          id,
          timestamp,
          cause: 'error-page',
          source: 'cian',
          description: `[SkipPage] [${cianAnnouncementsResponse.error}] ${cianAnnouncementsResponse.message}`,
          meta: {
            kind,
            city,
            page,
          },
        });
        continue;
      }

      const cianAnnouncements = cianAnnouncementsResponse.ok.data;

      if (!cianAnnouncements.offersSerialized.length) {
        this.logger.log(`Пропускаем пустую страницу ${page}`, id);
        return;
      }

      const { notExisted } = await this.rentObjectCheckerService.groupedItems({
        items: cianAnnouncements.offersSerialized as Record<string, any>[],
        source: 'cian',
        getIdFromItem: (item) => item.cianId,
      });

      if (notExisted.length === 0) {
        this.logger.log(
          `Все объекты среди ${cianAnnouncements.offersSerialized.length} найденных уже существуют`,
          id,
        );
        continue;
      }

      for (const item of notExisted) {
        if (checkStop()) {
          return;
        }

        const extractor = new CianExtractor({ item });

        this.logger.log(`Попытка загрузить фотографии ${item.cianId}`, id);

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
            source: 'youla',
            cause: 'error-photos',
            description: `[SkipItem] [${maybePhotos.error}] ${maybePhotos.message ?? ''}`,
            rentId: item.cianId,
            meta: {
              kind,
              city,
              item,
              page,
              proxy,
            },
          });
          continue;
        }

        this.logger.log(
          `Попытка построить объект RentObject ${item.cianId}`,
          id,
        );

        const maybeRentObject = this.buildRentObject({
          startRegion: city.region,
          startCity: city.name,

          extractor,

          photos: maybePhotos.ok,
        });

        if ('error' in maybeRentObject) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            source: 'cian',
            description: `[SkipItem] ${maybeRentObject.message}`,
            cause: maybeRentObject.error,
            meta: {
              kind,
              city,
              item,
            },
          });
          continue;
        }

        try {
          this.logger.log(
            `Попытка опубликовать объект RentObject ${item.cianId}`,
            id,
          );
          await this.rentObjectService.publishRentObject({
            id,
            timestamp,
            source: 'cian',
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

    extractor: CianExtractor;

    photos?: RentObjectPhoto[];
  }):
    | {
        rentObject: RentObject;
      }
    | {
        error: string;
        message?: string;
      } {
    try {
      const { startRegion, startCity } = props;
      const { extractor } = props;

      if (
        parseFloat(extractor.item.bargainTerms.agentFee) > 0 ||
        parseFloat(extractor.item.bargainTerms.clientFee) > 0
      ) {
        return {
          error: 'agent',
          message: 'Пропускаем агентские объявления (Объявления с коммисией)',
        };
      }

      const objectType = extractor.objectType();
      if (!objectType) {
        return {
          error: 'object-type-not-found',
          message: `не известный тип объекта`,
        };
      }

      const description = extractor.description();
      if (!description.city) {
        /// TODO: решить нужно ли это (тут мы попали не в указанный город, а соседнию республику/край)
        return {
          error: 'wrong-city',
          message: 'Объект находится за пределами города',
        };
      }

      const phone = extractor.phone();
      const storey = extractor.storey();
      const areas = extractor.areas();
      const deposit = extractor.deposit();
      const address = extractor.address();
      const seller = extractor.seller();

      const totalArea =
        areas.area ||
        (areas.areaKitchen || 0) + (areas.areaLiving || 0) ||
        null;

      const totalAreaString =
        typeof totalArea === 'number' && totalArea > 0
          ? totalArea.toFixed(2).split(/\.?0+$/)[0] + ' м², '
          : '';

      const title =
        `${objectType}, ` +
        totalAreaString +
        `${storey.storey || ''}/${storey.storeyNumber || ''} этаж`;

      const rentObject: RentObject = {
        photos: props.photos ?? [],

        region: startRegion,
        city: startCity,

        foreignId: description.id,
        src: description.url,
        description: description.description,
        phone: phone.phone,
        storey: storey.storey,
        storeyNumber: storey.storeyNumber,
        objectType: objectType,
        area: areas.area,
        areaKitchen: areas.areaKitchen,
        areaLiving: areas.areaLiving,
        price: deposit.price,
        deposit: deposit.deposit,
        /// TODO: Понять как считать коммисию, так как мы пропускаем объекты с коммиссиями
        fee: 0,
        name: seller.seller,
        title: title,
        district: address.district,
        houseNumber: address.houseNumber,
        street: address.street,
      };

      return { rentObject };
    } catch (error) {
      return { error: 'error-extractor', message: error.message };
    }
  }
}
