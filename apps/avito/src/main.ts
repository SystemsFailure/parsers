import { NestFactory } from '@nestjs/core';
import { IS_DEV } from '@app/flags';
import { createLogger } from '@app/logger';

import { AvitoModule } from './avito.module';
import { ParserV1Service, ParserOptions } from './parser-v1';

import { AVITO_CATEGORIES, AVITO_CITIES } from './constants';

async function bootstrap() {
  const logger = createLogger({
    env: IS_DEV ? 'dev' : 'prod',
    name: 'avito',
  });

  const app = await NestFactory.create(AvitoModule, {
    logger,
  });
  const parserV1Service = app.get(ParserV1Service);

  const shortTasks: ParserOptions[] = [];
  const longTasks: ParserOptions[] = [];

  logger.log('Автоматический запуск задач Avito');

  const shortWorkPages = 1;

  for (const city of Object.values(AVITO_CITIES)) {
    for (const category of Object.values(AVITO_CATEGORIES)) {
      shortTasks.push({
        city,
        category,
        pages: shortWorkPages,
      });
      longTasks.push({
        city,
        category,
        offset: shortWorkPages,
      });
    }
  }

  parserV1Service.startJobParseAnnouncements({
    name: 'Avito запускаем парсинг всех объектов по 1 страницы',
    options: shortTasks,
  });
  parserV1Service.startJobParseAnnouncements({
    name: 'Avito запускаем парсинг всех объектов максимум страниц',
    options: longTasks,
  });
}

bootstrap();
