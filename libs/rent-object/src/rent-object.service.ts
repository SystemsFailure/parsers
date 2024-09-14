import * as uuid from 'uuid';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RentObject } from '@types';

import { RentObjectServiceContract } from './contract';
import { TOKEN_RMQ_CLIENT } from './tokens';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RentObjectService implements RentObjectServiceContract {
  constructor(
    @Inject(TOKEN_RMQ_CLIENT) private rentObjects: ClientProxy,
    private logger: Logger,
  ) {}

  /**
   * Публикует результат парсинга в `rabbitmq`
   */
  public async publishRentObject(props: {
    id: string;
    timestamp: number;
    source: string;
    rentObject: RentObject;
    // пропускаем в prod моде
    meta?: Record<string, any>;
  }): Promise<void> {
    const lid = uuid.v1();
    this.logger.log(`Публикуем объект ${props.rentObject.foreignId}`, lid);
    this.logger.debug(props, lid);
    await lastValueFrom(
      this.rentObjects.emit(props.source, {
        id: props.id,
        timestamp: props.timestamp,
        timestampPublish: Date.now(),
        source: props.source,
        rentObject: this.prepareRentObject({ rentObject: props.rentObject }),
      }),
    );
  }

  private prepareRentObject(props: { rentObject: RentObject }) {
    if (props.rentObject.district) {
      props.rentObject.district = props.rentObject.district?.replace(
        /обл\.|об./,
        'область',
      );

      if (
        props.rentObject.region === 'Москва область' ||
        props.rentObject.region === 'Московская область'
      ) {
        props.rentObject.region = 'Московская область';
      } else if (props.rentObject.region === 'Краснодар') {
        props.rentObject.region = 'Краснодарский край';
      } else if (props.rentObject.region === 'Ростов-на-Дону') {
        props.rentObject.region = 'Ростовская область';
      } else if (props.rentObject.region === 'Адыгея') {
        props.rentObject.region = 'Республика Адыгея';
      }
    }
    return props.rentObject;
  }

  /**
   * Логирует причину пропуска объекта парсинга
   */
  public logSkipRentObjectParse(props: {
    id: string;
    timestamp: number;
    source: string;
    description: string;
    cause: string;
    rentId?: string;
    meta?: Record<string, any>;
  }): void {
    const lid = uuid.v1();
    this.logger.warn(
      `Пропущен объект парсинга ${props.rentId ?? ''} (${props.cause})`,
      lid,
    );
    this.logger.debug(
      `Пропущен объект парсинга ${props.rentId ?? ''} (${props.cause})`,
      {
        rentId: props.rentId || null,
        description: props.description,
        cause: props.cause,
        parseProccessId: props.id,
        timestamp: props.timestamp,
        timestampSkip: Date.now(),
        source: props.source,
        meta: props.meta,
      },
      lid,
    );
  }
}
