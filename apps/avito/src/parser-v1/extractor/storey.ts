export const extractStorey = (viewdata: Record<string, any>) => {
  const storey = Number(viewdata.ga[1]?.floor) || null;
  const storeyNumber = Number(viewdata.ga[1]?.floors_count) || null;

  const result: {
    storey?: number;
    storeyNumber?: number;
  } = { storey, storeyNumber };

  return result;
};
