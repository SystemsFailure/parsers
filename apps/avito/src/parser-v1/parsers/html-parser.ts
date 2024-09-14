import * as DomParser from 'dom-parser';

export abstract class HtmlParser<T> {
  public constructor(protected dom: DomParser.Dom) {}

  public get html(): string {
    return this.dom['rawHTML'] as string;
  }

  public abstract parse(): T;
}
