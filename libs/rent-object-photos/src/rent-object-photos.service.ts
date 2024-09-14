import { Inject, Injectable } from '@nestjs/common';
import { InjectS3, S3 } from 'nestjs-s3';

import { RentObjectPhoto } from '@types';

import { RentObjectPhotosServiceContract } from './contract';
import { generatePhotoUUIDByOriginalUrl } from './utils';
import { TOKEN_ENV_S3_PARAMS, S3Params } from './tokens';

@Injectable()
export class RentObjectPhotosService
  implements RentObjectPhotosServiceContract
{
  constructor(
    @Inject(TOKEN_ENV_S3_PARAMS)
    private readonly s3Params: S3Params,
    @InjectS3() private readonly s3: S3,
  ) {}

  /**
   * Загрузка фотографий на S3
   */
  public async uploadPhotos(props: {
    photos: { originalPhotoUrl: string; binary: Buffer }[];
  }): Promise<{ photos: RentObjectPhoto[] }> {
    const photos = props.photos.map((photo) => {
      const { uuidv4: uuid } = generatePhotoUUIDByOriginalUrl({
        originalPhotoUrl: photo.originalPhotoUrl,
      });
      const s3Key = `${this.s3Params.folder}/${uuid}`;

      return {
        uuid,
        s3Key,
        ...photo,
      };
    });

    const taskUploadPhotos = photos.map(async (photo) => {
      const task = this.s3
        .putObject({
          Bucket: this.s3Params.bucket,
          Key: photo.s3Key,
          Body: photo.binary,
          ACL: 'public-read',
          ContentType: 'image/png',
        })
        .then(() => Promise.resolve({ photo }))
        .catch((error) => Promise.resolve({ error, photo }));

      return task;
    });

    const taskUploadPhotosResults = await Promise.all(taskUploadPhotos);
    const errorMessages = [] as string[];

    for (const result of taskUploadPhotosResults) {
      if ('error' in result) {
        errorMessages.push(
          `Error upload photo ${result.photo.originalPhotoUrl} / ${result.photo.uuid}: ${result.error.message}`,
        );
      }
    }

    if (errorMessages.length > 0) {
      throw new Error(errorMessages.join('\n'));
    }

    return {
      photos: photos.map(({ uuid }) => {
        return {
          uuid,
          type: 'image',
        };
      }),
    };
  }

  /**
   * Проверка, что фотография уже существует на S3
   */
  public async checkExistedPhotos(props: {
    originalPhotoUrls: string[];
  }): Promise<{ existed: RentObjectPhoto[]; notExisted: string[] }> {
    const { existed } = await this.checkExistedObjects({
      bucket: this.s3Params.bucket,
      s3Keys: props.originalPhotoUrls,
    });

    return {
      existed: existed.map((originalPhotoUrl) => {
        return {
          type: 'image',
          uuid: generatePhotoUUIDByOriginalUrl({ originalPhotoUrl }).uuidv4,
        };
      }),
      notExisted: props.originalPhotoUrls.filter(
        (s3Key) => !existed.includes(s3Key),
      ),
    };
  }

  private async checkExistedObjects(props: {
    bucket: string;
    s3Keys: string[];
  }) {
    const results = await Promise.all(
      props.s3Keys.map(async (s3Key) => {
        const { exists } = await this.checkExistedObject({
          bucket: props.bucket,
          s3Key,
        });
        return { s3Key, exists };
      }),
    );

    return {
      existed: results.filter(({ exists }) => exists).map(({ s3Key }) => s3Key),
    };
  }

  private async checkExistedObject(props: {
    bucket: string;
    s3Key: string;
  }): Promise<{ exists: boolean }> {
    try {
      await this.s3.headObject({
        Bucket: props.bucket,
        Key: props.s3Key,
      });
      return { exists: true };
    } catch (error) {
      if (
        error?.name === 'NotFound' &&
        error?.$metadata?.httpStatusCode === 404
      ) {
        return { exists: false };
      }
      throw error;
    }
  }
}
