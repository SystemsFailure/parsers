import { createHash } from 'crypto';

/**
 * На основе оригинально URL фотографии генерируем md5 хеш и преобразуем
 * его в строчку вида uuid-v4
 *
 * Это нужно, чтобы понять что те или иные фотографии уже были выгруженны в S3
 */
export const generatePhotoUUIDByOriginalUrl = (props: {
  originalPhotoUrl: string;
}): {
  uuidv4: string;
} => {
  const hash = createHash('md5');
  hash.update(props.originalPhotoUrl);
  const md5 = hash.digest('hex');
  const uuidv4 = `${md5.slice(0, 8)}-${md5.slice(8, 12)}-${md5.slice(12, 16)}-${md5.slice(16, 20)}-${md5.slice(20)}`;

  return { uuidv4 };
};
