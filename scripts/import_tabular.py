import argparse
import os
import json
import pandas as pd
from datetime import datetime

RAW_DIR = os.path.join("data", "raw")


def write_jsonl(records, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def row_to_raw(row: dict) -> dict:
    # Map common columns; fallbacks to blank
    url = row.get("url") or row.get("source_url") or ""
    title = row.get("title") or row.get("name") or ""
    text = row.get("text") or row.get("content") or row.get("description") or ""
    created_at = row.get("created_at") or datetime.utcnow().isoformat() + "Z"
    company = row.get("company") or row.get("org") or None
    tags = row.get("tags") or []
    return {
        "source_url": url,
        "title": str(title) if title is not None else "",
        "text": str(text) if text is not None else "",
        "created_at": str(created_at),
        "company": company,
        "tags": tags,
    }


def import_file(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    df = None
    if ext in [".xlsx", ".xls"]:
        df = pd.read_excel(path)
    elif ext in [".csv", ".tsv"]:
        sep = "," if ext == ".csv" else "\t"
        df = pd.read_csv(path, sep=sep)
    else:
        raise ValueError(f"Unsupported tabular format: {ext}")

    records = [row_to_raw({k: (None if pd.isna(v) else v) for k, v in row.items()}) for row in df.to_dict(orient="records")]
    out_path = os.path.join(RAW_DIR, os.path.basename(path) + ".jsonl")
    write_jsonl(records, out_path)
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Import Excel/CSV into data/raw as JSONL")
    parser.add_argument("paths", nargs="+", help="One or more .xlsx/.xls/.csv/.tsv files")
    args = parser.parse_args()
    outputs = []
    for p in args.paths:
        outputs.append(import_file(p))
    print("Wrote:")
    for o in outputs:
        print(" -", o)


if __name__ == "__main__":
    main()


