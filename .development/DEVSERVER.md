# Как запустить контейнер на дев-сервере `5.35.84.101`

## Укажи правильные `env` параметры в `.env` файл

```shell
# НЕ УКАЗЫВАЙ СТРОКИ В "" ЭТО НЕ БУДЕТ РАБОТАТЬ (BAD="НЕТ!!!")
# Очередь для публикации объектов `RentObject`
# crm-rabbitmq - это имя контейнера в общей сети
RMQ_URL=amqp://randomuser:jf39fh28hf237534f3f4h46@crm-rabbitmq:5672/

# Токен и хост для `RPC` вызовов к бэку `api`
CRM_RPC_TOKEN=19a742df-41a2-41a2-acf5-3761a2ee1805
CRM_RPC_HOST=https://api.ao-dev.ru/api/rpc

# Подключение к S3
S3_KEY=ef3835ac63494271aa33fa9eb28ebf28
S3_SECRET=00515996d77649d0ba6311006397e129
S3_BUCKET=develop
S3_REGION=ru-1
S3_ENDPOINT=https://s3.storage.selcloud.ru
```

## Запускай из корня репы парсеров

```bash
# 1 (сейчас уже не обязательно)
chmod +x ./docker-entrypoint.sh

# 2 (собираем)
docker build --build-arg DEFAULT_APP=avito -t crm-parsers .

# 3 (поднимаем)
docker run \
  -e APP=youla \
  --name crm-parser-youla \
  --env-file .env \
  -v crm-parser-youla-logs:/app/logs \
  # сеть где лежит кроллик и другие контейнеры
  --network=api_default \
  -d \
  crm-parsers
```

## TEMP

```bash
docker build --build-arg DEFAULT_APP=avito -t crm-parsers .
docker run \
  -e APP=domria \
  --name crm-parser-domria \
  --env-file .env \
  -v ./logs:/app/logs \
  --network=api_default \
  -d \
  crm-parsers

npm run start domria
```