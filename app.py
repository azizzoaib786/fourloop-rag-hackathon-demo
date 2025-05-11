import json
import boto3
import requests
import time
import random
from botocore.exceptions import ClientError
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# === Configuration ===
REGION = "us-east-1"
S3_BUCKET = "gargash-hackathon"
OPENSEARCH_URL = "https://search-fourloop-domain-ued3jbfmgqbw3jnv6u2cfc4fk4.us-east-1.es.amazonaws.com"
OPENSEARCH_INDEX = "inventory"

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# === Step 1: Generate Embedding using Amazon Titan ===
def embed_text(text):
    client = boto3.client("bedrock-runtime", region_name=REGION)
    body = {"inputText": text}
    
    # Implement retry logic with exponential backoff
    max_retries = 5
    base_delay = 1  # Base delay in seconds
    
    for attempt in range(max_retries):
        try:
            response = client.invoke_model(
                modelId="amazon.titan-embed-text-v1",
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json"
            )
            return json.loads(response['body'].read())["embedding"]
        except ClientError as e:
            if "ThrottlingException" not in str(e) or attempt == max_retries - 1:
                raise
            # Calculate delay with exponential backoff and jitter
            delay = (base_delay * (2 ** attempt)) + random.uniform(0, 1)
            print(f"Throttling detected, retrying in {delay:.2f} seconds...")
            time.sleep(delay)

# === Step 2: Search OpenSearch using embedding ===
def search_opensearch(user_query):
    query_vec = embed_text(user_query)
    body = {
        "size": 3,
        "query": {
            "knn": {
                "embedding": {
                    "vector": query_vec,
                    "k": 3
                }
            }
        }
    }
    res = requests.post(
        f"{OPENSEARCH_URL}/{OPENSEARCH_INDEX}/_search",
        headers={"Content-Type": "application/json"},
        data=json.dumps(body)
    )
    data = res.json()
    if "hits" not in data:
        raise Exception(f"'hits' missing in response: {res.text}")
    return [hit["_source"] for hit in data["hits"]["hits"]]

# === Step 3: Build prompt for Claude ===
def build_prompt(user_query, matches):
    items = "\n".join([
        f"- {m['Model']} | {m['Exterior_Color']} | AED {m['Final_Price']} | {m['Showroom_Location']} | {m['Availability']} | Seats: {m['Seating_Capacity']} | Engine: {m['Engine']} | Fuel: {m['Fuel_Type']}"
        for m in matches
    ])
    return f"""
Customer asks: \"{user_query}\"

Based on the available inventory below, suggest best matches or alternatives. Include upsell or cross-sell if relevant.

Available inventory:
{items}
""".strip()

# === Step 4: Query Claude 3.5 Sonnet via Bedrock ===
def query_claude(prompt):
    client = boto3.client("bedrock-runtime", region_name=REGION)
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 500,
        "temperature": 0.7
    }
    
    # Implement retry logic with exponential backoff
    max_retries = 5
    base_delay = 1  # Base delay in seconds
    
    for attempt in range(max_retries):
        try:
            response = client.invoke_model(
                modelId="arn:aws:bedrock:us-east-1:863364345844:provisioned-model/ic9cem6y7m7r",
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json"
            )
            return json.loads(response['body'].read())["content"][0]["text"]
        except ClientError as e:
            if "ThrottlingException" not in str(e) or attempt == max_retries - 1:
                raise
            # Calculate delay with exponential backoff and jitter
            delay = (base_delay * (2 ** attempt)) + random.uniform(0, 1)
            print(f"Throttling detected, retrying in {delay:.2f} seconds...")
            time.sleep(delay)

# === API Endpoint ===
@app.post("/chat")
async def chat_handler(request: Request):
    try:
        body = await request.json()
        user_query = body.get("query", "")
        if not user_query:
            return JSONResponse(status_code=400, content={"error": "Missing 'query' in request."})

        print(f"🟢 Query received: {user_query}")

        top_matches = search_opensearch(user_query)
        # Remove embeddings
        cleaned_inventory = [{k: v for k, v in item.items() if k != "embedding"} for item in top_matches]

        prompt = build_prompt(user_query, cleaned_inventory)
        answer = query_claude(prompt)

        return {"response": answer, "matched_inventory": cleaned_inventory}

    except Exception as e:
        print("❌ Error:", str(e))
        return JSONResponse(status_code=500, content={"error": str(e)})

# === Run locally ===
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
