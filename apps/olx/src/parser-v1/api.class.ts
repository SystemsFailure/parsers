import { Proxy, axiosSafeRequest, axios } from '@utils';

export class OlxApi {
  public async getAnnouncements(props: {
    category: number;
    regionItem: { region_id: number; city_id: number };
    owner_type: string;
    filter_bool_commission: number | undefined;
    offset: number;
    limit: number;
    proxy?: Proxy;
  }) {
    const params = {
      offset: props.offset,
      limit: props.limit,
      category_id: props.category,
      currency: 'UAH',
      region_id: props.regionItem.region_id,
      city_id: props.regionItem.city_id,
      sort_by: 'created_at:desc',
      filter_refiners: 'spell_checker',
      owner_type: props.owner_type,
      filter_bool_commission: props.filter_bool_commission,
    };

    const response = await axiosSafeRequest<{
      data: Record<string, any>[];
      metadata: {
        total_elements: number;
        visible_total_count: number;
      };
    }>({
      method: 'GET',
      url: 'https://www.olx.ua/api/v1/offers',
      params,
      proxy: props.proxy,
    });

    return response;
  }

  public async downloadPhoto(props: { url: string; proxy?: Proxy }) {
    return axios<Buffer>({
      method: 'get',
      responseType: 'arraybuffer',
      url: props.url,
      proxy: props.proxy,
    });
  }
}
