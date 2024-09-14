import { RentObject } from '@types';

export type RentObjectServiceContract = {
  publishRentObject(props: {
    id: string;
    timestamp: number;
    source: string;
    rentObject: RentObject;
    meta?: Record<string, any>;
  }): Promise<void>;

  /// TODO: этот метод походу не должен быть здесь
  logSkipRentObjectParse(props: {
    id: string;
    timestamp: number;
    source: string;
    description: string;
    cause: string;
    rentId?: string;
    meta?: Record<string, any>;
  }): void;
};
