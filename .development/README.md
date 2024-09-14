# Инициализация зависимостей

```bash
npm i
npx playwright install-deps
npx playwright install
```

# Как поднять в тестовом режиме с моками

1. (Необязательно) Заполни `.env.local` как указано в файле `.development/.env.local`

2. Запусти

```shell
npm run start:dev:mock avito
# or
npm run start:dev:mock cian
# or
npm run start:dev:mock olx
# or
npm run start:dev:mock domria
# or
npm run start:dev:mock youla
```

_Так же можно запустить в `debug` режиме используя `.vscode` конфиг_

3. Наблюдай результаты парсинга в папке `.testclient/rent-object-mock/*`
