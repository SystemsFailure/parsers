import { OBJECT_TYPES_ENUM } from '@constants';

/**
 * Экстрактор данных на основе данных загруженных из сервисов Youla
 */
export class YoulaExtractor {
  public readonly fullItem: Record<string, any>;

  constructor(props: { fullItem: Record<string, any> }) {
    this.fullItem = props.fullItem;
  }

  public description() {
    return {
      id: this.fullItem.id as string,
      url: `https://youla.ru${this.fullItem.url}`,
      title: this.fullItem.name as string,
      description: this.fullItem.description as string,
    };
  }

  public objectType(): ReturnType<typeof OBJECT_TYPES_ENUM> {
    const subcategory = this.fullItem.attributes.find(
      (el: any) => el.slug === 'subcategory',
    );
    const tipPostroyki = this.fullItem.attributes.find(
      (el: any) => el.slug === 'tip_postroyki',
    );

    if (subcategory?.rawValue === 'Аренда квартиры длительно') {
      const komnat = this.fullItem.attributes.find(
        (el: any) => el.slug === 'komnat_v_kvartire',
      );

      if (komnat?.rawValue) {
        switch (komnat.rawValue) {
          case '1 комната':
            return OBJECT_TYPES_ENUM('1-к. квартира');
          case '2 комнаты':
            return OBJECT_TYPES_ENUM('2-к. квартира');
          case '3 комнаты':
            return OBJECT_TYPES_ENUM('3-к. квартира');
          case '4 комнаты':
            return OBJECT_TYPES_ENUM('4-к. квартира');
          case 'Студия':
            return OBJECT_TYPES_ENUM('Студия');
          default:
            return OBJECT_TYPES_ENUM('5+ к. квартира');
        }
      } else {
        return OBJECT_TYPES_ENUM('1-к. квартира');
      }
    }
    if (subcategory?.rawValue === 'Аренда дома длительно') {
      return OBJECT_TYPES_ENUM('Дом');
    }
    if (subcategory?.rawValue === 'Аренда комнаты длительно') {
      return OBJECT_TYPES_ENUM('Комната');
    }
    if (subcategory?.rawValue === 'Аренда дома посуточно') {
      if (tipPostroyki?.rawValue === 'Коттедж') {
        return OBJECT_TYPES_ENUM('Коттедж');
      }

      return OBJECT_TYPES_ENUM('Дом');
    }
    return OBJECT_TYPES_ENUM('1-к. квартира');
  }

  public storey() {
    const attributeStorey = this.fullItem.attributes.find(
      (el: any) => el.slug === 'realty_etaj',
    );
    const attributeStoreyNumber = this.fullItem.attributes.find(
      (el: any) => el.slug === 'realty_etajnost_doma',
    );

    return {
      storey: Number(attributeStorey?.rawValue) || null,
      storeyNumber: Number(attributeStoreyNumber?.rawValue) || null,
    };
  }

  public areas() {
    const attributeKitchenArea = this.fullItem.attributes.find(
      (el: any) => el.slug === 'realty_ploshad_kuhni',
    );
    const attributeTotalArea = this.fullItem.attributes.find(
      (el: any) => el.slug === 'realty_obshaya_ploshad',
    );
    const attributeTotalHouseArea = this.fullItem.attributes.find(
      (el: any) => el.slug === 'realty_ploshad_doma',
    );

    const area =
      (attributeTotalArea?.rawValue &&
        Number(attributeTotalArea.rawValue) / 100) ||
      null;

    const areaKitchen =
      (attributeKitchenArea?.rawValue &&
        Number(attributeKitchenArea.rawValue) / 100) ||
      null;

    const areaLiving =
      (attributeKitchenArea?.rawValue &&
        attributeTotalArea?.rawValue &&
        Number(
          (Number(attributeTotalArea.rawValue) -
            Number(attributeKitchenArea.rawValue)) /
            100,
        )) ||
      null;

    const areaHouse =
      (attributeTotalHouseArea?.rawValue &&
        Number(attributeTotalHouseArea.rawValue) / 10) ||
      null;

    return {
      area: area || areaHouse,
      areaKitchen,
      areaLiving,
    };
  }

  public deposit() {
    const depositInfo = this.fullItem.attributes.find(
      (el: any) => el.slug === 'predoplata_mesechnaya',
    );

    return {
      price: Math.floor(this.fullItem.price / 100),
      deposit:
        (depositInfo?.rawValue &&
          Number(depositInfo.rawValue.match(/^\d+/)?.[0]) *
            Math.floor(this.fullItem.price / 100)) ||
        null,
    };
  }

  /**
   * Функция для получения адреса
   *
   * Это деградационный вариант получения адреса в случаи,
   * если не можем использовать получение по геоданным
   */
  public address() {
    const address: string[] = this.fullItem.location.description
      .split(',')
      .map((el: string) => el.trim());
    const anchorStreet = address.findIndex(
      (el: string) =>
        el.startsWith('ул.') || el.startsWith('улица') || el.endsWith('улица'),
    );

    if (anchorStreet === -1) {
      return {
        streetName: null,
        houseNumber: null,
      };
    }

    const streetName = address[anchorStreet];
    const maybeHouseNumber = address[anchorStreet + 1];

    return {
      streetName,
      houseNumber: Number(maybeHouseNumber) || maybeHouseNumber || null,
    };
  }

  public geocord() {
    const { latitude, longitude } = this.fullItem.location;
    return {
      lat: latitude as number,
      lon: longitude as number,
    };
  }

  public seller() {
    return {
      seller: this.fullItem.owner?.name || (null as string | void),
    };
  }

  public photos() {
    return this.fullItem.images.map(({ url }) => url) as string[];
  }
}
