import * as fs from 'fs/promises';
import * as path from 'path';

import { OBJECT_TYPES_ENUM } from '@constants';

import { OlxExtractor } from './extractor.class';

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

describe('Olx extractor tests', () => {
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
      './.testdata/olx/items-for-extracting',
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

  it('[27.05.2024] [Full] Здам будинок 140 м2 у води біля Дніпра і метро Славутич, Осокорки', async () => {
    const item = testobject.get('0.json');
    const extractor = new OlxExtractor({
      item: item.item,
      input: {
        category: item.category,
      },
    });

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
    expect(description.id).toEqual('839994009');
    expect(typeof description.description).toEqual('string');

    expect(geocord).toEqual({
      lat: 50.40931,
      lon: 30.69263,
    });

    expect(seller).toEqual({
      seller: 'Олександр',
    });

    expect(objectType).toEqual(OBJECT_TYPES_ENUM('Дом'));

    expect(areas).toEqual({
      area: 140,
      areaKitchen: null,
      areaLiving: null,
    });

    expect(storey).toEqual({
      storey: null,
      storeyNumber: 3,
    });

    expect(deposit).toEqual({
      commision: null,
      price: 1400,
    });

    expect(photos).toEqual([
      'https://ireland.apollo.olxcdn.com:443/v1/files/dkyknb495m301-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/x4bk7isj5cgm-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/4qikokh5wzaf2-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/2x813saq9p7s3-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/jaj7qbd22dke-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/wq1k8iombo5f2-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/xrv5melrlsx9-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/myjgdfbg6s4c1-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/nnyx45fw1kyo3-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/0jn2assv45fc3-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/9whgnuby6bk03-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/c5qyil2qlrcy1-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/7tu2fmz2y43c2-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/6qttj3a7c3gf3-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/ax175unkli5e-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/gqte7k4qlw6r2-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/1mj42ywqmnzl1-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/6kjgjs89elvv2-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/dxhk10stgffo-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/law8joxf96sw-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/j8guvmaayk2n-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/uns427w8lb632-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/0vnadzx0yj452-UA/image',
      'https://ireland.apollo.olxcdn.com:443/v1/files/8b0gzc8omvc13-UA/image',
    ]);

    expect(address).toEqual({
      city: 'Київ',
      district: 'Дарницький',
      region: 'Київська область',
    });
  });
});
