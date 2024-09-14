import { Injectable } from '@nestjs/common';
import { sleep } from '@utils';

import { RentObjectPhotosService } from './rent-object-photos.service';

type Params = {
  getOriginalPhotosUrls: () => string[] | Promise<string[]>;
  downloadPhoto: (props: { originalPhotoUrl: string }) => Promise<Buffer>;
  delayPerPhotoSec: number;
};

@Injectable()
export class RentObjectPhotosUploaderService {
  constructor(
    private readonly rentObjectPhotosService: RentObjectPhotosService,
  ) {}

  /**
   * Обёртка над сервисом RentObjectPhotosService, нужно чтобы не дублировать
   * этот код в каждом из парсеров
   */
  public async uploadPhotos(props: Params) {
    try {
      const originalPhotoUrls = await props.getOriginalPhotosUrls();

      const { existed, notExisted } =
        await this.rentObjectPhotosService.checkExistedPhotos({
          originalPhotoUrls,
        });

      const originalPhotosMap = new Map<string, Buffer>();

      for (const originalPhotoUrl of notExisted) {
        try {
          const binary = await props.downloadPhoto({
            originalPhotoUrl,
          });
          originalPhotosMap.set(originalPhotoUrl, binary);
        } catch (error) {
          if ('response' in error && error.response) {
            if (error.response?.status === 404) {
              continue;
            }
          }
          throw error;
        }

        await sleep(props.delayPerPhotoSec);
      }

      const { photos } = await this.rentObjectPhotosService.uploadPhotos({
        photos: notExisted.map((originalPhotoUrl) => {
          return {
            originalPhotoUrl,
            binary: originalPhotosMap.get(originalPhotoUrl),
          };
        }),
      });

      /**
       * Мы добавляем в результаты уже существующие фотографии и новые загруженные,
       * так как пользователь функции ничего не знает о том, что фотографии могли быть уже загруженны
       */
      const resultPhotos = [existed, photos].flat();
      return { ok: resultPhotos };
    } catch (error) {
      return { error, message: error.message };
    }
  }
}
