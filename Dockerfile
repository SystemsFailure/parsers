FROM node:20.10.0

WORKDIR /app

RUN npx playwright install-deps
RUN npx playwright install

COPY package*.json ./

RUN npm install

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

COPY . .

RUN npm run build avito
RUN npm run build cian
RUN npm run build domria
RUN npm run build olx
RUN npm run build youla

ARG DEFAULT_APP=none
ENV APP=${DEFAULT_APP}

CMD ["/app/docker-entrypoint.sh"]