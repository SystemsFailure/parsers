import { Injectable } from '@nestjs/common';
import { RentObject } from '@types';

import * as fs from 'fs/promises';

import { RentObjectServiceContract } from './contract';

/**
 * Моковый сервис который пишет данные в папку .testclient/rent-object-mock
 */

@Injectable()
export class RentObjectServiceMock implements RentObjectServiceContract {
  /**
   * Записывает результат парсинга в папку с именем \
   * `.testclient/rent-object-mock/parsed_{job-timestamp}_${source}_{job-id} \`
   *
   * В файл с именем \
   * `p_{publish-timestamp}_{rentObject.foreignId}.json` \
   *
   * Где префикс 'p_' указывает, что это удачный парсинг
   */
  public async publishRentObject(props: {
    id: string;
    timestamp: number;
    source: string;
    rentObject: RentObject;
    meta?: Record<string, any>;
  }): Promise<void> {
    const nestjsRMQObject = {
      pattern: props.source,
      data: {
        ...props,
        timestampPublish: Date.now(),
      },
    };

    const group = `parsed_${props.timestamp}_${props.source}_${props.id}`;
    const filename = `p_${nestjsRMQObject.data.timestampPublish}_${nestjsRMQObject.data.rentObject.foreignId}.json`;

    fs.mkdir(`./.testclient/rent-object-mock/${group}`, { recursive: true })
      .then(() =>
        fs.writeFile(
          `./.testclient/rent-object-mock/${group}/${filename}`,
          JSON.stringify(nestjsRMQObject, null, 2),
        ),
      )
      .catch(() => void 0);
  }

  /**
   * Записывает результат парсинга в папку с именем \
   * `.testclient/rent-object-mock/parsed_{job-timestamp}_${source}_{job-id} \`
   *
   * В файл с именем \
   * `s_{publish-timestamp}.json` \
   *
   * Где префикс 's_' указывает, что это удачный парсинг
   */
  public logSkipRentObjectParse(props: {
    id: string;
    timestamp: number;
    source: string;
    description: string;
    cause: string;
    rentId?: string;
    meta?: Record<string, any>;
  }) {
    const object = {
      ...props,
      timestampSkip: Date.now(),
    };

    const group = `parsed_${props.timestamp}_${props.source}_${props.id}`;
    const filename = `s_${object.timestampSkip}_${props.rentId ? `${props.rentId}_` : ''}${object.cause}.json`;

    fs.mkdir(`./.testclient/rent-object-mock/${group}`, {
      recursive: true,
    })
      .then(() =>
        fs.writeFile(
          `./.testclient/rent-object-mock/${group}/${filename}`,
          JSON.stringify(object, null, 2),
        ),
      )
      .catch(() => void 0);

    return { logid: `${group}/${filename}` };
  }
}
