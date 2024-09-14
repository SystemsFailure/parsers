import { Injectable } from '@nestjs/common';

import { RentObjectPhoto } from '@types';

import { RentObjectPhotosServiceContract } from './contract';
import { generatePhotoUUIDByOriginalUrl } from './utils';

@Injectable()
export class RentObjectPhotosServiceMock
  implements RentObjectPhotosServiceContract
{
  /**
   * Загрузка фотографий на S3
   */
  public async uploadPhotos(props: {
    photos: { originalPhotoUrl: string; binary: Buffer }[];
  }): Promise<{ photos: RentObjectPhoto[] }> {
    return {
      photos: props.photos.map(({ originalPhotoUrl }) => ({
        type: 'image',
        uuid: generatePhotoUUIDByOriginalUrl({ originalPhotoUrl }).uuidv4,
      })),
    };
  }

  /**
   * Проверка, что фотография уже существует на S3
   */
  public async checkExistedPhotos(props: {
    originalPhotoUrls: string[];
  }): Promise<{ existed: RentObjectPhoto[]; notExisted: string[] }> {
    return {
      existed: props.originalPhotoUrls.map((originalPhotoUrl) => ({
        type: 'image',
        uuid: generatePhotoUUIDByOriginalUrl({ originalPhotoUrl }).uuidv4,
      })),
      notExisted: [],
    };
  }
}
