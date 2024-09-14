export const sleep = (sec: number): Promise<void> =>
  new Promise((res) => setTimeout(() => res(undefined), sec * 1000));
