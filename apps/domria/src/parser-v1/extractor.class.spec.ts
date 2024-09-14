import * as fs from 'fs/promises';
import * as path from 'path';

import { OBJECT_TYPES_ENUM } from '@constants';

import { DomriaExtractor } from './extractor.class';

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

describe('Domria extractor tests', () => {
  const testobject: Map<
    string,
    {
      name: string;
      url: string;
      testfile: string;
      item: Record<string, any>;
      initstate: Record<string, any>;
    }
  > = new Map();

  beforeAll(async () => {
    const files = await loadFilesFromFolder(
      './.testdata/domria/items-for-extracting',
    );

    for (const file of files) {
      const json = JSON.parse(file.fileContent);
      testobject.set(file.fileName, {
        name: json.name,
        url: json.url,
        testfile: file.fileName,
        item: json.item,
        initstate: json.initstate,
      });
    }
  });

  it('[27.05.2024] [Full] Долгосрочная аренда 1к квартиры на ул. Набережно-Крещатицкая 35', async () => {
    const item = testobject.get('0.json');
    const extractor = new DomriaExtractor({
      item: item.item,
      initstate: item.initstate,
    });

    const description = extractor.description();
    const seller = extractor.seller();
    const objectType = extractor.objectType();
    const storey = extractor.storey();
    const deposit = extractor.deposit();
    const photos = extractor.photos();
    const areas = extractor.areas();
    const address = extractor.address();

    expect(description.title).toEqual(item.name);
    expect(description.url).toEqual(item.url);
    expect(description.id).toEqual('31611476');
    expect(typeof description.description).toEqual('string');

    expect(seller).toEqual({
      seller: 'олександра',
    });

    expect(objectType).toEqual(OBJECT_TYPES_ENUM('1-к. квартира'));

    expect(areas).toEqual({
      area: 28,
      areaKitchen: 5,
      areaLiving: 17,
    });

    expect(storey).toEqual({
      storey: 3,
      storeyNumber: 5,
    });

    expect(deposit).toEqual({
      price: 20000,
    });

    expect(photos).toEqual([
      'https://cdn.riastatic.com/photosnew/dom/photo/dolgosrochnaya-arenda-kvartira-kiev-podolskiy-naberejno-kreschatitskaya-ulitsa__297730853fl.jpg',
      'https://cdn.riastatic.com/photosnew/dom/photo/dolgosrochnaya-arenda-kvartira-kiev-podolskiy-naberejno-kreschatitskaya-ulitsa__297730859fl.jpg',
      'https://cdn.riastatic.com/photosnew/dom/photo/dolgosrochnaya-arenda-kvartira-kiev-podolskiy-naberejno-kreschatitskaya-ulitsa__297730846fl.jpg',
      'https://cdn.riastatic.com/photosnew/dom/photo/dolgosrochnaya-arenda-kvartira-kiev-podolskiy-naberejno-kreschatitskaya-ulitsa__297730797fl.jpg',
      'https://cdn.riastatic.com/photosnew/dom/photo/dolgosrochnaya-arenda-kvartira-kiev-podolskiy-naberejno-kreschatitskaya-ulitsa__297730871fl.jpg',
      'https://cdn.riastatic.com/photosnew/dom/photo/dolgosrochnaya-arenda-kvartira-kiev-podolskiy-naberejno-kreschatitskaya-ulitsa__297730873fl.jpg',
      'https://cdn.riastatic.com/photosnew/dom/photo/dolgosrochnaya-arenda-kvartira-kiev-podolskiy-naberejno-kreschatitskaya-ulitsa__297730876fl.jpg',
      'https://cdn.riastatic.com/photosnew/dom/photo/dolgosrochnaya-arenda-kvartira-kiev-podolskiy-naberejno-kreschatitskaya-ulitsa__297730889fl.jpg',
      'https://cdn.riastatic.com/photosnew/dom/photo/dolgosrochnaya-arenda-kvartira-kiev-podolskiy-naberejno-kreschatitskaya-ulitsa__297730839fl.jpg',
    ]);

    expect(address).toEqual({
      city: 'Київ',
      district: 'Подільський',
      region: 'Київська область',
      houseNumber: 35,
      streetName: 'Набережно-Хрещатицька',
    });
  });
});
