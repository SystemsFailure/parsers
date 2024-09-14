import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ProxyServersService } from './proxy-servers.service';
import { ProxyServersServiceMock } from './proxy-servers.service.mock';

import { TOKEN_PROXIES_MOCK, TOKEN_CRM_RPC_REST } from './tokens';

@Module({})
export class ProxyServersModule {
  /**
   * Продовая версия модуля
   */
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: ProxyServersModule,
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
          provide: ProxyServersService,
          useClass: ProxyServersService,
        },
      ],
      exports: [ProxyServersService],
    };
  }

  /**
   * Моковая версия модуля
   *
   * Грузит прокси из файла .env.local из строки DEV_PROXIES
   */
  static forMock(): DynamicModule {
    return {
      global: true,
      module: ProxyServersModule,
      providers: [
        {
          provide: TOKEN_PROXIES_MOCK,
          inject: [ConfigService],
          useFactory(configService: ConfigService) {
            const proxiesStr: void | string = configService.get('DEV_PROXIES');
            const proxies =
              proxiesStr &&
              proxiesStr
                .split('\n')
                .map((el) => el.trim())
                .filter((id) => id);

            return { proxies };
          },
        },
        {
          provide: ProxyServersService,
          useClass: ProxyServersServiceMock,
        },
      ],
      exports: [ProxyServersService],
    };
  }
}
