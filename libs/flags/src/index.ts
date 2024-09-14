const MOCK_ALL = process.env.MOCK_ALL === 'true';

/**
 * Флаг указывающий, что приложение запущенно в режиме разработки
 *
 * В данный момент используется, только для настройки `nest` модулей,
 * изначально задумывалось именно для этого
 */
export const IS_DEV = process.env.IS_DEV === 'true';

/**
 * Флаги подмены модулей на моковые реализации для локальной разработки
 */
export const MOCK_FLAGS = Object.freeze({
  PROXY_SERVERS: MOCK_ALL || process.env.MOCK_PROXY_SERVERS === 'true',

  RENT_OBJECT: MOCK_ALL || process.env.MOCK_RENT_OBJECT === 'true',
  RENT_OBJECT_CHECKER:
    MOCK_ALL || process.env.MOCK_RENT_OBJECT_CHECKER === 'true',
  RENT_OBJECT_PHOTOS:
    MOCK_ALL || process.env.MOCK_RENT_OBJECT_PHOTOS === 'true',
} as const);
