import { OBJECT_TYPES_ENUM } from '@constants';

export class CianExtractor {
  public readonly item: Record<string, any>;

  constructor(props: { item: Record<string, any> }) {
    this.item = props.item;
  }

  public objectType(): void | ReturnType<typeof OBJECT_TYPES_ENUM> {
    if (this.item.category === 'flatRent') {
      switch (true) {
        case this.item.roomsCount === 1:
          return OBJECT_TYPES_ENUM('1-к. квартира');
        case this.item.roomsCount === 2:
          return OBJECT_TYPES_ENUM('2-к. квартира');
        case this.item.roomsCount === 3:
          return OBJECT_TYPES_ENUM('3-к. квартира');
        case this.item.roomsCount === 4:
          return OBJECT_TYPES_ENUM('4-к. квартира');
        case this.item.roomsCount >= 5:
          return OBJECT_TYPES_ENUM('5+ к. квартира');
      }
    } else if (this.item.category === 'houseRent') {
      return OBJECT_TYPES_ENUM('Дом');
    } else if (this.item.category === 'cottageRent') {
      return OBJECT_TYPES_ENUM('Коттедж');
    } else if (this.item.category === 'houseShareRent') {
      return OBJECT_TYPES_ENUM('Часть дома');
    } else if (this.item.category === 'townhouseRent') {
      return OBJECT_TYPES_ENUM('Дуплекс/Таунхаус');
    }
  }

  public description() {
    return {
      id: this.item.cianId as string,
      url: this.item.fullUrl as string,
      description: this.item.description as string,
      city: (this.item.geo.address.find((el: any) => {
        return el.locationTypeId === 1;
      })?.name || null) as void | string,
    };
  }

  public phone() {
    return {
      phone:
        Number(this.item.phones[0].countryCode + this.item.phones[0].number) ||
        null,
    };
  }

  public storey() {
    return {
      storey: Number(this.item.floorNumber) || null,
      storeyNumber: Number(this.item.building.floorsCount) || null,
    };
  }

  public areas() {
    return {
      area: Number(this.item.totalArea) || null,
      areaKitchen: Number(this.item.kitchenArea) || null,
      areaLiving: Number(this.item.livingArea) || null,
    };
  }

  public deposit() {
    return {
      price: this.item.bargainTerms.price,
      deposit: this.item.bargainTerms.deposit || null,
    };
  }

  public address() {
    const houseObj = this.item.geo.address.find(
      (el: any) => el.geoType === 'house',
    );
    const streetObj = this.item.geo.address.find(
      (el: any) => el.geoType === 'street',
    );
    const districtObj = Array.isArray(this.item.geo.districts)
      ? this.item.geo.districts.find(
          (el: any) =>
            el.type === 'raion' ||
            el.type === 'mikroraion' ||
            el.type === 'okrug',
        )
      : null;

    return {
      region: this.item.geo.address[0].fullName as string,
      houseNumber:
        Number(houseObj?.title) || (houseObj?.title as string) || null,
      street: (streetObj?.title as string) || null,
      district:
        districtObj &&
        !['ул.', 'улица', 'пр-т'].some((el) => districtObj.title.includes(el))
          ? (districtObj.title as string)
          : null,
    };
  }

  public photos() {
    return this.item.photos.map(
      ({ thumbnail2Url }) => thumbnail2Url,
    ) as string[];
  }

  public seller() {
    return {
      seller: this.item.user.agencyName as string,
    };
  }
}
