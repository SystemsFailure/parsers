export const extractDescription = (viewdata: Record<string, any>) => {
  const id = Number(viewdata.paramsDto.itemId);
  const url = `https://www.avito.ru${viewdata.paramsDto.itemUrl}`;
  const title = viewdata.item.title;
  const description = viewdata.item.description;

  const result: {
    id: number;
    url: string;
    title: string;
    description: string;
  } = { id, url, title, description };

  return result;
};
