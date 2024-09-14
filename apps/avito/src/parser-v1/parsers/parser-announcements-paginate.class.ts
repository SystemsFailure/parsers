import { HtmlParser } from './html-parser';

/**
 * Парсит количество доступных страниц для парсинга со страницы с объявлениями
 */
export class ParserAnnouncementsPaginate extends HtmlParser<void | {
  pages: number;
}> {
  public parse(): void | { pages: number } {
    const navigation = this.dom.getElementsByAttribute(
      'data-marker',
      'pagination-button',
    );

    if (navigation.length === 0) {
      return undefined;
    }

    const spans = navigation[0].getElementsByTagName('span');

    const lastSpan = spans[spans.length - 1];
    const lastPage = Number(lastSpan!.textContent);

    return { pages: lastPage };
  }
}
