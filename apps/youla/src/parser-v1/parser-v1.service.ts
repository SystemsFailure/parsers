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

import { YoulaExtractor } from './extractor.class';
import { YoulaApi } from './api.class';

const YOULA_PAGINATE_START_PAGE = 0;

export type ParserOptions = {
  city: {
    region: string;
    name: string;
    uuid: string;
  };
  category: {
    type: string;
  };
  pages: number;
  offset?: number;
};

@Injectable()
export class ParserV1Service {
  private readonly logger = new Logger(`Youla::${ParserV1Service.name}`);

  private api = new YoulaApi();

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
    options: ParserOptions & {
      id: string;
      timestamp: number;
      checkStop: () => boolean;
    },
  ): Promise<void> {
    const id = options.id;
    const timestamp = options.timestamp;

    const city = options.city;
    const category = options.category.type;
    const countPages = options.pages;
    const checkStop = options.checkStop;
    const offset = options.offset ?? 0;

    ///

    const proxy = await this.proxyServersService.getRandomProxyServer('ro');

    let hasNextPage = true;
    for (
      let page = YOULA_PAGINATE_START_PAGE + offset;
      hasNextPage && page < countPages;
      ++page
    ) {
      if (checkStop()) {
        return;
      }

      this.logger.log(`Загрузка объявлений со страницы ${page}`, id);

      const announcementsResponse = await this.api.getAnnouncements({
        category,
        cityId: city.uuid,
        page,
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
          source: 'youla',
          cause: 'error-pages',
          description: `[SkipPage] [${announcementsResponse.error}] ${announcementsResponse.message ?? ''}`,
          meta: {
            city,
            category,
            page,
            proxy,
          },
        });
        continue;
      }

      hasNextPage = announcementsResponse.ok.hasNextPage;

      ///

      const vaildItems = announcementsResponse.ok.items.filter((product) => {
        /**
         * Фильтруем пустые объекты и объекты из других городов
         * (это можно даже не логировать)
         */

        const hasItem = product && product.id;
        if (!hasItem) {
          return false;
        }

        const rightCity = product.location.cityName === city.name;
        if (!rightCity) {
          return false;
        }

        return true;
      });

      const { notExisted } = await this.rentObjectCheckerService.groupedItems({
        items: vaildItems,
        source: 'youla',
        getIdFromItem: (item) => item.id,
      });

      if (notExisted.length === 0) {
        this.logger.log(
          `Все объекты среди ${vaildItems.length} найденных и валидных уже существуют`,
        );
        continue;
      }

      for (const item of notExisted) {
        if (checkStop()) {
          return;
        }

        this.logger.log(`Попытка загрузить объект объявления ${item.id}`, id);

        const fullItemResponse = await this.api.getAnnouncement({
          url: `https://youla.ru${item.url}`,
          proxy,
        });

        await sleep(30);

        if ('error' in fullItemResponse) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            source: 'youla',
            cause: 'error-item',
            description: `[SkipItem] [${fullItemResponse.error}] ${fullItemResponse.message ?? ''}`,
            meta: {
              city,
              category,
              page,
              proxy,
            },
          });
          continue;
        }

        const extractor = new YoulaExtractor({ fullItem: fullItemResponse.ok });

        /// Обработка фотографий

        this.logger.log(`Попытка загрузить фотографии ${item.id}`, id);

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
            meta: {
              city,
              category,
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

        /// Построение и публикация объекта

        this.logger.log(`Попытка построить объект RentObject ${item.id}`, id);

        const maybeRentObject = this.buildRentObject({
          startCity: city.name,
          startRegion: city.region,

          extractor,

          photos: maybePhotos.ok,
          geocordAddress: geocordAddress as GeocoderAddress,
        });

        /**
         * Ошибка при экстрактинге данных
         *
         * может происходить, если объект сервисе не соответсвует ожидаемому,
         * изменилось api, либо мы не достаточно хорошо поняли работу сервиса
         */
        if ('error' in maybeRentObject) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            cause: maybeRentObject.error,
            description: `[SkipItem] ${maybeRentObject.message}`,
            source: 'youla',
            meta: {
              city,
              category,
              page,
              item,
              proxy,
            },
          });
          continue;
        }

        /**
         * Объект RentObject на основе полученных данных из разных источников
         * (Youla, Nominatim)
         */
        const { rentObject } = maybeRentObject;

        try {
          this.logger.log(
            `Попытка опубликовать объект RentObject ${item.id}`,
            id,
          );
          await this.rentObjectService.publishRentObject({
            id,
            timestamp,
            source: 'youla',
            rentObject,
            meta: {
              proxy,
              geocordAddress,
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

    extractor: YoulaExtractor;

    photos?: RentObjectPhoto[];
    geocordAddress?: GeocoderAddress;
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
      const { geocordAddress } = props;

      const attributeIsAgent = extractor.fullItem.attributes.find(
        (el: any) => el.slug === 'sobstvennik_ili_agent',
      );

      if (attributeIsAgent && attributeIsAgent.rawValue === 'Агент') {
        return { error: 'agent', message: 'Пропускаем агентские объявления' };
      }

      const description = extractor.description();
      const objectType = extractor.objectType();
      const seller = extractor.seller();
      const areas = extractor.areas();
      const deposit = extractor.deposit();
      const storey = extractor.storey();

      const rentObject: RentObject = {
        photos: props.photos || [],

        region: startRegion,
        city: startCity,

        district: null,
        street: null,
        houseNumber: null,

        foreignId: description.id,
        src: description.url,
        title: description.title,
        description: description.description,
        objectType: objectType,
        name: seller.seller,
        area: areas.area,
        areaKitchen: areas.areaKitchen,
        areaLiving: areas.areaLiving,
        price: deposit.price,
        deposit: deposit.deposit,
        storey: storey.storey,
        storeyNumber: storey.storeyNumber,
        fee: 0,
        /// Номер телефона в Юле можно получить только будущи авторизированным
        phone: null,
      };

      /**
       * Заполняем адрес
       */
      const primitiveAddress = extractor.address();

      rentObject.district = geocordAddress?.district;
      rentObject.street = geocordAddress?.street || primitiveAddress.streetName;
      rentObject.houseNumber =
        geocordAddress?.houseNumber || primitiveAddress.houseNumber;

      return { rentObject };
    } catch (error) {
      return {
        error: 'error-extract' as const,
        message: error.message as string,
      };
    }
  }
}
