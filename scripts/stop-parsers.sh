#!/bin/bash

arguments=("avito" "cian" "domria" "olx" "youla")

for arg in "${arguments[@]}"; do
  pm2 delete crm-parser-$arg > /dev/null || true &
done
wait
