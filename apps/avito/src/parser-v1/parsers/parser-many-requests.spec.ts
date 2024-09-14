import * as fs from 'fs/promises';
import * as DomParser from 'dom-parser';

import { ParserManyRequests } from './parser-many-requests';

describe('Parser Page many request', () => {
  let html_0: string;
  let html_1: string;

  beforeAll(async () => {
    html_0 = await fs.readFile(
      './.testdata/avito/htmls-for-parsing/page_many_request_0.html',
      'utf8',
    );
    html_1 = await fs.readFile(
      './.testdata/avito/htmls-for-parsing/page_many_request_1.html',
      'utf8',
    );
  });

  it('Test on page 0', async () => {
    const dom = new DomParser().parseFromString(html_0);

    const { hasManyRequests } = new ParserManyRequests(dom).parse();
    expect(hasManyRequests).toBe(true);
  }, 50_000);

  it('Test on page 1', async () => {
    const dom = new DomParser().parseFromString(html_1);

    const { hasManyRequests } = new ParserManyRequests(dom).parse();
    expect(hasManyRequests).toBe(true);
  }, 50_000);
});
