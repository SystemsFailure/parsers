import { OBJECT_TYPES_ENUM } from '@constants';

/**
 * Экстрактор данных на основе данных загруженных из сервисов Olx
 */
export class OlxExtractor {
  public readonly item: Record<string, any>;

  private readonly inputCategory: number;

  constructor(props: {
    item: Record<string, any>;
    input: {
      category: number;
    };
  }) {
    this.item = props.item;
    this.inputCategory = props.input.category;
  }

  public description() {
    return {
      id: this.item.id + '',
      url: this.item.url as string,
      title: this.item.title as string,
      description: this.item.description as string,
    };
  }

  public objectType():
    | void
    | { message: string }
    | ReturnType<typeof OBJECT_TYPES_ENUM> {
    if (this.inputCategory === 9) {
      if (this.item.category.id === 328) {
        return OBJECT_TYPES_ENUM('Койко-место');
      }
      if (this.item.category.id === 329) {
        return OBJECT_TYPES_ENUM('Комната');
      }
      if (this.item.category.id === 331) {
        return OBJECT_TYPES_ENUM('Дом');
      }
      if (this.item.category.id === 1618) {
        const numberOfRooms = this.item.params.find(
          (el: any) => el.key === 'number_of_rooms',
        );

        if (!numberOfRooms) {
          return { message: 'not found number of rooms' };
        }

        switch (numberOfRooms.value.label) {
          case '1':
            return OBJECT_TYPES_ENUM('1-к. квартира');
          case '2':
            return OBJECT_TYPES_ENUM('2-к. квартира');
          case '3':
            return OBJECT_TYPES_ENUM('3-к. квартира');
          case '4':
            return OBJECT_TYPES_ENUM('4-к. квартира');
          default:
            return OBJECT_TYPES_ENUM('5+ к. квартира');
        }
      }
      if (this.item.category.id === 1620) {
        return OBJECT_TYPES_ENUM('Гостиница');
      }
      return null;
    }
    if (this.inputCategory === 1756) {
      return OBJECT_TYPES_ENUM('Комната');
    }
    if (this.inputCategory === 330) {
      const typeOfHouse = this.item.params.find(
        (el: any) => el.key === 'property_type_houses',
      );
      if (!typeOfHouse) {
        return OBJECT_TYPES_ENUM('Дом');
      }

      switch (typeOfHouse.value.label) {
        case 'Будинок':
          return OBJECT_TYPES_ENUM('Дом');
        case 'Частина будинку':
          return OBJECT_TYPES_ENUM('Часть дома');
        case 'Дача':
          return OBJECT_TYPES_ENUM('Дача');
        case 'Дуплекс':
        case 'Таунхаус':
          return OBJECT_TYPES_ENUM('Дуплекс/Таунхаус');
        case 'Котедж':
          return OBJECT_TYPES_ENUM('Коттедж');
        case 'Модульні будинки':
          return OBJECT_TYPES_ENUM('Модульный дом');
        default:
          return null;
      }
    }

    const objectType = this.item.params.find(
      (el: any) => el.key === 'number_of_rooms_string',
    );
    if (!objectType) {
      return OBJECT_TYPES_ENUM('1-к. квартира');
    }

    switch (objectType.value.label) {
      case '1 кімната':
        return OBJECT_TYPES_ENUM('1-к. квартира');
      case '2 кімнати':
        return OBJECT_TYPES_ENUM('2-к. квартира');
      case '3 кімнати':
        return OBJECT_TYPES_ENUM('3-к. квартира');
      case '4 кімнати':
        return OBJECT_TYPES_ENUM('4-к. квартира');
      case '5+ кімнат':
        return OBJECT_TYPES_ENUM('5+ к. квартира');
    }

    return null;
  }

  public storey() {
    const floor = this.item.params.find((el: any) => el.key === 'floor');
    const totalFloors = this.item.params.find(
      (el: any) => el.key === 'total_floors',
    );

    return {
      storey: (floor?.value?.label && Number(floor.value.label)) || null,
      storeyNumber:
        (totalFloors?.value?.label && Number(totalFloors.value.label)) || null,
    };
  }

  public areas() {
    const totalArea = this.item.params.find(
      (el: any) => el.key === 'total_area',
    );
    const kitchenArea = this.item.params.find(
      (el: any) => el.key === 'kitchen_area',
    );

    const area = (totalArea?.value?.key && Number(totalArea.value.key)) ?? null;
    const areaKitchen =
      (kitchenArea?.value?.key && Number(kitchenArea.value.key)) ?? null;

    const areaLiving = area && areaKitchen ? area - areaKitchen : null;

    return {
      area,
      areaKitchen,
      areaLiving,
    };
  }

  public photos() {
    return this.item.photos.map(({ link }) =>
      (link as string).replace(';s={width}x{height}', ''),
    ) as string[];
  }

  public address() {
    const itemLocation = this.item.location;
    if (!itemLocation) {
      throw new Error('Item location not found');
    }

    return {
      region: (itemLocation.region.name as string) || null,
      city: (itemLocation.city.name as string) || null,
      district: (itemLocation.district.name as string) || null,
    };
  }

  public geocord() {
    const { lat, lon } = this.item.map;
    return {
      lat: lat as number,
      lon: lon as number,
    };
  }

  public deposit() {
    const paramsPrice = this.item.params.find((el: any) => el.key === 'price');
    const paramsCommission = this.item.params.find(
      (el: any) => el.key === 'commission',
    );

    return {
      price: Number(paramsPrice?.value?.value) || null,
      commision:
        paramsCommission?.value?.label === 'Без комісії'
          ? null
          : Number(paramsCommission?.value?.key) || null,
    };
  }

  public seller() {
    return {
      seller: (this.item.user.name as string) || null,
    };
  }
}
