import { Injectable } from '@nestjs/common';

import { RentObjectCheckerServiceContract } from './contract';

@Injectable()
export class RentObjectCheckerServiceMock extends RentObjectCheckerServiceContract {
  /**
   * Всегда возвращает информацию, что объектов не существует
   */
  public async checkExistedRentObjectIds(props: {
    rentObjectIds: string[];
  }): Promise<{ notExistedIds: Set<string>; existedIds: Set<string> }> {
    return {
      notExistedIds: new Set<string>(props.rentObjectIds),
      existedIds: new Set<string>([]),
    };
  }
}
