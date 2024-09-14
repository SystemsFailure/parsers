# CRM-Parsers

Парсера объявлений для `avito`, `cian`, `domria`, `olx`, `youla`

# Описание `environments`

### `RMQ_URL`

Очередь куда будут складироваться `RentObject` объекты

### `CRM_RPC_HOST` и `CRM_RPC_TOKEN`

Хост `api` и `token` для доступа к `rpc` запросам:

1. Получение информации о том существует ли `RentObject` или нет
2. Получение случайного `proxy` для заданного региона

# Запуск в `prod` режиме в докере

Образ представляет из себя монолит всех парсеров, с помощью которого можно запускать контейнеры конкректных парсеров, для этого нужно передать переменную окружения `APP`
Параметр `APP` принимает одно из следующих значений:

- `avito`, `cian`, `domria`, `olx`, `youla`

### 1. Сборка контейнера

- При сборке образа можно указать парсер по умолчанию с помощью аргумента `DEFAULT_APP`, это позволяет не указывать параметр `APP`, но мы всегда можем его указать и запустить тот парсер который хотим

```bash
chmod +x ./docker-entrypoint.sh
docker build --build-arg DEFAULT_APP=avito -t crm-parsers .
```

### 2. Запуск парсеров

```bash
docker run \
  --name crm-parser-avito \
  -e RMQ_URL=amqp://randomuser:jf39fh28hf237534f3f4h46@185.201.28.102:5672/ \
  -e CRM_RPC_HOST=http://185.201.28.102:3333/api/rpc \
  -e CRM_RPC_TOKEN=19a742df-41a2-41a2-acf5-3761a2ee1805 \
  -e S3_KEY=ef3835ac63494271aa33fa9eb28ebf28 \
  -e S3_SECRET=00515996d77649d0ba6311006397e129 \
  -e S3_BUCKET=develop \
  -e S3_REGION=ru-1 \
  -e S3_ENDPOINT=https://s3.storage.selcloud.ru \
  -v crm-parser-avito-logs:/app/logs \
  -d \
  crm-parsers

docker run \
  -e APP=cian \
  --name crm-parser-cian \
  # A. Передача env параметров как выше или из файла
  # -e ... \
  # ... \
  # B. или передача .env файла
  # --env-file .env \
  -v crm-parser-cian-logs:/app/logs \
  -d \
  crm-parsers

```

### Дополнительно

Можно так же глянуть на пример запуска парсеров из `docker-compose` в файле `docker/example-prod-docker-compose.yaml`

```bash
docker compose -f ./docker/example-prod-docker-compose.yaml up -d
```

# Общий обзор структуры проекты

## `.development`

Предоставляет ресурсы и информацию о локальной сборке и запуске парсеров

## `.testclient`

1. Предоставляет клиент который читает записи из `rabbitmq` и кладёт их в папку `.testclient/rent-object-rmq`
2. Используется для складирования ошибок/объектов парсинга в тестовом режиме

## `.testdata`

Хранит информацию необходимую для запуска тестов

## `@constants`

Константы используемые между всеми парсерами (`apps`) и либами (`libs`)

## `@types`

Типы используемые между всеми парсерами (`apps`) и либами (`libs`)

## `@utils`

Утилиты используемые между всеми парсерами (`apps`) и либами (`libs`)

## `apps`

Пока что только приложения парсеров, соответственно по имени каждого парсера можно понять к чему он относиться

## `libs`

Общий код используемый между парсерами (но такой, который нельзя отнести к утилитам), `nest` модули поставляемые этой папкой вполне могут быть завязаны на `env` переменные

#### `libs/flags`

Модуль используемый для поставки флагов времени разработки:

1. `IS_DEV` - приложение запущенно в тестовом режиме
2. И флаги моков, чтобы подменять реализации с продовского кода на код для локальной разработки

#### `libs/job-runner`

Поставляет общую функцию используемую для запуска парсеров (логирования, перезапуск и обработку ошибок)

#### `libs/playwright`

Обёртка над `playwright`, знает о жизненом цикле `nestjs` и убивает браузер, когда приложение закрывается

#### `libs/geocord`

Используется для получения адреса в виде `JSON` объекта на основании координат (`lat` / `lon`)

_Для улучшения точности, если это возможно, иначе используется старый механизм_

#### `libs/proxy-servers`

Используется для получение случайных прокси, с возможностью указать регион этого прокси

_Через `RPC` вызов к `api` бэкенду в прод. режиме_
_Имеет моки_

#### `libs/rent-object`

Используется для публикации в очередь распаршенных объектов

_В `rabbitmq` в прод. режиме`_
_Имеет моки_

#### `libs/rent-object-checker`

Используется для проверки существует ли, тот или иной объект `RentObject`, что не публиковать их в очередь

_Через `RPC` вызов к `api` бэкенду в прод. режиме_
_Имеет моки_

#### `libs/rent-object-photos`

Используется для загрузки фотографий на S3

_Имеет прямой доступ к S3_
_Имеет моки_

## `docker`

В данный момент только пример для сборки в прод режиме через докер

# Код парсеров

Код всех парсеров написан в одном стиле, поэтому достаточно разобраться со струтурой `avito` или `youla`, остальные будут понятны

В любом случаи все парсеры оперируют одними понятиями (именами функций)

### `startJobParseAnnouncements` и `jobParseAnnouncements`

Являются точками старта парсера

1. `jobParseAnnouncements` представляет из себя полноценный алгоритм парсинга
2. `startJobParseAnnouncements` представляет из себя функцию запуска цикличного выполнения `jobParseAnnouncements` с логированием и отловом ошибок

### `groupedAnnouncements`

Во всех парсерах эта функция фильтрует существующие объекты `RentObject`

### `buildRentObjectData`

Строит объект `RentObject` на основе данных выгружаеммых во время работы `jobParseAnnouncements`. Обычно эта функция синхронна (и изначально предполагалась такой)

### `Extractors`

Это наборы функций, который берут объекты представлений (объекты выгружаемые с сервисов) и вытаскивают из них поля для объекта `RentObject`, во всех парсерах эти функции имеют одинаковые названия и возвращают плюс минус одинаковые поля (всё же есть особенности для отдельных парсеров)
