import { HtmlParser } from './html-parser';

/**
 * Парсит ссылки на объявления со страницы с объявлениями
 */
export class ParserAnnouncements extends HtmlParser<
  { id: number; url: string }[]
> {
  public parse() {
    const items = this.dom.getElementsByAttribute('data-marker', 'item');

    if (!items || !items.length) {
      return [];
    }

    const result: {
      id: number;
      url: string;
    }[] = [];

    for (const item of items) {
      const links = item.getElementsByTagName('a');
      if (!links) {
        continue;
      }

      const titleNode = links[0];
      let href: string | null = titleNode.getAttribute('href');
      if (!href) {
        continue;
      }

      const itemId = Number(item.getAttribute('data-item-id'));

      if (href.startsWith('/')) {
        href = `https://www.avito.ru${href}`;
      }

      result.push({ id: itemId, url: href });
    }
    return result;
  }
}
