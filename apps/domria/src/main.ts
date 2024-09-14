import { NestFactory } from '@nestjs/core';
import { IS_DEV } from '@app/flags';
import { createLogger } from '@app/logger';

import { DomriaModule } from './domria.module';
import { ParserOptions, ParserV1Service } from './parser-v1';

import { CATEGORIES, REGIONS } from './constants';

async function bootstrap() {
  const logger = createLogger({
    env: IS_DEV ? 'dev' : 'prod',
    name: 'domria',
  });
  const app = await NestFactory.create(DomriaModule, {
    logger,
  });

  const parserV1Service = app.get(ParserV1Service);

  const shortTasks: ParserOptions[] = [];
  const longTasks: ParserOptions[] = [];

  logger.log('Запуск задач');

  const shortWorkPages = 2;

  for (const region of Object.values(REGIONS)) {
    for (const category of Object.values(CATEGORIES)) {
      shortTasks.push({
        region,
        category,
        pages: shortWorkPages,
      });
      longTasks.push({
        region,
        category,
        pages: 100,
        offset: shortWorkPages,
      });
    }
  }

  parserV1Service.startJobParseAnnouncements({
    name: 'Domria запускаем парсинг всех объектов по 2 страницы',
    options: shortTasks,
  });
  parserV1Service.startJobParseAnnouncements({
    name: 'Domria запускаем парсинг всех объектов максимум страниц',
    options: longTasks,
  });
}
bootstrap();
