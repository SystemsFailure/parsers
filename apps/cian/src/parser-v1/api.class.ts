import { Proxy, axiosSafeRequest, axios } from '@utils';

export class CianApi {
  private buildQueryData(props: { kind: string; city: number; page: number }) {
    const data = {
      jsonQuery: {
        _type: props.kind,
        engine_version: {
          type: 'term',
          value: 2,
        },
        region: {
          type: 'terms',
          value: [props.city],
        },
        page: {
          type: 'term',
          value: props.page,
        },
        for_day: {
          type: 'term',
          value: '!1',
        },
        room: {
          type: 'terms',
          value: [1, 2, 3, 4, 5, 6],
        },
      },
    };
    return data;
  }

  private buildAxiosParams(props: {
    cityLink: string;
    data: Record<string, any>;
    timeout: number;
  }) {
    const config = {
      method: 'post',
      url: 'https://api.cian.ru/search-offers/v2/search-offers-desktop/',
      headers: {
        'Content-Type': 'application/json',
        'accept-language': 'ru-RU,ru;q=0.9',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        accept: '*/*',
        pragma: 'no-cache',
        origin: `https://${[props.cityLink, 'cian', 'ru'].join('.')}`,
        referer: `https://${[props.cityLink, 'cian', 'ru'].join('.')}`,
        'sec-ch-ua':
          '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
      },
      data: JSON.stringify(props.data),
      timeout: props.timeout,
    };

    return config;
  }

  public async getAnnouncements(props: {
    city: {
      id: number;
      origin: string;
    };
    kind: string;
    page: number;
    proxy?: Proxy;
  }) {
    const data = this.buildQueryData({
      city: props.city.id,
      kind: props.kind,
      page: props.page,
    });
    const config = this.buildAxiosParams({
      cityLink: props.city.origin,
      data,
      timeout: 30_000,
    });

    const response = await axiosSafeRequest<{
      data: Record<string, any>;
    }>({ ...config, proxy: props.proxy });

    return response;
  }

  public async downloadPhoto(props: { url: string; proxy?: Proxy }) {
    return await axios<Buffer>({
      url: props.url,
      responseType: 'arraybuffer',
      timeout: 30_000,
      proxy: props.proxy,
    });
  }
}
