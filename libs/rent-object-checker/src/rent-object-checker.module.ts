import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RentObjectCheckerService } from './rent-object-checker.service';
import { RentObjectCheckerServiceMock } from './rent-object-checker.service.mock';

import { TOKEN_CRM_RPC_REST } from './tokens';

@Module({})
export class RentObjectCheckerModule {
  /**
   * Продовая версия модуля
   */
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: RentObjectCheckerModule,
      providers: [
        {
          provide: TOKEN_CRM_RPC_REST,
          inject: [ConfigService],
          useFactory(configService: ConfigService) {
            return {
              host: configService.getOrThrow('CRM_RPC_HOST'),
              token: configService.getOrThrow('CRM_RPC_TOKEN'),
            };
          },
        },
        {
          provide: RentObjectCheckerService,
          useClass: RentObjectCheckerService,
        },
      ],
      exports: [RentObjectCheckerService],
    };
  }

  /**
   * Моковая версия модуля
   */
  static forMock(): DynamicModule {
    return {
      global: true,
      module: RentObjectCheckerModule,
      providers: [
        {
          provide: RentObjectCheckerService,
          useClass: RentObjectCheckerServiceMock,
        },
      ],
      exports: [RentObjectCheckerService],
    };
  }
}
