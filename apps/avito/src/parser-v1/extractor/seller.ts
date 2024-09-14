export const extractSeller = (viewdata: Record<string, any>) => {
  const result: {
    seller?: string;
  } = {
    seller:
      viewdata.contactBarInfo.publicProfileInfo.itemSellerName ||
      viewdata.contactBarInfo.shop.contactPerson ||
      null,
  };

  return result;
};
