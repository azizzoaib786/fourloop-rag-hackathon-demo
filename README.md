# 🚗 Fourloop RAG Hackathon Demo

This repository demonstrates a Retrieval-Augmented Generation (RAG) based chatbot system built for Gargash Group’s automobile sales use case. It combines OpenSearch (as vector DB), Amazon Bedrock (for embeddings and Claude), and AWS Lambda (for backend logic), with a JavaScript frontend.

---

## 💡 Features

* Upload inventory data to S3
* Auto-sync inventory to OpenSearch with Titan embeddings
* Query vehicle inventory using natural language
* Generate responses using Claude 3.5 Sonnet via Bedrock
* Backend hosted on Lambda, optional Streamlit local backend
* Frontend built in JavaScript (separate folder frontend/)

---

## 📁 Folder Structure

```
fourloop-rag-hackathon-demo/
├── frontend
│   └── server.js # Frontend
│   └── app.js
├── lambda-data-embeddings/
│   └── lambda_function.py   # Lambda to index/update data from S3 to OpenSearch
├── fourloop-lambda-rag-backend/
│   ├── lambda_function.py   # Lambda that acts as the chatbot backend
│   └── requirements.txt
└── streamlit-local-backend/
    └── app.py               # (Optional) Local backend with Streamlit + FastAPI
```

---

## 🚀 Deployment Steps

### 🔹 Lambda Setup (Data Embedding)

1. Zip the contents of `lambda-data-embeddings/`
2. Create a new Lambda function
3. Upload the zip
4. Assign IAM Role with access to:

   * S3 (read access)
   * OpenSearch (es:\* for domain or limited actions)
   * Bedrock (`bedrock:InvokeModel`)
5. (Optional) Attach layer if using `pandas`

### 🔹 Lambda Setup (Backend API)

1. Zip the contents of `fourloop-lambda-rag-backend/`
2. Create a new Lambda function
3. Add `requirements.txt` dependencies via Lambda Layer or custom runtime
4. Set up API Gateway to expose HTTP POST endpoint
5. Payload format:

   ```json
   {
     "query": "Do you have a black GLC 300 under AED 220,000?"
   }
   ```

### 🔹 Local Backend (Dev / Debug)

```bash
cd streamlit-local-backend
uvicorn app:app --host 0.0.0.0 --port 8000
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Do you have a red GLC under 220,000 AED?"}'
```

---

## ⚙️ Requirements

* Python 3.9+
* `boto3`, `pandas`, `requests`, `fastapi`, `uvicorn` (for local)
* Amazon Bedrock enabled in AWS account
* OpenSearch domain with KNN vector plugin enabled

---

## 🧠 Technologies Used

* **Amazon Bedrock** (Titan + Claude 3.5 Sonnet)
* **Amazon OpenSearch** (KNN vector index)
* **AWS Lambda** (serverless backend)
* **S3** (inventory source)
* **FastAPIt** (local backend option)
* **JavaScript** (frontend)

---

## 🏑 Example Response

```json
{
  "response": "Thank you for your inquiry...",
  "matched_inventory": [
    {
      "VIN": "123ABC...",
      "Model": "GLC 300",
      ...
    }
  ]
}
```

---

## 📬 Feedback or Contributions?

Open issues or pull requests via [GitHub](https://github.com/azizzoaib786/fourloop-rag-hackathon-demo).