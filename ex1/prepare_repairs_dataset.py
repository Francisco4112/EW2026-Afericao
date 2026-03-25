#!/usr/bin/env python3
import argparse
import json
from pathlib import Path


def normalize_dataset(payload):
    if isinstance(payload, dict):
        repairs = payload.get("reparacoes")
        if repairs is None:
            raise ValueError("O JSON tem de ser um array ou um objeto com a chave 'reparacoes'.")
    elif isinstance(payload, list):
        repairs = payload
    else:
        raise ValueError("Formato JSON invalido.")

    if not isinstance(repairs, list):
        raise ValueError("O conteudo de 'reparacoes' tem de ser um array.")

    normalized = []

    for repair in repairs:
        if not isinstance(repair, dict):
            raise ValueError("Cada documento de reparacao tem de ser um objeto JSON.")

        document = dict(repair)
        document.pop("_id", None)
        normalized.append(document)

    return normalized


def main():
    parser = argparse.ArgumentParser(
        description="Prepara o dataset de reparacoes para mongoimport."
    )
    parser.add_argument(
        "-i",
        "--input",
        default="dataset_reparacoes.json",
        help="Ficheiro JSON de origem.",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="dataset_reparacoes_mongo.json",
        help="Ficheiro JSON de destino, em formato array puro.",
    )
    parser.add_argument(
        "--overwrite-input",
        action="store_true",
        help="Substitui o ficheiro de origem pelo formato normalizado.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = input_path if args.overwrite_input else Path(args.output)

    with input_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    normalized = normalize_dataset(payload)

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(normalized, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    print(f"Escritos {len(normalized)} documentos em {output_path}.")
    print()
    print("Importacao com Docker:")
    print(f"sudo docker cp {output_path.name} mongoEW:/tmp/{output_path.name}")
    print(
        "sudo docker exec -it mongoEW mongoimport "
        f"-d autoRepair -c repairs --file /tmp/{output_path.name} --jsonArray --drop"
    )


if __name__ == "__main__":
    main()
