import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { IS_DEV, MOCK_FLAGS } from '@app/flags';
import { PlaywrightModule } from '@app/playwright';
import { ProxyServersModule } from '@app/proxy-servers';
import { RentObjectModule } from '@app/rent-object';
import { RentObjectCheckerModule } from '@app/rent-object-checker';
import { GeocordModule } from '@app/geocord';
import { RentObjectPhotosModule } from '@app/rent-object-photos';

import { ParserV1Module } from './parser-v1';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PlaywrightModule.forRoot({
      isGlobal: true,
      launchOptions: {
        headless: IS_DEV ? false : true,
        proxy: {
          server: 'https://any.any',
        },
      },
    }),
    GeocordModule,

    MOCK_FLAGS.RENT_OBJECT_CHECKER
      ? RentObjectCheckerModule.forMock()
      : RentObjectCheckerModule.forRoot(),
    MOCK_FLAGS.RENT_OBJECT
      ? RentObjectModule.forMock()
      : RentObjectModule.forRoot(),
    MOCK_FLAGS.PROXY_SERVERS
      ? ProxyServersModule.forMock()
      : ProxyServersModule.forRoot(),
    MOCK_FLAGS.RENT_OBJECT_PHOTOS
      ? RentObjectPhotosModule.forMock()
      : RentObjectPhotosModule.forRoot(),

    ParserV1Module,
  ],
})
export class AvitoModule {}
