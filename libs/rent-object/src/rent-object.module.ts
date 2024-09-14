import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { RentObjectService } from './rent-object.service';
import { RentObjectServiceMock } from './rent-object.service.mock';

import { TOKEN_RMQ_CLIENT } from './tokens';

const RMQ_QUEUE = 'rent_objects';

@Module({
  providers: [Logger],
})
export class RentObjectModule {
  /**
   * Продовая версия модуля
   */
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: RentObjectModule,
      imports: [
        ClientsModule.registerAsync({
          isGlobal: true,
          clients: [
            {
              name: TOKEN_RMQ_CLIENT,
              inject: [ConfigService],
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              /// @ts-expect-error
              async useFactory(configService: ConfigService) {
                return {
                  transport: Transport.RMQ,
                  options: {
                    urls: [configService.getOrThrow('RMQ_URL')],
                    queue: RMQ_QUEUE,
                    queueOptions: {
                      durable: false,
                      messageTtl: 1000 * 60 * 60 * 0.5,
                    },
                    serializer: {
                      /**
                       * Без этого не отправляются сообщения в очередь (в очередь на сервере `develop`)
                       * На локальном сервере работает корректно, возможно в самой очерди rabbitmq,
                       * есть ограничение на размеры json, но вы об этом не узнаете, так как ошибок
                       * nestjs вам не даст
                       *
                       * Используйте голый rabbitmq, а не через nestjs, второй раз убеждаюсь, что это очевиднее работает
                       *
                       * (возможно nestjs под капотом глушит ошибку???)
                       */
                      serialize: (val) => JSON.stringify(val),
                    },
                  },
                };
              },
            },
          ],
        }),
      ],
      providers: [
        {
          provide: RentObjectService,
          useClass: RentObjectService,
        },
      ],
      exports: [RentObjectService],
    };
  }

  /**
   * Моковая версия модуля
   */
  static forMock(): DynamicModule {
    return {
      global: true,
      module: RentObjectModule,
      providers: [
        {
          provide: RentObjectService,
          useClass: RentObjectServiceMock,
        },
      ],
      exports: [RentObjectService],
    };
  }
}
