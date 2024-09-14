import { createWorker } from 'tesseract.js';

/**
 * Получает телефон с картинки
 */
export const tryExtractPhone = async (
  imageBin: Buffer,
): Promise<void | string> => {
  const worker = await createWorker('eng', 1);
  try {
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789',
    });

    const {
      data: { text: phoneData },
    } = await worker.recognize(imageBin);

    return phoneData;
  } catch {
    return;
  } finally {
    await worker.terminate();
  }
};
