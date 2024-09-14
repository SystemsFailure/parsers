import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3';

import { RentObjectPhotosService } from './rent-object-photos.service';
import { RentObjectPhotosServiceMock } from './rent-object-photos.service.mock';

import { RentObjectPhotosUploaderService } from './rent-object-photos-uploader.service';

import { TOKEN_ENV_S3_PARAMS, S3Params } from './tokens';

const RENT_OBJECT_PHOTO_FOLDER = 'rent';

/**
 * По сути это модуль для поставки параметров из .env файла
 *
 * В целом это валидный модуль в NestJS
 */
const S3_PARAMS_MODULE = {
  global: true,
  /** Это просто хак системы типов */
  module: class {},
  providers: [
    {
      provide: TOKEN_ENV_S3_PARAMS,
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        const s3Params: S3Params = {
          bucket: configService.getOrThrow('S3_BUCKET'),
          endpoint: configService.getOrThrow('S3_ENDPOINT'),
          region: configService.getOrThrow('S3_REGION'),
          key: configService.getOrThrow('S3_KEY'),
          secret: configService.getOrThrow('S3_SECRET'),
          folder: RENT_OBJECT_PHOTO_FOLDER,
        };
        return s3Params;
      },
    },
  ],
  exports: [TOKEN_ENV_S3_PARAMS],
};

@Module({})
export class RentObjectPhotosModule {
  /**
   * Продовая версия модуля
   */
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: RentObjectPhotosModule,
      imports: [
        S3_PARAMS_MODULE,
        /**
         * Поставка S3 объекта
         */
        S3Module.forRootAsync({
          inject: [TOKEN_ENV_S3_PARAMS],
          useFactory(s3Params: S3Params) {
            return {
              config: {
                credentials: {
                  accessKeyId: s3Params.key,
                  secretAccessKey: s3Params.secret,
                },
                region: s3Params.region,
                endpoint: s3Params.endpoint,
              },
            };
          },
        }),
      ],
      providers: [
        {
          provide: RentObjectPhotosService,
          useClass: RentObjectPhotosService,
        },
        {
          provide: RentObjectPhotosUploaderService,
          useClass: RentObjectPhotosUploaderService,
        },
      ],
      exports: [RentObjectPhotosUploaderService],
    };
  }

  /**
   * Моковая версия модуля
   */
  static forMock(): DynamicModule {
    return {
      global: true,
      module: RentObjectPhotosModule,
      providers: [
        {
          provide: RentObjectPhotosService,
          useClass: RentObjectPhotosServiceMock,
        },
        {
          provide: RentObjectPhotosUploaderService,
          useClass: RentObjectPhotosUploaderService,
        },
      ],
      exports: [RentObjectPhotosUploaderService],
    };
  }
}
