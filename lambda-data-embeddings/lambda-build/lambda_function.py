import boto3
import pandas as pd
import json
import hashlib
import requests
from io import StringIO

REGION = "us-east-1"
S3_BUCKET = "gargash-hackathon"
S3_KEY = "inventory.csv"
OPENSEARCH_URL = "https://search-fourloop-domain-ued3jbfmgqbw3jnv6u2cfc4fk4.us-east-1.es.amazonaws.com"
OPENSEARCH_INDEX = "inventory"

def embed_text(text):
    client = boto3.client("bedrock-runtime", region_name=REGION)
    body = {"inputText": text}
    response = client.invoke_model(
        modelId="amazon.titan-embed-text-v1",
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json"
    )
    return json.loads(response["body"].read())["embedding"]

def read_inventory_from_s3():
    s3 = boto3.client("s3")
    response = s3.get_object(Bucket=S3_BUCKET, Key=S3_KEY)
    return pd.read_csv(StringIO(response["Body"].read().decode("utf-8")))

def document_exists(vin):
    url = f"{OPENSEARCH_URL}/{OPENSEARCH_INDEX}/_doc/{vin}"
    res = requests.get(url)
    return res.status_code == 200, res.json().get("_source", {})

def calculate_checksum(record):
    text = json.dumps(record, sort_keys=True)
    return hashlib.md5(text.encode()).hexdigest()

def lambda_handler(event=None, context=None):
    df = read_inventory_from_s3()
    headers = {"Content-Type": "application/json"}

    for _, row in df.iterrows():
        vin = row["VIN"]
        record = row.fillna("").to_dict()

        # Check if document exists and is identical
        exists, existing_doc = document_exists(vin)
        new_checksum = calculate_checksum(record)
        old_checksum = calculate_checksum(existing_doc) if exists else None

        if exists and new_checksum == old_checksum:
            print(f"✅ Skipping unchanged record: {vin}")
            continue

        print(f"🔁 Updating: {vin}")

        # Generate embedding
        description = (
            f"Model: {row['Model']}, Color: {row['Exterior_Color']}, "
            f"Location: {row['Showroom_Location']}, Price: AED {row['Final_Price']}, "
            f"Fuel: {row['Fuel_Type']}, Seats: {row['Seating_Capacity']}"
        )
        record["embedding"] = embed_text(description)

        # Upsert document
        url = f"{OPENSEARCH_URL}/{OPENSEARCH_INDEX}/_doc/{vin}"
        res = requests.put(url, headers=headers, data=json.dumps(record))
        print(f"{res.status_code} Updated VIN: {vin}")

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Indexing completed."})
    }
