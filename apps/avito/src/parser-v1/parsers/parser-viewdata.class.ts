import * as urldecode from 'urldecode';

import { HtmlParser } from './html-parser';

import { ParserError } from './errors';

/**
 * Парсит объект `__initialData__` (называется `viewdata` в контексте парсера) со страницы с объявлениями
 */
export class ParserViewdata extends HtmlParser<Record<string, any>> {
  public parse(): Record<string, any> {
    const scripts = this.dom.getElementsByTagName('script');

    let result = null;

    for (const script of scripts) {
      if (!script.textContent.includes('__initialData__')) {
        continue;
      }

      const str = script.textContent.split('"')[1];
      const obj = JSON.parse(urldecode(str));
      let prop = '@avito/bx-item-view';

      for (const key in obj) {
        if (key.includes('bx-item-view')) {
          prop = key;
        }
      }

      result = obj[prop].buyerItem;
    }

    if (!result) {
      throw new ParserError('Item not found');
    }

    return result;
  }
}
