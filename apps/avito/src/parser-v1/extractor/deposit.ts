export const extractDeposit = (viewdata: Record<string, any>) => {
  const result: {
    price?: number;
    deposit?: number;
    commission?: number;
  } = {
    price: null,
    deposit: null,
    commission: null,
  };

  if (viewdata.item.price) {
    result.price = Number(viewdata.item.price);
  }

  if (viewdata.priceDataDTO?.depositCommission) {
    const depItems = viewdata.priceDataDTO.depositCommission
      .split(',')
      .map((el: string) => el.trim());

    for (const depItem of depItems) {
      if (depItem.includes('залог&nbsp;')) {
        result.deposit = Number(depItem.replace(/\D/g, ''));
      }

      if (depItem.includes('комиссия&nbsp;')) {
        result.commission = Number(depItem.replace(/\D/g, ''));
      }
    }
  }

  if (!result.deposit) {
    for (const { description, title } of viewdata.paramsBlock.items) {
      if (title === 'Залог') {
        result.deposit = Number(description.replace(/\D/g, ''));
      }
    }
  }

  return result;
};
