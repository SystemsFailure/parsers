import { NestFactory } from '@nestjs/core';
import { createLogger } from '@app/logger';

import { IS_DEV } from '@app/flags';

import { YoulaModule } from './youla.module';
import { ParserV1Service, ParserOptions } from './parser-v1';

import { CATEGORIES, CITIES } from './constants';

async function bootstrap() {
  const logger = createLogger({
    env: IS_DEV ? 'dev' : 'prod',
    name: 'youla',
  });

  const app = await NestFactory.create(YoulaModule, {
    logger,
  });
  const parserV1Service = app.get(ParserV1Service);

  const shortTasks: ParserOptions[] = [];
  const longTasks: ParserOptions[] = [];

  logger.log('Автоматический запуск задач Youla');

  const shortWorkPages = 2;

  for (const city of Object.values(CITIES)) {
    for (const category of Object.values(CATEGORIES)) {
      shortTasks.push({
        city,
        category,
        pages: shortWorkPages,
      });
      longTasks.push({
        city,
        category,
        pages: 100,
        offset: shortWorkPages,
      });
    }
  }

  parserV1Service.startJobParseAnnouncements({
    name: 'Youla запускаем парсинг всех объектов по 1 страницы',
    options: shortTasks,
  });
  parserV1Service.startJobParseAnnouncements({
    name: 'Youla запускаем парсинг всех объектов максимум страниц',
    options: longTasks,
  });
}

bootstrap();
