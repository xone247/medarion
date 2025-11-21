import json
import os
from typing import List

from tqdm import tqdm
from sentence_transformers import SentenceTransformer
import chromadb

CHUNKS_PATH = os.path.join("data", "chunks", "chunks.jsonl")
DB_DIR = os.path.join("data", "vectorstore", "chroma")
COLLECTION_NAME = "medarion"


def main() -> None:
    os.makedirs(DB_DIR, exist_ok=True)
    client = chromadb.PersistentClient(path=DB_DIR)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    coll = client.create_collection(COLLECTION_NAME, metadata={"hnsw:space": "cosine"})
    model = SentenceTransformer("intfloat/e5-small-v2")

    texts: List[str] = []
    ids: List[str] = []
    metadatas: List[dict] = []

    with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            texts.append("passage: " + rec["content"])
            ids.append(f'{rec["doc_id"]}:{rec["chunk_id"]}')
            meta = rec["metadata"]
            meta.update({"doc_id": rec["doc_id"], "chunk_id": rec["chunk_id"]})
            metadatas.append(meta)

    for i in tqdm(range(0, len(texts), 256)):
        batch_texts = texts[i : i + 256]
        embeddings = model.encode(batch_texts, batch_size=64, convert_to_numpy=True, show_progress_bar=False)
        coll.add(
            ids=ids[i : i + 256],
            embeddings=embeddings.tolist(),
            metadatas=metadatas[i : i + 256],
            documents=batch_texts,
        )

    print(f"Ingested {len(texts)} chunks into {DB_DIR}")


if __name__ == "__main__":
    main()


