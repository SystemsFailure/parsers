import { OBJECT_TYPES_ENUM } from '@constants';

export const extractObjectType = (
  viewdata: Record<string, any>,
): ReturnType<typeof OBJECT_TYPES_ENUM> => {
  switch (true) {
    case Number(viewdata.ga[1].categoryId) === 24 &&
      Number(viewdata.ga[1].rooms) >= 5:
      return OBJECT_TYPES_ENUM('5+ к. квартира');
    case Number(viewdata.ga[1].categoryId) === 24 &&
      Number(viewdata.ga[1].rooms) === 4:
      return OBJECT_TYPES_ENUM('4-к. квартира');
    case Number(viewdata.ga[1].categoryId) === 24 &&
      Number(viewdata.ga[1].rooms) === 3:
      return OBJECT_TYPES_ENUM('3-к. квартира');
    case Number(viewdata.ga[1].categoryId) === 24 &&
      Number(viewdata.ga[1].rooms) === 2:
      return OBJECT_TYPES_ENUM('2-к. квартира');
    case Number(viewdata.ga[1].categoryId) === 24 &&
      Number(viewdata.ga[1].rooms) === 1:
      return OBJECT_TYPES_ENUM('1-к. квартира');
    case Number(viewdata.ga[1].categoryId) === 24 &&
      viewdata.ga[1].rooms === 'Студия':
      return OBJECT_TYPES_ENUM('Студия');
    case [24, 25].includes(Number(viewdata.ga[1].categoryId)) &&
      viewdata.ga[1].type === 'Дом':
      return OBJECT_TYPES_ENUM('Дом');
    case [24, 25].includes(Number(viewdata.ga[1].categoryId)) &&
      viewdata.ga[1].type === 'Коттедж':
      return OBJECT_TYPES_ENUM('Коттедж');
    case [24, 25].includes(Number(viewdata.ga[1].categoryId)) &&
      viewdata.ga[1].type === 'Таунхаус':
      return OBJECT_TYPES_ENUM('Дуплекс/Таунхаус');
    case Number(viewdata.ga[1].categoryId) === 23 &&
      viewdata.ga[1].type === 'Комната':
      return OBJECT_TYPES_ENUM('Комната');
    case Number(viewdata.ga[1].categoryId) === 23 &&
      viewdata.ga[1].tip_zhilya === 'Комната':
      return OBJECT_TYPES_ENUM('Комната');
    case Number(viewdata.ga[1].categoryId) === 23 &&
      viewdata.ga[1].tip_zhilya === 'Койко-место':
      return OBJECT_TYPES_ENUM('Койко-место');
    case Number(viewdata.ga[1].categoryId) === 25 &&
      viewdata.ga[1].type === 'Дача':
      return OBJECT_TYPES_ENUM('Дача');
    default:
      return OBJECT_TYPES_ENUM('1-к. квартира');
  }
};
