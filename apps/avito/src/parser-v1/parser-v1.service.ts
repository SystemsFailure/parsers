import * as uuid from 'uuid';
import { Injectable, Logger } from '@nestjs/common';
import { Page, errors } from 'playwright';
import { RentObject, RentObjectPhoto } from '@types';
import { sleep } from '@utils';

import { PlaywrightService } from '@app/playwright';
import { ProxyServersService } from '@app/proxy-servers';
import { RentObjectService } from '@app/rent-object';
import { RentObjectCheckerService } from '@app/rent-object-checker';
import { jobRunner } from '@app/job-runner';
import { GeocordService } from '@app/geocord';
import { RentObjectPhotosUploaderService } from '@app/rent-object-photos';

import {
  parseAnnouncements,
  parseAnnouncementsPaginate,
  parseViewdata,
  ParserError,
  ParserManyRequestsError,
} from './parsers';
import { AvitoExtractor } from './extractor';
import { tryExtractPhone } from './image-extract';
import { AvitoApi } from './api.class';

const AVITO_PAGINATE_START_PAGE = 1;

export type ParserOptions = {
  city: {
    region: string;
    name: string;
    link: string;
  };
  category: {
    name: string;
    url: string;
  };
  pages?: number;
  offset?: number;
};

@Injectable()
export class ParserV1Service {
  private readonly logger = new Logger(`Avito::${ParserV1Service.name}`);

  private api = new AvitoApi();

  constructor(
    private readonly playwrightService: PlaywrightService,
    private readonly proxyServersService: ProxyServersService,
    private readonly geocordService: GeocordService,
    private readonly rentObjectService: RentObjectService,
    private readonly rentObjectCheckerService: RentObjectCheckerService,
    private readonly rentObjectPhotosUploaderService: RentObjectPhotosUploaderService,
  ) {}

  /**
   * Метод запуска задачи на парсинг
   */
  public startJobParseAnnouncements(props: {
    options: ParserOptions[];
    name?: string;
    /**
     * Метод используется для проверки необходимости остановить задачу
     */
    checkStop?: () => boolean;
  }) {
    const id = uuid.v4();
    const timestamp = Date.now();

    this.logger.log(`Инициализация задачи ${props.name || ''}`, id);

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

  /**
   * Главный метод для парсинга объявлений. Загружает страницу с пагинацией,
   * извлекает URL-адреса объявлений и затем парсит каждое объявление
   */
  private async jobParseAnnouncements(
    props: ParserOptions & {
      id: string;
      timestamp: number;
      checkStop: () => boolean;
    },
  ) {
    const { id, timestamp, category, city, checkStop } = props;

    const url = new URL(category.url.replace('{city}', city.link));

    let context = await this.openContext();

    const checkAndRepairContext = async () => {
      if (context.page.isClosed()) {
        try {
          this.logger.log('Страница закрыта, пробую открыть ещё раз', id);
          context.page = await context.context.newPage();
        } catch {
          this.logger.log('Контекст закрыт, пробую открыть ещё раз', id);
          context = await this.openContext();
        }
      }
    };

    try {
      /// Загружаем пагинацию и узнаём сколько всего страниц и есть ли они вообще
      /// Так же это лечит заблоченный ip (страницу с заблоченным ip)
      this.logger.log(`Пытаемся загрузить пагинацию со страницы 1`, id);

      const tryParsed = await this.tryLoadPaginate({
        url,
        context,
      });
      if (!tryParsed) {
        this.logger.warn(
          'Не удалось загрузить пагинацию ' + url.toString(),
          id,
        );
        return;
      } else {
        context = tryParsed.context || context;
      }

      await sleep(30);

      /// Загружаем URL-адреса объявлений

      const countPages = props.pages ?? tryParsed.parsed.pages;
      const offsetPages = props.offset ?? 0;

      for (
        let page = AVITO_PAGINATE_START_PAGE + offsetPages;
        page <= countPages;
        ++page
      ) {
        /** Проверяем не нужно ли прерывать задачу */
        if (checkStop()) {
          return;
        }

        await checkAndRepairContext();

        const urlDup = new URL(url);
        urlDup.searchParams.set('p', `${page}`);

        this.logger.log(
          `Пытаемся распарсить страницу ${page} на ${urlDup.toString()} (для получения URL-адресов)`,
          id,
        );

        const pagesLoadedResponse = await this.gotoScanmap({
          page: context.page,
          url: urlDup.toString(),
          scanmap: parseAnnouncements,
          gotoOptions: {
            waitUntil: 'domcontentloaded',
            timeout: 30_000,
          },
        });

        await sleep(30);

        if ('error' in pagesLoadedResponse) {
          this.rentObjectService.logSkipRentObjectParse({
            id,
            timestamp,
            cause: pagesLoadedResponse.error,
            source: 'avito',
            description: `[SkipPage] [${pagesLoadedResponse.error}] ${pagesLoadedResponse.message}`,
            meta: {
              category,
              city,
              page: page,
              urlPage: urlDup.toString(),
            },
          });
          continue;
        }

        const pagesLoaded = pagesLoadedResponse.ok;
        const { parsed: announcements } = pagesLoaded;

        if (announcements.length === 0) {
          this.logger.log('Пропускаем пустую страницу', id);
          break;
        }

        const { notExisted } = await this.rentObjectCheckerService.groupedItems(
          {
            items: announcements,
            source: 'avito',
            getIdFromItem: (item) => '' + item.id,
          },
        );

        if (notExisted.length === 0) {
          this.logger.log(
            `Все объекты среди ${announcements.length} найденных уже существуют`,
            id,
          );
          continue;
        }

        /// Парсинг объявлений

        for (const announcement of notExisted) {
          /** Проверяем не нужно ли прерывать задачу */
          if (checkStop()) {
            return;
          }

          await checkAndRepairContext();

          this.logger.log(
            'Пробуем распарсить объявление ' + announcement.url,
            id,
          );

          const viewdataResponse = await this.gotoScanmap({
            page: context.page,
            url: announcement.url,
            scanmap: parseViewdata,
            gotoOptions: {
              waitUntil: 'domcontentloaded',
              timeout: 30_000,
            },
          });

          await sleep(30);

          if ('error' in viewdataResponse) {
            this.rentObjectService.logSkipRentObjectParse({
              id,
              timestamp,
              cause: viewdataResponse.error,
              source: 'avito',
              description: `[SkipItem] [${viewdataResponse.error}] ${viewdataResponse.message}`,
              rentId: announcement.id + '',
              meta: {
                category,
                city,
                page: page,
                urlPage: urlDup.toString(),
                urlItem: announcement.url,
              },
            });
            continue;
          }

          this.logger.log(
            'Пробуем распарсить телефон в объявления ' + announcement.id,
            id,
          );

          const viewdata = viewdataResponse.ok.parsed;
          let phone = await this.browserExtractPhone(context.page);

          if (!phone.phone && phone.hasWayGet) {
            this.logger.warn(
              `Не удалось распарсить телефон в объявлении ${announcement.id} (${phone.message})`,
              id,
            );
            this.logger.log('Пробую ещё раз получить номер телефона', id);

            phone = await this.browserExtractPhone(context.page, 30);

            if (!phone.phone) {
              this.rentObjectService.logSkipRentObjectParse({
                id,
                timestamp,
                cause: 'error-phone',
                source: 'avito',
                description: `[SkipItem] [error-phone] ${phone.message}`,
                meta: {
                  category,
                  city,
                  page: page,
                  urlPage: urlDup.toString(),
                  urlItem: announcement.url,
                },
              });
              continue;
            }
          } else {
            this.logger.log(
              `У объявления ${announcement.id} не обнаружен телефон ${phone.message}`,
              id,
            );
          }

          const extractor = new AvitoExtractor({
            viewdata,
            region: city.region,
            city: city.name,
          });

          this.logger.log(
            `Попытка загрузить фотографии ${announcement.id}`,
            id,
          );

          const maybePhotos =
            await this.rentObjectPhotosUploaderService.uploadPhotos({
              getOriginalPhotosUrls: () => extractor.photos(),
              downloadPhoto: async ({ originalPhotoUrl }) => {
                const proxy =
                  await this.proxyServersService.getRandomProxyServer();
                return this.api.downloadPhoto({
                  url: originalPhotoUrl,
                  proxy,
                });
              },
              delayPerPhotoSec: 0,
            });
          await sleep(30);

          if ('error' in maybePhotos) {
            this.rentObjectService.logSkipRentObjectParse({
              id,
              timestamp,
              source: 'avito',
              cause: 'error-photos',
              description: `[SkipItem] [${maybePhotos.error}] ${maybePhotos.message ?? ''}`,
              rentId: announcement.id + '',
              meta: {
                category,
                city,
                page: page,
                urlPage: urlDup.toString(),
                urlItem: announcement.url,
              },
            });
            continue;
          }

          /// Получение дополнительных данных, если получиться/если они есть

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
              source: 'avito',
              description: `[SkipItem] [${maybeRentObject.error}] ${maybeRentObject.message}`,
              cause: maybeRentObject.error,
              meta: {
                url: announcement.url,
                viewdata,
              },
            });
            continue;
          }

          const { rentObject } = maybeRentObject;
          rentObject.phone = Number(phone.phone) || null;

          try {
            this.logger.log(
              `Попытка опубликовать объект RentObject ${rentObject.foreignId}`,
              id,
            );
            await this.rentObjectService.publishRentObject({
              id,
              timestamp,
              source: 'avito',
              rentObject,
              meta: {
                viewdata,
              },
            });
          } catch (error) {
            const lid = uuid.v1();
            this.logger.error(
              'Ошибка при публикации объявления: ' + error?.message,
              lid,
            );
            this.logger.debug(error, lid);
          }
        }
      }
    } catch (error) {
      const lid = uuid.v1();
      this.logger.error(
        'Ошибка процесса парсинга (вероятно упал контекст/страница/браузер): ' +
          error?.message,
        lid,
      );
      this.logger.debug(error, lid);
    } finally {
      await context.close().catch((error) => {
        const lid = uuid.v1();
        this.logger.error(
          'Ошибка закрытия контекста браузера: ' + error?.message,
          lid,
        );
        this.logger.debug(error, lid);
      });
    }
  }

  /**
   * Загружает пагинацию со страницы
   *
   * Алгоритм работы:
   * 1. Загрузить страницу
   * 2. Перезагрузить страницу через 5 сек и подождать ещё 10 сек (помогает если стартуем со страницы где ip заблочен - выявлено опытным путём)
   * 3. Если попали на страницу с заблоченым ip, то ждём 100 сек и меняем прокси
   * 4. Если всё ок и удалось получить данные, то возвращаем их и новый прокси (если была необходимость его получить)
   * 5. В случаи неудача job'а считается проваленной
   *
   * Основной смысл функции в шагах 2 и 3
   */
  private async tryLoadPaginate(props: {
    url: URL;
    context: Awaited<ReturnType<ParserV1Service['openContext']>>;
  }) {
    const { url, context } = props;

    const tryParsed = await this.gotoScanmap({
      page: context.page,
      url: url.toString(),
      scanmap: parseAnnouncementsPaginate,
      gotoOptions: {
        waitUntil: 'load',
        timeout: 50_000,
      },
      alwaysReloadSec: 5,
    });

    const maybeResult: {
      parsed: {
        pages: number;
      };
      context: void | typeof context;
    } = {
      context: null,
      parsed: null,
    };

    if ('error' in tryParsed) {
      await sleep(100);

      const secondTryParsed = await this.gotoScanmapMaybeWithNewContext({
        context: props.context,
        url: url.toString(),
        scanmap: parseAnnouncementsPaginate,
        gotoOptions: {
          waitUntil: 'load',
          timeout: 50_000,
        },
        tryes: 3,
      });

      maybeResult.parsed = secondTryParsed.result.parsed as any;
      maybeResult.context = secondTryParsed.context;
    } else {
      maybeResult.parsed = tryParsed.ok.parsed as any;
    }

    if (!maybeResult.parsed) {
      return;
    }
    return maybeResult;
  }

  /// Технический код

  /**
   * Новый контекст браузера с другим прокси
   */
  private async openContext() {
    const proxy = await this.proxyServersService.getRandomProxyServer('ro');
    const context = await this.playwrightService.createContext({
      proxy: {
        server: `${proxy.host}:${proxy.port}`,
        username: proxy.username,
        password: proxy.password,
      },
    });

    const loggerPageClosed = () => {
      this.logger.error(
        `Произошло закрытие страницы, инициированное не процессом парсинга`,
      );
    };
    const loggerPageCrash = () => {
      this.logger.error(`Страница упала (вероятно не хватило памяти)`);
    };
    const loggerContextClosed = () => {
      this.logger.error(
        `Произошло закрытие контекста, инициированное не процессом парсинга`,
      );
    };

    try {
      const page = await context.newPage();

      context.on('close', loggerContextClosed);
      page.on('close', loggerPageClosed);
      page.on('crash', loggerPageCrash);

      const close = async () => {
        context.off('close', loggerContextClosed);
        page.off('close', loggerPageClosed);
        page.off('crash', loggerPageCrash);

        this.logger.log(
          'Инициализированно плановое закрытие контекста браузера',
        );

        await page.close();
        await context.close();
      };

      return { context, page, close };
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  /**
   * 1. Переход на страницу
   * 2. Загрузка контента и его маппинг (парсинг)
   * 3. Обработка ошибок, чтобы функция не падала с исключениями
   */
  private async gotoScanmap<T>(props: {
    page: Page;
    url: string;
    scanmap: (content: string) => T | Promise<T>;
    gotoOptions?: Parameters<Page['goto']>[1];
    alwaysReloadSec?: number;
  }) {
    try {
      await props.page.goto(props.url, props.gotoOptions);

      /**
       * Этот код называется - `лечение заблоченного ip`
       * нужен только в одном месте программы, но выносить в отдельную функцию
       * не хочется
       *
       * Если мы оказываемся на страницы заблоченого ip (429),
       * то обычная перезагрузка страницы помогает решить проблему!
       */
      if (props.alwaysReloadSec) {
        await sleep(props.alwaysReloadSec);
        await props.page.reload();
        await sleep(10);
      }

      const content = await props.page.content();
      const result = await props.scanmap(content);
      return { ok: result };
    } catch (error) {
      return {
        error: this.errorToCode(error),
        message: error.message,
      } as const;
    }
  }

  /**
   * Тоже что и `gotoScanmap` только пробуем несколько раз менять прокси,
   * если не получиться упадёт с ошибкой
   *
   * (нужно только в одном месте программы)
   */
  private async gotoScanmapMaybeWithNewContext<T>(props: {
    context: Awaited<ReturnType<ParserV1Service['openContext']>>;
    url: string;
    scanmap: (content: string) => T | Promise<T>;
    gotoOptions?: Parameters<Page['goto']>[1];
    tryes: number;
  }) {
    let context = props.context.context;
    let page = props.context.page;
    let tryes = props.tryes;

    const needClosed = [] as (() => Promise<void>)[];

    try {
      while (tryes-- > 0) {
        const result = await this.gotoScanmap({
          page,
          url: props.url,
          scanmap: props.scanmap,
          gotoOptions: props.gotoOptions,
        });

        if (result.ok) {
          const close = needClosed.pop();
          needClosed.push(props.context.close);

          return {
            result: result.ok,
            context:
              props.context.context !== context
                ? {
                    context,
                    page,
                    close,
                  }
                : undefined,
          };
        }

        const newContext = await this.openContext();

        context = newContext.context;
        page = newContext.page;
        needClosed.push(newContext.close);
      }

      throw new Error('Many requests, need a repeat call later');
    } finally {
      for (const close of needClosed) {
        await close();
      }
    }
  }

  /**
   * Вытягивался телефона со страницы объявления
   */
  private async browserExtractPhone(
    page: Page,
    delaysec = 5,
  ): Promise<{
    phone?: string | void;
    hasWayGet?: boolean;
    message?: string;
  }> {
    let imageBinary: Buffer | null = null;
    let phone: string | void = null;

    const getPhoneButton = await page.$(
      'button[data-marker="item-phone-button/card"]',
    );

    if (getPhoneButton) {
      await getPhoneButton.click({
        button: 'left',
        delay: 500,
      });

      await sleep(delaysec);

      const phoneImage = await page.$(
        'img[data-marker="phone-popup/phone-image"]',
      );
      if (phoneImage) {
        const src = await phoneImage.getProperty('src');
        const value = await src.jsonValue();

        if (value) {
          const base64 = value.slice('data:image/png;base64,'.length);
          imageBinary = Buffer.from(base64, 'base64');
        } else {
          return {
            hasWayGet: true,
            message:
              'Не смог достать картинку из элемента (возможно на сайте произошли изменения)',
          };
        }
      } else {
        return {
          hasWayGet: true,
          message:
            'Не смог найти элемент с картинкой (возможно на сайте произошли изменения)',
        };
      }
    } else {
      return {
        hasWayGet: false,
        message: 'Не нашёл кнопку `Показать телефон`',
      };
    }

    for (let i = 0; i < 2; ++i) {
      if (!phone) {
        phone = await tryExtractPhone(imageBinary);
      }
    }

    if (!phone) {
      return {
        hasWayGet: true,
        message: 'Не смог прочитать телефон из картинки',
      };
    }

    return { phone };
  }

  /// Код не связанный с браузером

  private errorToCode(error: unknown) {
    if (error instanceof errors.TimeoutError) {
      return '500-timeout-error';
    }
    if (error instanceof ParserManyRequestsError) {
      return '429-too-many-requests';
    }
    if (error instanceof ParserError) {
      return '500-parse-error';
    }
    return 'unknown';
  }

  /**
   * Строитель `RentObject`
   *
   * Предполагается, что мы выгрузим все нужные данные для строителя,
   * делая его синхронным
   */
  private buildRentObject(props: {
    startRegion: string;
    startCity: string;

    extractor: AvitoExtractor;

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

      const description = extractor.description();
      const areas = extractor.areas();
      const storey = extractor.storey();
      const objectType = extractor.objectType();
      const deposit = extractor.deposit();
      const seller = extractor.seller();

      const commissionInPercent =
        deposit.price && deposit.commission
          ? (deposit.commission / deposit.price) * 100
          : -deposit.commission;

      const rentObject: RentObject = {
        photos: props.photos || [],

        region: startRegion,
        city: startCity,

        district: null,
        houseNumber: null,
        street: null,

        foreignId: description.id + '',
        src: description.url,
        title: description.title,
        description: description.description,
        area: areas.area,
        areaKitchen: areas.areaKitchen,
        areaLiving: areas.areaLiving,
        storey: storey.storey,
        storeyNumber: storey.storeyNumber,
        objectType: objectType,
        price: deposit.price,
        deposit: deposit.deposit,
        fee: commissionInPercent,
        name: seller.seller || 'Арендодатель',
        phone: null,
      };

      /**
       * Заполняем адрес
       */
      const primitiveAddress = extractor.address();

      rentObject.region = extractor.region;
      rentObject.city = extractor.city;
      rentObject.district = primitiveAddress.addressDistrict;
      rentObject.street = primitiveAddress.addressStreet;
      rentObject.houseNumber = primitiveAddress.houseNumber;

      return { rentObject };
    } catch (error) {
      return {
        error: 'error-extract' as const,
        message: error.message as string,
      };
    }
  }
}
