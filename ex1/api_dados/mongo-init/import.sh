#!/bin/bash
# Importa o JSON para a base de dados autoRepair, coleção repairs
mongoimport --host localhost --db autoRepair --collection repairs --type json --file /docker-entrypoint-initdb.d/dataset_reparacoes_mongo.json --jsonArray
