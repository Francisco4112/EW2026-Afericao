#!/bin/bash

if [ -z "$1" ]; then
  echo "Uso: ./run_query.sh q1.js"
  exit 1
fi

sudo docker cp "queries/$1" mongoEW:/tmp/"$1"
sudo docker exec -it mongoEW mongosh /tmp/"$1"
