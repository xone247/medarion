import json
import os

IN_PATH = os.path.join("data", "normalized", "dataset.jsonl")
OUT_PATH = os.path.join("data", "chunks", "chunks.jsonl")
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def chunk_text(text: str, size: int, overlap: int):
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append((start, text[start:end]))
        if end == len(text):
            break
        start = max(0, end - overlap)
    return chunks


def main() -> None:
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(IN_PATH, "r", encoding="utf-8") as f_in, open(OUT_PATH, "w", encoding="utf-8") as f_out:
        for line in f_in:
            doc = json.loads(line)
            pieces = chunk_text(doc["text"], CHUNK_SIZE, CHUNK_OVERLAP)
            for idx, (offset, content) in enumerate(pieces):
                rec = {
                    "doc_id": doc["id"],
                    "chunk_id": idx,
                    "content": content,
                    "offset_char": offset,
                    "metadata": {
                        "source_url": doc["source_url"],
                        "title": doc["title"],
                        "company": doc.get("company"),
                        "lang": doc.get("lang", "en"),
                        "tags": doc.get("tags", []),
                    },
                }
                f_out.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()


