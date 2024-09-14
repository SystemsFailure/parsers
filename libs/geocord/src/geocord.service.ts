import { Injectable, Logger } from '@nestjs/common';
import { GeocoderAddress } from '@types';

import { nominatimGeocoder } from '@utils';

@Injectable()
export class GeocordService {
  private readonly logger = new Logger(GeocordService.name);

  /**
   * Передача параметров через getter тут используется,
   * чтобы обрабатывать ошибки в блоке catch, это проще,
   * чем обрабатывать их в вызывающем модуле, и этого достаточно
   */
  public async tryLoadAddressByGeocord(
    props:
      | {
          getter: () => {
            lat: number;
            lon: number;
          };
        }
      | {
          lat: number;
          lon: number;
        },
  ): Promise<void | GeocoderAddress> {
    let contextkey: string = '';
    try {
      const { lat, lon } = 'getter' in props ? props.getter() : props;

      contextkey = `${lat},${lon}`;

      this.logger.log(
        `Попытка получить геоданные по координатам ${lat}, ${lon}`,
        contextkey,
      );

      const { nominatimAddress, ...address } = await nominatimGeocoder({
        lat,
        lon,
        tryessec: [15, 40, 70],
      });

      this.logger.debug(nominatimAddress, contextkey);

      return address;
    } catch (error) {
      this.logger.debug(
        `Не удачная попытка получить геоданные по координатам`,
        contextkey,
      );
      this.logger.debug(error, contextkey);
      return null;
    }
  }
}
