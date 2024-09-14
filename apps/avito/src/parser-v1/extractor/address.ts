export const extractAddress = (props: {
  viewdata: Record<string, any>;
  region: string;
  city: string;
}) => {
  const { viewdata, region, city } = props;

  const addressArr = viewdata.item.address
    .split(', ')
    .filter((el: string) => ![region, city].includes(el));

  let houseNumber: any = null;
  let addressStreet: any = null;
  let addressDistrict: any = null;

  if (addressArr.length > 0) {
    if (addressArr[addressArr.length - 1].includes('подъезд')) {
      addressArr.pop();
    }

    if (
      addressArr.length > 1 &&
      !addressArr[addressArr.length - 1].includes('ул.', 'жил', 'б-р', 'пр-т')
    ) {
      houseNumber = addressArr.pop();
    }

    if (addressArr.length > 0) {
      const streetName = addressArr.pop();
      addressStreet = streetName;
    }

    if (addressArr.length > 0) {
      const districtName = addressArr.pop();
      if (!['ул.', 'улица', 'пр-т'].some((el) => districtName.includes(el))) {
        addressDistrict = districtName;
      }
    }
  }

  const content = viewdata.item?.geo?.references?.[0]?.content;
  if (!addressDistrict && typeof content === 'string') {
    if (['р-н', 'район'].some((el) => content.includes(el))) {
      addressDistrict = content;
    }
  }

  return {
    houseNumber: (houseNumber as string) ?? null,
    addressStreet: (addressStreet as string) ?? null,
    addressDistrict: (addressDistrict as string) ?? null,
  };
};
