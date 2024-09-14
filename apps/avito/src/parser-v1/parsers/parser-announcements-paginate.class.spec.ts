import * as fs from 'fs/promises';
import * as DomParser from 'dom-parser';

import { ParserAnnouncementsPaginate } from './parser-announcements-paginate.class';

describe('Parser Announcements paginate', () => {
  let html_0: string;
  let html_1: string;
  let html_2: string;

  beforeAll(async () => {
    html_0 = await fs.readFile(
      './.testdata/avito/htmls-for-parsing/page_announcements_paginate_3.html',
      'utf8',
    );
    html_1 = await fs.readFile(
      './.testdata/avito/htmls-for-parsing/page_announcements_paginate_100.html',
      'utf8',
    );
    html_2 = await fs.readFile(
      './.testdata/avito/htmls-for-parsing/page_announcements_paginate_void.html',
      'utf8',
    );
  });

  it('With 3 pages', async () => {
    const dom = new DomParser().parseFromString(html_0);

    const paginate = new ParserAnnouncementsPaginate(dom).parse();

    expect(paginate).toEqual({ pages: 3 });
  }, 50_000);

  it('With 100 pages', async () => {
    const dom = new DomParser().parseFromString(html_1);

    const paginate = new ParserAnnouncementsPaginate(dom).parse();

    expect(paginate).toEqual({ pages: 100 });
  }, 50_000);

  it('With undefined', async () => {
    const dom = new DomParser().parseFromString(html_2);

    const paginate = new ParserAnnouncementsPaginate(dom).parse();

    expect(paginate).toBeUndefined();
  }, 50_000);
});
