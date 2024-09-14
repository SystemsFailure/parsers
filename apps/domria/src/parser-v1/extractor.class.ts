import { OBJECT_TYPES_ENUM } from '@constants';

export class DomriaExtractor {
  public readonly item: Record<string, any>;
  public readonly initstate: Record<string, any>;
  public readonly ownerstate: Record<string, any>;

  constructor(props: {
    item: Record<string, any>;
    initstate: Record<string, any>;
    ownerstate: Record<string, any>;
  }) {
    this.item = props.item;
    this.initstate = props.initstate;
    this.ownerstate = props.ownerstate;
  }

  public description() {
    return {
      id: this.initstate.listing.data.realty.realty_id + '',
      url: `https://dom.ria.com/uk/${this.initstate.listing.data.realty.beautiful_url}`,
      description: this.initstate.listing.data.realty.description as string,
      title: this.initstate.listing.data.tagH as string,
    };
  }

  public objectType(): void | ReturnType<typeof OBJECT_TYPES_ENUM> {
    if (this.item.realty_type_name === 'Квартира') {
      switch (this.item.rooms_count) {
        case 1:
          return OBJECT_TYPES_ENUM('1-к. квартира');
        case 2:
          return OBJECT_TYPES_ENUM('2-к. квартира');
        case 3:
          return OBJECT_TYPES_ENUM('3-к. квартира');
        case 4:
          return OBJECT_TYPES_ENUM('4-к. квартира');
        default:
          return OBJECT_TYPES_ENUM('5+ к. квартира');
      }
    }

    switch (this.item.realty_type_name) {
      case 'Часть дома':
        return OBJECT_TYPES_ENUM('Часть дома');
      case 'Дом':
        return OBJECT_TYPES_ENUM('Дом');
      case 'Таунхаус':
        return OBJECT_TYPES_ENUM('Дуплекс/Таунхаус');
      case 'Коттедж':
        return OBJECT_TYPES_ENUM('Коттедж');
      case 'Комната':
        return OBJECT_TYPES_ENUM('Комната');
      case 'Студия':
        return OBJECT_TYPES_ENUM('Студия');
      case 'Дача':
        return OBJECT_TYPES_ENUM('Дача');
      case 'Офисные помещения':
      case 'Коммерческое помещение':
      case 'Специальное помещение':
      case 'Подземный паркинг':
      case 'Место в гаражном кооперативе':
      case 'Отдельно стоящий гараж':
      case 'Место на стоянке':
        return OBJECT_TYPES_ENUM('Помещение свободного назначения');
    }

    return null;
  }

  public address() {
    return {
      region:
        (this.item.state_name_uk && `${this.item.state_name_uk} область`) ||
        null,
      city: (this.item.city_name_uk as string) || null,
      district: (this.item.district_name_uk as string) || null,
      streetName: (this.initstate.listing.data.realty.street_name_uk as string)
        ?.replace('вулиця', '')
        ?.trim(),
      houseNumber:
        Number(this.initstate.listing.data.realty.building_number_str) ||
        (this.initstate.listing.data.realty.building_number_str as string) ||
        null,
    };
  }

  public deposit() {
    return {
      price: Number(
        this.initstate.listing.data.realty.priceObj.priceUAH?.replace(
          /\D/g,
          '',
        ),
      ),
    };
  }

  public photos() {
    return this.initstate.listing.data.realty.photos.map(
      (photo: Record<string, any>) =>
        `https://cdn.riastatic.com/photosnew/${photo.beautifulUrl}`?.replace(
          '.jpg',
          '',
        ) + 'fl.jpg',
    ) as string[];
  }

  public areas() {
    return {
      area:
        Number(this.initstate.listing.data.realty.total_square_meters) || null,
      areaKitchen:
        Number(this.initstate.listing.data.realty.kitchen_square_meters) ||
        null,
      areaLiving:
        Number(this.initstate.listing.data.realty.living_square_meters) || null,
    };
  }

  public storey() {
    return {
      storey: Number(this.initstate.listing?.data?.realty?.floor) || null,
      storeyNumber:
        Number(this.initstate.listing?.data?.realty?.floors_count) ||
        Number(this.initstate.listing?.data?.newbuildData?.specs?.floorMax) ||
        null,
    };
  }

  public seller() {
    return {
      seller: this.initstate.listing.data.agencyOwner.owner.name || null,
    };
  }

  public phone() {
    const el = this.ownerstate.owner?.phones?.[0];
    const phone =
      (el?.phone_num || el?.real_phone_number || el?.phone)?.replace(
        /\D/g,
        '',
      ) || null;
    const seller = (this.ownerstate?.owner?.first_name as string) || null;

    return {
      phone,
      seller,
    };
  }
}
