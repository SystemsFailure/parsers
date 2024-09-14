import * as fs from 'fs/promises';
import * as path from 'path';

import { OBJECT_TYPES_ENUM } from '@constants';

import { CianExtractor } from './extractor.class';

async function loadFilesFromFolder(
  folderPath: string,
): Promise<{ fileName: string; fileContent: string }[]> {
  const files = await fs.readdir(folderPath);
  const filePromises = files.map(async (fileName) => {
    const filePath = path.join(folderPath, fileName);
    const content = await fs.readFile(filePath, 'utf-8');
    return { fileName, fileContent: content };
  });
  return Promise.all(filePromises);
}

/**
 * Позитивные тесты на основе реверс-инженеринга объектов парсинга
 */

describe('Cian extractor tests', () => {
  const testobject: Map<
    string,
    {
      name: string;
      url: string;
      testfile: string;
      category: number;
      item: Record<string, any>;
    }
  > = new Map();

  beforeAll(async () => {
    const files = await loadFilesFromFolder(
      './.testdata/cian/items-for-extracting',
    );

    for (const file of files) {
      const json = JSON.parse(file.fileContent);
      testobject.set(file.fileName, {
        name: json.name,
        url: json.url,
        category: json.category,
        testfile: file.fileName,
        item: json.item,
      });
    }
  });

  it('[27.05.2024] [Full] Сдается 3-этажный таунхаус, 323 м²', async () => {
    const item = testobject.get('0.json');
    const extractor = new CianExtractor({
      item: item.item,
    });

    const description = extractor.description();
    const objectType = extractor.objectType();
    const storey = extractor.storey();
    const deposit = extractor.deposit();
    const photos = extractor.photos();
    const areas = extractor.areas();
    const address = extractor.address();
    const seller = extractor.seller();

    expect(description.url).toEqual(item.url);
    expect(description.id).toEqual(+'293933482');
    expect(typeof description.description).toEqual('string');

    expect(seller).toEqual({
      seller: 'Ashtons International Realty',
    });

    expect(objectType).toEqual(OBJECT_TYPES_ENUM('Дуплекс/Таунхаус'));

    expect(areas).toEqual({
      area: 323,
      areaKitchen: null,
      areaLiving: null,
    });

    expect(storey).toEqual({
      storey: null,
      storeyNumber: 3,
    });

    expect(deposit).toEqual({
      deposit: 650000,
      price: 650000,
    });

    expect(photos).toEqual([
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000520690-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514553-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514554-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514521-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514506-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514524-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514541-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514552-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514507-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514539-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514503-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000695872-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514556-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514545-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514549-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514526-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514551-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514547-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514536-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514516-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514515-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514513-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514542-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514519-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514512-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514538-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514528-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514543-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514509-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000520689-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514514-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514532-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514527-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514535-4.jpg',
      'https://images.cdn-cian.ru/images/taunhaus-moskva-minskaya-ulica-2000514533-4.jpg',
    ]);

    expect(address).toEqual({
      district: 'р-н Раменки',
      houseNumber: 1,
      region: 'Москва',
      street: 'Минская улица',
    });
  });
});
