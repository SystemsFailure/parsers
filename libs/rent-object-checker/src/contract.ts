export abstract class RentObjectCheckerServiceContract {
  abstract checkExistedRentObjectIds(props: {
    source: string;
    rentObjectIds: string[];
  }): Promise<{
    notExistedIds: Set<string>;
    existedIds: Set<string>;
  }>;

  public async groupedItems<T>(props: {
    source: 'avito' | 'youla' | 'olx' | 'domria' | 'cian';
    items: T[];
    getIdFromItem: (item: T) => string;
  }): Promise<{ existed: T[]; notExisted: T[] }> {
    const { items, getIdFromItem } = props;
    const mapper = (item: any) => String(getIdFromItem(item));

    const ids = items.map(mapper);
    const { notExistedIds, existedIds } = await this.checkExistedRentObjectIds({
      source: props.source,
      rentObjectIds: ids,
    });

    return {
      existed: items.filter((item) => existedIds.has(mapper(item))),
      notExisted: items.filter((item) => notExistedIds.has(mapper(item))),
    };
  }
}
