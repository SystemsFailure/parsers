export const extractPhotos = (viewdata: Record<string, any>) => {
  const photos = [] as string[];

  for (const image of viewdata.item.imageUrls) {
    photos.push(image['640x480']);
  }

  const result = {
    photos,
  };

  return result;
};
