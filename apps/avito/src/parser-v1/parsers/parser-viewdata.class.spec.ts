import * as fs from 'fs/promises';
import * as DomParser from 'dom-parser';

import { ParserViewdata } from './parser-viewdata.class';

describe('Parser Viewdata', () => {
  let html_0: string;

  beforeAll(async () => {
    html_0 = await fs.readFile(
      './.testdata/avito/htmls-for-parsing/page_announcement_0.html',
      'utf8',
    );
  });

  it('On page 0', async () => {
    const dom = new DomParser().parseFromString(html_0);

    const parsed = new ParserViewdata(dom).parse();

    expect(parsed).not.toBeUndefined();
    expect(parsed).toHaveProperty('item');
    expect(parsed).toHaveProperty('paramsDto');
    expect(parsed).toHaveProperty('priceDataDTO');
    expect(parsed).toHaveProperty('seller');
    expect(parsed).toHaveProperty('contactBarInfo');
  }, 50_000);
});
