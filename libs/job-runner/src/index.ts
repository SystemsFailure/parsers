import * as uuid from 'uuid';
import { Logger } from '@nestjs/common';
import { sleep } from '@utils';

/// TODO: заменить но модуль nestjs, для общей структуры проекта

/**
 * Функция для запуска задачи в бесконечном цикле
 * @param props - аргументы
 * @param props.options - наборы опций для запуска задачи на каждом из них
 * @param props.logger - экземпляр логгера
 * @param props.job - функция задачи
 * @param [props.hotnessms] - период времени в миллисекундах для паузы, если задача выполняется слишком быстро (вероятно она зависла)
 * @param  [props.logcontext] - контекст логов
 */
export const jobRunner = <T>(props: {
  options: T[];
  logger: Logger;
  job: (options: T) => Promise<void | { isNeedStop: boolean }>;
  end?: () => Promise<void>;
  hotnessms?: number;
  logcontext?: string;
}) => {
  const { logger, logcontext } = props;
  const hotnessms = props.hotnessms ?? 2500;

  setImmediate(async () => {
    logger.log(`Запуск задачи`, logcontext);

    let firstTime = 0;
    let secondTime = Date.now();
    let hotnessTryed = 0;

    while (true) {
      secondTime = Date.now();
      const dt = secondTime - firstTime;
      firstTime = secondTime;

      if (dt < hotnessms) {
        hotnessTryed += 1;
        if (hotnessTryed > 3) {
          hotnessTryed = 0;

          await sleep(15);
          logger.warn(
            `Задача вызывается слишком часто, пауза на 15 сек`,
            logcontext,
          );
        }
      } else {
        hotnessTryed = 0;
      }

      logger.log(`Запуск итерации задачи`, logcontext);

      for (const option of props.options) {
        try {
          logger.log(`Запуск итерации задачи парсера`, logcontext);
          logger.debug(option, logcontext);

          const jobPromise = props.job(option);
          await Promise.all([jobPromise, sleep(1)]);

          const maybeStopResult = await jobPromise;

          if (maybeStopResult && maybeStopResult.isNeedStop) {
            logger.log(`Остановка задачи`, logcontext);
            await props.end?.();
            return;
          }
        } catch (error) {
          const lid = uuid.v1();
          logger.error(
            'Ошибка во время выполнения задачи, пропускаем: ' + error?.message,
            lid,
          );
          logger.debug(error, lid);
        }
      }
    }
  });
};
