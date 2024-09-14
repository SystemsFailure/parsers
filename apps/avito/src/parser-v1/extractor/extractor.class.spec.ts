import * as fs from 'fs/promises';
import * as path from 'path';

import { OBJECT_TYPES_ENUM } from '@constants';

import { AvitoExtractor } from './extractor.class';
import { extractAddress } from './address';

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

describe('Avito extractor tests', () => {
  const testobject: Map<
    string,
    {
      name: string;
      url: string;
      testfile: string;
      viewdata: Record<string, any>;
    }
  > = new Map();

  beforeAll(async () => {
    const files = await loadFilesFromFolder(
      './.testdata/avito/items-for-extracting',
    );

    for (const file of files) {
      const json = JSON.parse(file.fileContent);
      testobject.set(file.fileName, {
        name: json.name,
        url: json.url,
        testfile: file.fileName,
        viewdata: json.viewdata,
      });
    }
  });

  it('[27.05.2024] [Full] Дом 60 м² на участке 6,5 сот.', async () => {
    const item = testobject.get('0.json');
    const extractor = new AvitoExtractor({
      viewdata: item.viewdata,
      city: 'Краснодар',
      region: 'Краснодарский край',
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
    expect(description.id).toEqual(+'2474889195');
    expect(typeof description.description).toEqual('string');

    expect(geocord).toEqual({
      lat: 45.0901995587049,
      lon: 38.930488080870646,
    });

    expect(seller).toEqual({
      seller: 'Виталий',
    });

    expect(objectType).toEqual(OBJECT_TYPES_ENUM('Дом'));

    expect(areas).toEqual({
      area: 60,
      areaKitchen: null,
      areaLiving: null,
    });

    expect(storey).toEqual({
      storey: null,
      storeyNumber: 1,
    });

    expect(deposit).toEqual({
      commission: null,
      deposit: 10000,
      price: 8000,
    });

    expect(photos).toEqual([
      'https://30.img.avito.st/image/1/1.orin07a5DlGResxU78Hs7K9xDFcZcoxZ0XcMUxVmClM.vAMJkbsR2sMycM4VYBAb-ibdeK0r359f8l8G6gyY-Ko',
      'https://00.img.avito.st/image/1/1.nzWFnba5M9yzNPHZt7e0YII_Mdo7PLHU8zkx3jcoN94.1lRVacqfPMpS9mHfIZ49NC1FnhSi51fvqzA8XP5t7Uc',
      'https://80.img.avito.st/image/1/1.PLeie7a5kF6U0lJb1ndy46rZklgc2hJW1N-SXBDOlFw.Mx20l7BcoeCvyPFg854hq7BWIuVXDLEynq41v9snSEw',
      'https://30.img.avito.st/image/1/1.Fg7Zhba5uufvLHji-cVGWN4nuOFnJDjvryG45WswvuU.E9s28K0ZT_hCDHKhgGi5BNCWzMES8qb2bzA2giZ_e_0',
      'https://60.img.avito.st/image/1/1.fVjdCba50bHroBO0qwQwK9qr07djqFO5q63Ts2-81bM.LBOxABrCYI8Y2LrNz-bihn9d2td2xGXH_wC_2u_dzz8',
      'https://20.img.avito.st/image/1/1.awiFTra5x-Gz5wXk32dAXYLsxec770Xp8-rF4zf7w-M.G-jyuuTEoeOgH8BGn4_oBCPQ0iKXesMNF0_6MfulXMA',
      'https://50.img.avito.st/image/1/1.vK4Ddra5EEc139JCd2Tx3QTUEkG915JPddISRbHDFEU.rjHrojJ9ANczJ_JsRwg94J73avInqExzIumIrnIE5-8',
      'https://40.img.avito.st/image/1/1.A-g-c7a6rwEI2m0END8GzeTQqQuKUKfDj9CtB57WrQ.QDAB29rbh9NpWN08bMa6LDXNXJH_hbMvixHcOCiaf9M',
      'https://30.img.avito.st/image/1/1.VM9_p7a5-CZJDjojW7p6-30F-iDBBnouCQP6JM0S_CQ.AO4eHTQ03S-uC-dTQx4e_cSiCcMlu_eX_on_faP5JcQ',
      'https://30.img.avito.st/image/1/1.0vrbZ7a5fhPtzrwW80CDz9nFfBVlxvwbrcN8EWnSehE.FqksXNsHbCuZCOBMaypDB9HBFbmqt0jNiIQvO-RlhgI',
      'https://70.img.avito.st/image/1/1.9ls2v7a6WrIAFpi3Vqj0fuwcXLiCnFJwhxxYtJYaWA.2UmW01z2N4qqhc5WFOCX97G9x0j-1q5rJMzuKh3B5dY',
      'https://20.img.avito.st/image/1/1.sYEu1ba5HWgYfN9tQMP_6Dl3H26QdJ9gWHEfapxgGWo.IIgj64EY1W7BAzdYEyQPcVfVJNKDB2WcClqXbrrmBIU',
      'https://30.img.avito.st/image/1/1.j3cAJba5I542jOGbEh-aZyKHIZi-hKGWdoEhnLKQJ5w.z-J0-k87FwOmzOtSSUs-Abp6hY4uqoowBokbntOWoO8',
      'https://10.img.avito.st/image/1/1.SMQWpLa65C0gDSYoColK4cwH4ieih-zvpwfmK7YB5g.114cGPZO0RnlIsg3GDTaMtFHIUX63-Ew3Fb-rlZa2bk',
      'https://70.img.avito.st/image/1/1.TUIhxba54asXbCOuN9gDKzZn462fZGOjV2HjqZNw5ak.T4W3WQYJSeVS7V6nwGQathjh4dRjSaL1IYcHOiDY0OI',
      'https://10.img.avito.st/image/1/1.64PfaLa5R2rpwYVvhVP-k_3KRWxhycViqcxFaG3dQ2g.OPehUlFRmRIIClegQIWSXQ9YYf9mQ-gbd-p_lw-s6qE',
      'https://40.img.avito.st/image/1/1.retUp7a6AQJiDsMHAvGozo4EBwjghAnA5QQDBPQCAw.B5SdZnA1T5adxxevh0BZt1UUxIObJhmDkKoTov5HReg',
      'https://30.img.avito.st/image/1/1.Wjzjxba59tXVbDTQ28gXT-Rn9NNdZHTdlWH011Fw8tc.IfT8R2Wha5pUJZQJ21Kn3lNKmDIiCTPY8D9hlRpUZ8g',
      'https://60.img.avito.st/image/1/1.Y2JmoLa6z4tQCQ2OLM1mR7wDyYHSg8dJ1wPNjcYFzQ.grsttw0h-Ri-mcgavjNQ8hiKXeeabZ1zX4MDg4y54LI',
      'https://90.img.avito.st/image/1/1.3m_357a5cobBTrCDx6CdX9VFcIBJRvCOgUNwhEVSdoQ.-_9-EhQsen7G2xBswH8XOPJGlJnt2BWUdPab8CfYw24',
      'https://00.img.avito.st/image/1/1.4LqXc7a5TFOh2o5W2zijirXRTlUp0s5b4ddOUSXGSFE.c1kPsazhe-OdksNTqRXJtm0mdZ-f8NKTI3hKjHjGm2I',
      'https://20.img.avito.st/image/1/1.Jbm8h7a5iVCKLktV-vtmiZ4li1YCJgtYyiOLUg4yjVI.knlfMp-xfDQDGq5qKV8_Osx7HwFD4QaVZCi4gF6sMJs',
      'https://60.img.avito.st/image/1/1.0Dggc7a5fNEW2r7UDEjFKALRftee0v7ZVtd-05LGeNM.hC5pudWeCMN_LLWMyHBDQycro7-jj0M0JGscglJ1ubE',
      'https://20.img.avito.st/image/1/1.j9iIfba5IzG-1OE0mlekjY_fITc23KE5_tkhMzrIJzM.AXRW0A4wpzgwvD11qpHDwMKljWmCvrOEnA3MYtHYU2Y',
      'https://70.img.avito.st/image/1/1._I3LH7a5UGT9tpJhvzTX2My9UmJ1vtJsvbtSZnmqVGY.3STUP82H8y0XZlCOryfZf6t44n_6_WYLw2Nh5RbXUug',
      'https://30.img.avito.st/image/1/1.3P6zsba5cBeFGLISh_KfzpETchENEPIfxRVyFQEEdBU.qrjFwDMP3y27ZrZUx8FfojTiUVxxQ-s2XRNq8-NpMvk',
      'https://60.img.avito.st/image/1/1.l0Htera5O6jb0_mtzxjZKPrYOa5T27mgm945ql_PP6o.8vQE1XOmbne7oDsgRd-9UpMx2Ajw0z9fLX0J9DtxMoM',
      'https://70.img.avito.st/image/1/1.DSmlULa5ocCT-WPFs2QZKofyo8Yb8SPI0_SjwhflpcI.pq1m-iQU7ksGy9DDrdim8OzjhdqAjsz5h2g71eGLPok',
    ]);

    expect(address).toEqual({
      houseNumber: '143',
      addressDistrict: 'р-н Прикубанский',
      addressStreet: 'садовое товарищество Дружба-1',
    });
  });
});

describe('Avito extractor.address', () => {
  it('t1', () => {
    const region = 'Краснодарский край';
    const city = 'Краснодар';

    const address = extractAddress({
      region,
      city,
      viewdata: {
        item: {
          address:
            'Краснодарский край, Краснодар, Карасунский внутригородской округ, жилой район Новознаменский, Становая ул., 24',
        },
        geo: {
          references: [
            {
              after: null,
              afterWithIcon: null,
              colors: [],
              content: 'р-н Карасунский',
            },
          ],
        },
      },
    });

    expect(address).toEqual({
      addressDistrict: 'жилой район Новознаменский',
      addressStreet: 'Становая ул.',
      houseNumber: '24',
    });
  });
});
