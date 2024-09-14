#!/bin/bash

while getopts ":c" opt; do
  case $opt in
    c)
      rm -r logs
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

arguments=("avito" "cian" "domria" "olx" "youla")

for arg in "${arguments[@]}"; do
  ./scripts/start-pm2.sh "$arg" &
done
wait

pm2 list