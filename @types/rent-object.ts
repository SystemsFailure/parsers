export interface RentObjectPhoto {
  type: string;
  uuid: string;
}

export interface RentObject {
  /**
   * id ресурса
   */
  foreignId: string | undefined;

  /**
   * ссылка на объект
   */
  src: string | undefined;

  /**
   * регион
   */
  region: string | undefined;

  /**
   * город
   */
  city: string | undefined;

  /**
   * район
   */
  district: string | undefined;

  /**
   * улица
   */
  street: string | undefined;

  /**
   * номер дома/кв
   */
  houseNumber: string | number | undefined;

  /**
   * заголовок
   */
  title: string | undefined;

  /**
   * описание
   */
  description: string | undefined;

  /**
   * имя хозяина
   */
  name: string | undefined;

  /**
   * номер телефона
   */
  phone: string | number | undefined;

  /**
   * цена объекта
   */
  price: number | undefined;

  /**
   * залог
   */
  deposit: number | undefined;

  /**
   * комиссия в процентах
   */
  fee: number | undefined;

  /**
   * тип объекта
   */
  objectType: string | undefined;

  /**
   * площадь
   */
  area: number | undefined;

  /**
   * площадь кухни
   */
  areaKitchen: number | undefined;

  /**
   * площадь жилая
   */
  areaLiving: number | null | undefined;

  /**
   * этаж
   */
  storey: number | undefined;

  /**
   * кол-во этажей
   */
  storeyNumber: number | undefined;

  /**
   * массив ссылок на фото
   */
  photos: RentObjectPhoto[];
}
