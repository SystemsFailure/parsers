import { HtmlParser } from './html-parser';

/**
 * Парсит информацию о не доступности страницы по ip
 */
export class ParserManyRequests extends HtmlParser<{
  hasManyRequests: boolean;
}> {
  public parse(): {
    hasManyRequests: boolean;
  } {
    const titles = this.dom.getElementsByTagName('title');
    if (titles[0]?.textContent === 'Доступ ограничен: проблема с IP') {
      return { hasManyRequests: true };
    }
    const firewallTitle = this.dom.getElementsByClassName('firewall-title');
    if (firewallTitle[0]?.textContent === 'Доступ ограничен: проблема с IP') {
      return { hasManyRequests: true };
    }

    return { hasManyRequests: false };
  }
}
