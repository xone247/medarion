import json
import os
import hashlib
import glob
from datetime import datetime

RAW_DIR = os.path.join("data", "raw")
OUT_PATH = os.path.join("data", "normalized", "dataset.jsonl")


def generate_document_id(source_url: str, title: str, text: str) -> str:
    base = f"{source_url}|{title}|{len(text)}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()[:16]


def normalize_item(raw: dict) -> dict:
    source_url = raw.get("url") or raw.get("source_url") or ""
    title = raw.get("title") or ""
    text = raw.get("text") or raw.get("content") or ""
    created_at = raw.get("created_at") or datetime.utcnow().isoformat() + "Z"
    tags = raw.get("tags") or []
    company = raw.get("company") or raw.get("org") or None
    lang = raw.get("lang") or "en"

    return {
        "id": generate_document_id(source_url, title, text),
        "source_url": source_url,
        "title": title,
        "text": text,
        "created_at": created_at,
        "tags": tags,
        "company": company,
        "lang": lang,
    }


def main() -> None:
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as out:
        for path in glob.glob(os.path.join(RAW_DIR, "*.jsonl")):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    raw = json.loads(line)
                    norm = normalize_item(raw)
                    if norm["text"]:
                        out.write(json.dumps(norm, ensure_ascii=False) + "\n")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()


