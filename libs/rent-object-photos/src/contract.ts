import { RentObjectPhoto } from '@types';

export type RentObjectPhotosServiceContract = {
  uploadPhotos(props: {
    photos: {
      originalPhotoUrl: string;
      binary: Buffer;
    }[];
  }): Promise<{ photos: RentObjectPhoto[] }>;

  checkExistedPhotos(props: {
    originalPhotoUrls: string[];
  }): Promise<{ existed: RentObjectPhoto[]; notExisted: string[] }>;
};
