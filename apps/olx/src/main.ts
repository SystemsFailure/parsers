import { NestFactory } from '@nestjs/core';
import { IS_DEV } from '@app/flags';
import { createLogger } from '@app/logger';

import { OlxModule } from './olx.module';
import { ParserV1Service, ParserOptions } from './parser-v1';

import { CATEGORIES, OWNERS, REGIONS } from './constants';

async function bootstrap() {
  const logger = createLogger({
    env: IS_DEV ? 'dev' : 'prod',
    name: 'olx',
  });

  const app = await NestFactory.create(OlxModule, {
    logger,
  });
  const parserV1Service = app.get(ParserV1Service);

  const shortTasks: ParserOptions[] = [];
  const longTasks: ParserOptions[] = [];

  logger.log('Запуск задач');

  const shortWorkPages = 1;

  for (const region of Object.values(REGIONS)) {
    for (const category of Object.values(CATEGORIES)) {
      for (const owner of Object.values(OWNERS)) {
        shortTasks.push({
          region,
          category,
          owner,
          pages: shortWorkPages,
        });
        longTasks.push({
          region,
          category,
          owner,
          pages: 100,
          offset: shortWorkPages,
        });
      }
    }
  }

  parserV1Service.startJobParseAnnouncements({
    name: 'Olx запускаем парсинг всех объектов по 2 страницы',
    options: shortTasks,
  });
  parserV1Service.startJobParseAnnouncements({
    name: 'Olx запускаем парсинг всех объектов максимум страниц',
    options: longTasks,
  });
}
bootstrap();
