export const extractAreas = (viewdata: Record<string, any>) => {
  const area =
    Number(viewdata.ga[1]?.area?.replace(/\D/g, '')) ||
    Number(viewdata.ga[1]?.house_area?.replace(/\D/g, '')) ||
    null;
  const areaKitchen =
    Number(viewdata.ga[1]?.area_kitchen?.replace(/\D/g, '')) || null;
  const areaLiving =
    Number(viewdata.ga[1]?.area_live?.replace(/\D/g, '')) || null;

  const result: {
    area?: number;
    areaKitchen?: number;
    areaLiving?: number;
  } = { area, areaKitchen, areaLiving };

  return result;
};
