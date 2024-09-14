import * as crypto from 'crypto';

import { Proxy, axiosSafeRequest, axios } from '@utils';

export class DomriaApi {
  public async getAnnouncementIds(props: {
    categoryId: number;
    categoryRealtyType: number;
    cityId: number;
    page: number;
    limit: number;
    proxy?: Proxy;
  }) {
    const params = {
      method: 'GET',
      url: 'http://dom.ria.com/node/searchEngine/v2',
      params: {
        addMoreRealty: false,
        excludeSold: 1,
        category: props.categoryId,
        realty_type: props.categoryRealtyType,
        operation: 3,
        state_id: 0,
        city_id: props.cityId,
        in_radius: 0,
        with_newbuilds: 0,
        price_cur: 1,
        wo_dupl: 1,
        complex_inspected: 0,
        sort: 'created_at',
        period: 0,
        notFirstFloor: 0,
        notLastFloor: 0,
        with_map: 0,
        photos_count_from: 3,
        firstIteraction: false,
        fromAmp: 0,
        client: 'searchV2',
        limit: props.limit,
        page: props.page,
        type: 'list',
        operation_type: 3,
        ch: '246_244%2C1437_1436%3A',
      },
      proxy: props.proxy,
    };

    const response = await axiosSafeRequest<{
      count: number;
      items: Array<number>;
    }>(params);

    return response;
  }

  public async getItem(props: { itemId: string; proxy?: Proxy }) {
    const key = crypto
      .createHash('sha1')
      .update(Math.random().toString(36))
      .digest('hex');

    const url = `http://dom.ria.com/realty/data/${props.itemId}?lang_id=2&key=${key}`;
    const response = await axiosSafeRequest<Record<string, any>>({
      method: 'GET',
      url,
      headers: this.buildHeaders(),
      proxy: props.proxy,
    });

    if ('ok' in response) {
      if (typeof response.ok === 'string') {
        const message = response.ok as string;

        if (message.includes('Radware Bot Manager Captcha')) {
          return { error: '429-many-request' as const, message, url };
        }

        return { error: 'unexpected' as const, message, url };
      }
    }

    return { ...response, url };
  }

  public async getInitstatePage(props: {
    item: Record<string, any>;
    proxy?: Proxy;
  }) {
    const url = `http://dom.ria.com/ru/${props.item.beautiful_url}`;
    const response = await axiosSafeRequest<string>({
      url,
      headers: this.buildHeaders(),
      proxy: props.proxy,
    });

    if ('error' in response) {
      return { ...response, url };
    }

    try {
      const initialStateStr = response.ok
        .split('window.__INITIAL_STATE__=')[1]
        .split(';(function()')[0];

      return {
        ok: {
          url,
          initstate: JSON.parse(initialStateStr) as Record<string, any>,
        },
      } as const;
    } catch (error) {
      return {
        error: 'page-parse-initdata',
        message: error.message as string,
        url,
      } as const;
    }
  }

  public async downloadPhoto(props: {
    url: string;
    proxy?: Proxy;
  }): Promise<Buffer> {
    return await axios<Buffer>({
      url: props.url,
      responseType: 'arraybuffer',
      timeout: 60_000,
      proxy: props.proxy,
      headers: this.buildHeaders(),
    });
  }

  public async getOwnerstate(props: {
    initstate: Record<string, any>;
    proxy?: Proxy;
  }) {
    const itemHash = props.initstate?.listing?.data?.hash;
    if (!itemHash) {
      return {
        error: 'owerstate-hash-not-found',
        message: null,
      } as const;
    }

    const response = await axiosSafeRequest<Record<string, any>>({
      method: 'GET',
      url: `http://dom.ria.com/v1/api/realty/getOwnerAndAgencyData/${itemHash}?spa_final_page=true`,
      headers: this.buildHeaders(),
      proxy: props.proxy,
    });

    return response;
  }

  private buildHeaders() {
    return {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'sec-ch-ua':
        '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      cookie:
        'ui=b96b812c17c515f4; __uzma=e792bc0f-493e-48f8-9372-cf41e644b700; __uzmb=1710832891; __uzme=4175; _gcl_au=1.1.1423593237.1710832921; _ga=GA1.1.1182535419.1710832922; _ga=GA1.3.1182535419.1710832922; _fbp=fb.1.1710832923118.299062354; _clck=v0qnvf%7C2%7Cfk7%7C0%7C1539; gdpr=[2,3]; isSessionActive=1; PHPSESSID=i8th1ce9qcs1s252oadlshc2g6; __utma=192842303.1182535419.1710832922.1710840583.1710840583.1; __utmc=192842303; __utmz=192842303.1710840583.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _hjSessionUser_3709490=eyJpZCI6IjZkNjlkOThiLTJlMzMtNWFhYy05MjQ3LTE0ZmY0NDZhNTZhYSIsImNyZWF0ZWQiOjE3MTA4MzI5MjMyNDcsImV4aXN0aW5nIjp0cnVlfQ==; lang_id=2; referrerId=11; _gid=GA1.3.566234807.1711003062; lang=ru; dom_sess=zRj2iDGWgxxxZDhPa8rCj8xygqEOL8qu; lastRealtyId=14349096; g_state={"i_p":1711608262025,"i_l":3}; __uzmc=535889135664; __uzmd=1711008343; ref=mf; refferalId=32; pageCount=49; _ga_HJZP5P77GH=GS1.1.1711008350.5.1.1711008733.59.0.669713453; _gat_UA-87766776-1=1',
      Referer: 'https://dom.ria.com/arenda-nedvizhimosti/',
      'Referrer-Policy': 'unsafe-url',
    };
  }
}
