import * as fs from 'fs/promises';
import * as path from 'path';

import { OBJECT_TYPES_ENUM } from '@constants';

import { YoulaExtractor } from './extractor.class';

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

describe('Youla extractor tests', () => {
  const testobject: Map<
    string,
    {
      name: string;
      url: string;
      testfile: string;
      fullItem: Record<string, any>;
    }
  > = new Map();

  beforeAll(async () => {
    const files = await loadFilesFromFolder(
      './.testdata/youla/items-for-extracting',
    );

    for (const file of files) {
      const json = JSON.parse(file.fileContent);
      testobject.set(file.fileName, {
        name: json.name,
        url: json.url,
        testfile: file.fileName,
        fullItem: json.fullItem,
      });
    }
  });

  it('[27.05.2024] [Full] Коттедж, 550 м²', async () => {
    const item = testobject.get('0.json');
    const extractor = new YoulaExtractor({ fullItem: item.fullItem });

    const description = extractor.description();
    const geocord = extractor.geocord();
    const seller = extractor.seller();
    const objectType = extractor.objectType();
    const storey = extractor.storey();
    const deposit = extractor.deposit();
    const photos = extractor.photos();
    const areas = extractor.areas();
    const address = extractor.address();

    expect(description.title).toEqual(item.name);
    expect(description.url).toEqual(item.url);
    expect(description.id).toEqual('6607302a10810c95c605bfcd');
    expect(typeof description.description).toEqual('string');

    expect(geocord).toEqual({
      lat: 55.746603,
      lon: 37.909759,
    });

    expect(seller).toEqual({
      seller: 'Зыкова Анна',
    });

    expect(objectType).toEqual(OBJECT_TYPES_ENUM('Коттедж'));

    expect(areas).toEqual({
      area: 550,
      areaKitchen: null,
      areaLiving: null,
    });

    expect(storey).toEqual({
      storey: null,
      storeyNumber: 3,
    });

    expect(deposit).toEqual({
      deposit: null,
      price: 30000,
    });

    expect(photos).toEqual([
      'https://cdn1.youla.io/files/images/orig/66/07/66072e7b119a0c11a90a687b-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e7be55de76e2300d6e2-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e7c02e082452f0dfcf7-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e78d1d556e21e0d4142-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e77824cfdcffb05293a-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e8014fd0679b401084b-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072ebe5c0b205ec6063025-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072ebd223dfcadc30c5c79-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e722b35a19a7c044533-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e720216fb92ab0e5ea5-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e77ca929da5790c526f-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e7614fd0679b401084a-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e768c859f6f0701017c-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e7c38db5a1f15084a9c-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e7250b639b5b7030fe9-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e7a949a2c024205943a-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e7ce43341f8520b70cf-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e8187941811ef040682-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e7f63007547f40e7fb1-2.jpg',
      'https://cdn1.youla.io/files/images/orig/66/07/66072e80e58457172b0b229f-2.jpg',
    ]);

    expect(address).toEqual({
      houseNumber: null,
      streetName: 'Граничная улица',
    });
  });
});
