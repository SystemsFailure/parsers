import { Proxy, axiosSafeRequest, axios } from '@utils';

export class YoulaApi {
  public async getAnnouncements(props: {
    category: string;
    cityId: string;
    page: number;
    proxy?: Proxy;
  }) {
    const params = {
      method: 'POST',
      url: 'https://api-gw.youla.io/federation/graphql',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        operationName: 'catalogProductsBoard',
        variables: {
          sort: 'DEFAULT',
          attributes: [
            {
              slug: 'categories',
              value: [props.category],
              from: null,
              to: null,
            },
          ],
          datePublished: null,
          location: {
            latitude: null,
            longitude: null,
            city: props.cityId,
            distanceMax: null,
          },
          search: '',
          cursor: `{"page":${props.page}}`,
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              '6e7275a709ca5eb1df17abfb9d5d68212ad910dd711d55446ed6fa59557e2602',
          },
        },
      },
      proxy: props.proxy,
    };

    const response = await axiosSafeRequest(params);
    if ('error' in response) {
      return response;
    }

    const data = response.ok;

    const hasNextPage = !!data.data.feed.pageInfo.hasNextPage;
    const items: Record<string, any>[] = data.data.feed.items
      .map(({ product }) => product)
      .filter((id: any) => !!id);

    return { ok: { hasNextPage, items } };
  }

  public async getAnnouncement(props: { url: string; proxy?: Proxy }) {
    const params = {
      method: 'GET',
      url: props.url,
      headers: {
        'Content-Type': 'application/json',
      },
      proxy: props.proxy,
    };

    const response = await axiosSafeRequest(params);
    if ('error' in response) {
      return response;
    }

    try {
      const fullItem = JSON.parse(
        String(
          response.ok
            .split('window.__YOULA_STATE__ = ')[1]
            .split(/;[\n\t \r]*window.__YOULA_TEST__ =/)[0],
        ),
      );

      const product = fullItem.entities?.products?.[0] as Record<string, any>;
      if (!product) {
        return {
          error: 'product-not-found' as const,
          message: 'Походу объявление удалили',
        };
      }

      return { ok: product };
    } catch (error) {
      return {
        error: 'error-parse-announcement' as const,
        message: error.message as string,
      };
    }
  }

  public async downloadPhoto(props: { url: string; proxy?: Proxy }) {
    return await axios<Buffer>({
      method: 'get',
      url: props.url,
      responseType: 'arraybuffer',
      timeout: 30_000,
      proxy: props.proxy,
    });
  }
}
