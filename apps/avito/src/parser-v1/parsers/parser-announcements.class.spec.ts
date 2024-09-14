import * as fs from 'fs/promises';
import * as DomParser from 'dom-parser';

import { ParserAnnouncements } from './parser-announcements.class';

/// TODO: replace on fs loader

const ANNOUNCEMENTS_LIST = Object.freeze([
  {
    id: 4090229142,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_64_m_na_uchastke_1_sot._4090229142',
  },
  {
    id: 3681584932,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_70_m_na_uchastke_4_sot._3681584932',
  },
  {
    id: 2040824846,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_22_m_na_uchastke_1_sot._2040824846',
  },
  {
    id: 3455582338,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dacha_92_m_na_uchastke_3_sot._3455582338',
  },
  {
    id: 3934309144,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_300_m_na_uchastke_9_sot._3934309144',
  },
  {
    id: 3829241348,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_130_m_na_uchastke_3_sot._3829241348',
  },
  {
    id: 2474318231,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_300_m_na_uchastke_3_sot._2474318231',
  },
  {
    id: 3920771730,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_40_m_na_uchastke_3_sot._3920771730',
  },
  {
    id: 3917293829,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_78_m_na_uchastke_5_sot._3917293829',
  },
  {
    id: 3937582731,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/kottedzh_150_m_na_uchastke_3_sot._3937582731',
  },
  {
    id: 4449828645,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_128_m_na_uchastke_3_sot._4449828645',
  },
  {
    id: 3837526064,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_42_m_na_uchastke_1_sot._3837526064',
  },
  {
    id: 3781801565,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_200_m_na_uchastke_8_sot._3781801565',
  },
  {
    id: 4204489338,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_50_m_na_uchastke_2_sot._4204489338',
  },
  {
    id: 1191119632,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_45_m_na_uchastke_3_sot._1191119632',
  },
  {
    id: 4338033576,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_90_m_na_uchastke_4_sot._4338033576',
  },
  {
    id: 2249279170,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_170_m_na_uchastke_3_sot._2249279170',
  },
  {
    id: 3851345084,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_220_m_na_uchastke_6_sot._3851345084',
  },
  {
    id: 3893684530,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_195_m_na_uchastke_3_sot._3893684530',
  },
  {
    id: 3958669176,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_25_m_na_uchastke_1_sot._3958669176',
  },
  {
    id: 3964153681,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_100_m_na_uchastke_1_sot._3964153681',
  },
  {
    id: 1645759257,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_40_m_na_uchastke_3_sot._1645759257',
  },
  {
    id: 3003509716,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_30_m_na_uchastke_1_sot._3003509716',
  },
  {
    id: 3994206052,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_100_m_na_uchastke_3_sot._3994206052',
  },
  {
    id: 1976066920,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_100_m_na_uchastke_3_sot._1976066920',
  },
  {
    id: 1776829797,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/kottedzh_400_m_na_uchastke_10_sot._1776829797',
  },
  {
    id: 4057960333,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_555_m_na_uchastke_7_sot._4057960333',
  },
  {
    id: 3797427231,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_80_m_na_uchastke_6_sot._3797427231',
  },
  {
    id: 3926642551,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_65_m_na_uchastke_2_sot._3926642551',
  },
  {
    id: 2477045770,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_20_m_na_uchastke_5_sot._2477045770',
  },
  {
    id: 2796460522,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_145_m_na_uchastke_6_sot._2796460522',
  },
  {
    id: 3624282547,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_253_m_na_uchastke_6_sot._3624282547',
  },
  {
    id: 3916825694,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_81_m_na_uchastke_5_sot._3916825694',
  },
  {
    id: 3857539125,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_85_m_na_uchastke_4_sot._3857539125',
  },
  {
    id: 4052497797,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_336_m_na_uchastke_69_sot._4052497797',
  },
  {
    id: 3330962383,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/kottedzh_405_m_na_uchastke_7_sot._3330962383',
  },
  {
    id: 1086143068,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_34_m_na_uchastke_1_sot._1086143068',
  },
  {
    id: 3167519443,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_175_m_na_uchastke_35_sot._3167519443',
  },
  {
    id: 1878116305,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_65_m_na_uchastke_4_ga_1878116305',
  },
  {
    id: 3670364598,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_180_m_na_uchastke_64_sot._3670364598',
  },
  {
    id: 3921185623,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_320_m_na_uchastke_6_sot._3921185623',
  },
  {
    id: 4027486471,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_90_m_na_uchastke_4_sot._4027486471',
  },
  {
    id: 3963742370,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_200_m_na_uchastke_6_sot._3963742370',
  },
  {
    id: 3464576054,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_55_m_na_uchastke_8_sot._3464576054',
  },
  {
    id: 2827553931,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_125_m_na_uchastke_3_sot._2827553931',
  },
  {
    id: 3724102812,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_100_m_na_uchastke_1_sot._3724102812',
  },
  {
    id: 3661554225,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/kottedzh_400_m_na_uchastke_6_sot._3661554225',
  },
  {
    id: 3881197170,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_125_m_na_uchastke_1_sot._3881197170',
  },
  {
    id: 3657459267,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_140_m_na_uchastke_1_sot._3657459267',
  },
  {
    id: 2962938835,
    url: 'https://www.avito.ru/krasnodar/doma_dachi_kottedzhi/dom_24_m_na_uchastke_1_sot._2962938835',
  },
]);

describe('Parser Announcements', () => {
  let html_0: string;

  beforeAll(async () => {
    html_0 = await fs.readFile(
      './.testdata/avito/htmls-for-parsing/page_announcements_paginate_3.html',
      'utf8',
    );
  });

  it('Main', async () => {
    const dom = new DomParser().parseFromString(html_0);

    const announcements = new ParserAnnouncements(dom).parse();

    expect(announcements).toEqual(ANNOUNCEMENTS_LIST);
  }, 50_000);
});
