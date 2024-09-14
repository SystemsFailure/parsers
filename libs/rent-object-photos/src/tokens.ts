export const TOKEN_ENV_S3_PARAMS = Symbol('TOKEN_ENV_S3_PARAMS');
export type S3Params = {
  key: string;
  secret: string;
  region: string;
  endpoint: string;
  bucket: string;
  folder: string;
};
