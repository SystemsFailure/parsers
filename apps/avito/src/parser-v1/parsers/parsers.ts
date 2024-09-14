import * as DomParser from 'dom-parser';

import { HtmlParser } from './html-parser';

import { ParserAnnouncements } from './parser-announcements.class';
import { ParserAnnouncementsPaginate } from './parser-announcements-paginate.class';
import { ParserViewdata } from './parser-viewdata.class';
import { ParserManyRequests } from './parser-many-requests';

import { ParserManyRequestsError } from './errors';

/**
 * Оборачивает парсер добавляя парсинг на доступности страницы по ip,
 * если страница не доступна по ip, то бросит исключения
 */
function factoryParser<P extends new (dom: DomParser.Dom) => HtmlParser<any>>(
  contructor: P,
) {
  type Result = P extends new (dom: DomParser.Dom) => HtmlParser<infer R>
    ? R
    : never;

  return (page: string | DomParser.Dom) => {
    const dom =
      typeof page === 'string' ? new DomParser().parseFromString(page) : page;

    const parserManyRequests = new ParserManyRequests(dom);
    const { hasManyRequests } = parserManyRequests.parse();

    if (hasManyRequests) {
      throw new ParserManyRequestsError('detected many requested');
    }

    const parser = new contructor(dom);
    const parsed = parser.parse() as Result;

    return { parsed, dom };
  };
}

export type Parser<T> = (page: string | DomParser.Dom) => {
  parsed: T;
  dom: DomParser.Dom;
};

export const parseAnnouncements: Parser<{ id: number; url: string }[]> =
  factoryParser(ParserAnnouncements);

export const parseAnnouncementsPaginate: Parser<void | {
  pages: number;
}> = factoryParser(ParserAnnouncementsPaginate);

export const parseViewdata: Parser<Record<string, any>> =
  factoryParser(ParserViewdata);
