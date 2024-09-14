import { Proxy, axios } from '@utils';

export class AvitoApi {
  public async downloadPhoto(props: {
    url: string;
    proxy?: Proxy;
  }): Promise<Buffer> {
    return await axios<Buffer>({
      method: 'get',
      url: props.url,
      responseType: 'arraybuffer',
      timeout: 30_000,
      proxy: props.proxy,
    });
  }
}
