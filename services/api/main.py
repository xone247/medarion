from fastapi import FastAPI
from pydantic import BaseModel
import chromadb
from sentence_transformers import SentenceTransformer
import os
import requests

DB_DIR = os.path.join("data", "vectorstore", "chroma")
COLLECTION_NAME = "medarion"
MISTRAL_BASE = os.getenv("MISTRAL_BASE", "http://localhost:11434/v1")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral")

app = FastAPI()
client = chromadb.PersistentClient(path=DB_DIR)
coll = client.get_collection(COLLECTION_NAME)
embed_model = SentenceTransformer("intfloat/e5-small-v2")


class SearchReq(BaseModel):
    query: str
    k: int = 5


class ChatReq(BaseModel):
    query: str
    k: int = 4
    system: str | None = None


@app.post("/search")
def search(req: SearchReq):
    q_emb = embed_model.encode([f"query: {req.query}"], convert_to_numpy=True)
    res = coll.query(query_embeddings=q_emb.tolist(), n_results=req.k, include=["metadatas", "documents"])
    return res


@app.post("/chat")
def chat(req: ChatReq):
    q_emb = embed_model.encode([f"query: {req.query}"], convert_to_numpy=True)
    res = coll.query(query_embeddings=q_emb.tolist(), n_results=req.k, include=["metadatas", "documents"])
    contexts = [doc.replace("passage: ", "") for doc in res["documents"][0]]
    context_block = "\n\n".join([f"- {c}" for c in contexts])

    sys_prompt = req.system or "You are a helpful assistant that answers based on context."
    user_prompt = f"Use the context to answer.\n\nContext:\n{context_block}\n\nQuestion: {req.query}"

    payload = {
        "model": MISTRAL_MODEL,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 512,
    }
    r = requests.post(f"{MISTRAL_BASE}/chat/completions", json=payload, timeout=120)
    r.raise_for_status()
    out = r.json()
    answer = out["choices"][0]["message"]["content"]
    return {"answer": answer, "contexts": contexts}


