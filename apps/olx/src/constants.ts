export const REGIONS = Object.freeze({
  /**
   * Киев / Киевская область
   */
  KYIV: {
    region_id: 25,
    city_id: 268,
    region: 'Київська область',
    city: 'Київ',
  },
  /**
   * Львов / Львовская область
   */
  LVIV: {
    region_id: 5,
    city_id: 176,
    region: 'Львівська область',
    city: 'Львів',
  },
  /**
   * Днепр / Днепропетровская область
   */
  DNIEPER: {
    region_id: 21,
    city_id: 121,
    region: 'Дніпропетровська область',
    city: 'Дніпро',
  },
});

export const OWNERS = Object.freeze({
  PRIVATE: {
    owner_type: 'private' as const,
  },
  BUSINESS: {
    owner_type: 'business' as const,
    filter_bool_commission: 1, // Здесь 1 означает - "Без комиссии"
  },
});

/**
 * Категории объявлений
 */
export const CATEGORIES = Object.freeze({
  /**
   * Аренда недвижимости
   */
  RENTAL_PROPERTY: 330,
  /**
   * Аренда комнат
   */
  RENTAL_ROOM: 1756,
  /**
   * Аренда квартир
   */
  RENTAL_APARTMENT: 1760,
});
