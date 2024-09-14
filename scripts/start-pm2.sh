#!/bin/bash

if [ -z "$1" ]; then
  echo "Please provide a name app"
  exit 1
fi

echo "[CRM-Parsers] Build $1 app"
npm run build $1

echo "[CRM-Parsers] Try delete crm-parser-$1 process"
pm2 delete crm-parser-$1 > /dev/null || echo "[CRM-Parsers] Not found crm-parser-$1 process"

echo "[CRM-Parsers] Try start crm-parser-$1 process"
pm2 start dist/apps/$1/main.js --name crm-parser-$1 > /dev/null

echo "[CRM-Parsers] Success start crm-parser-$1 process"