import argparse
import os
import json
import time
from typing import Iterable, Dict, List, Optional


def find_first(d: Dict, keys: List[str]) -> Optional[str]:
    for k in keys:
        if k in d and d[k]:
            v = d[k]
            if isinstance(v, (str, int, float)):
                return str(v)
    return None


def extract_text_candidate(d: Dict) -> Optional[str]:
    candidates = [
        "text",
        "content",
        "body",
        "article",
        "clean_text",
        "description",
        "summary",
    ]
    for k in candidates:
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return v
    return None


def map_dict_to_raw(d: Dict, fallback_title: str = "", fallback_url: str = "") -> Optional[Dict]:
    text = extract_text_candidate(d)
    if not text:
        return None

    title = find_first(
        d,
        ["title", "headline", "name", "page_title"],
    ) or fallback_title

    url = find_first(
        d,
        ["url", "source_url", "link", "canonical_url"],
    ) or fallback_url

    created_at = find_first(
        d,
        ["created_at", "published_at", "date", "time"],
    )

    company = find_first(
        d,
        ["company", "org", "organization"],
    )

    tags_val = d.get("tags") or d.get("keywords") or d.get("categories") or []
    if isinstance(tags_val, str):
        tags = [tags_val]
    elif isinstance(tags_val, list):
        tags = [str(x) for x in tags_val]
    else:
        tags = []

    return {
        "source_url": url or "",
        "title": title or "",
        "text": text or "",
        "created_at": created_at or "",
        "company": company,
        "tags": tags,
    }


def iter_files(root: str, exts: List[str]) -> Iterable[str]:
    exts_lower = set(e.lower() for e in exts)
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            ext = os.path.splitext(fn)[1].lower()
            if ext in exts_lower:
                yield os.path.join(dirpath, fn)


def import_json_file(path: str) -> List[Dict]:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        try:
            data = json.load(f)
        except Exception:
            # try json lines
            f.seek(0)
            lines = []
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    lines.append(json.loads(line))
                except Exception:
                    continue
            data = lines

    records: List[Dict] = []
    if isinstance(data, dict):
        mapped = map_dict_to_raw(data, fallback_title=os.path.basename(path))
        if mapped:
            records.append(mapped)
    elif isinstance(data, list):
        for item in data:
            if not isinstance(item, dict):
                continue
            mapped = map_dict_to_raw(item, fallback_title=os.path.basename(path))
            if mapped:
                records.append(mapped)
    return records


def import_text_file(path: str) -> List[Dict]:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception:
        return []
    base = os.path.basename(path)
    title = os.path.splitext(base)[0]
    return [{
        "source_url": "",
        "title": title,
        "text": content,
        "created_at": "",
        "company": None,
        "tags": [],
    }]


def import_html_file(path: str) -> List[Dict]:
    try:
        from bs4 import BeautifulSoup  # type: ignore
    except Exception:
        return []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()
    except Exception:
        return []
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ")
    title = soup.title.string if soup.title and soup.title.string else os.path.basename(path)
    return [{
        "source_url": "",
        "title": title,
        "text": text,
        "created_at": "",
        "company": None,
        "tags": [],
    }]


def import_pdf_file(path: str) -> List[Dict]:
    try:
        from pypdf import PdfReader  # type: ignore
    except Exception:
        return []
    try:
        reader = PdfReader(path)
        parts = []
        for page in reader.pages:
            try:
                parts.append(page.extract_text() or "")
            except Exception:
                continue
        text = "\n".join(parts)
    except Exception:
        return []
    base = os.path.basename(path)
    title = os.path.splitext(base)[0]
    return [{
        "source_url": "",
        "title": title,
        "text": text,
        "created_at": "",
        "company": None,
        "tags": [],
    }]


def main():
    parser = argparse.ArgumentParser(description="Import scraper outputs into data/raw JSONL")
    parser.add_argument("--root", default=os.path.join("services", "scraper", "output"))
    parser.add_argument("--exts", nargs="+", default=[".json"], help="Extensions to include, e.g. .json .txt .html .pdf")
    parser.add_argument("--limit", type=int, default=0, help="Max number of files to process (0 = no limit)")
    args = parser.parse_args()

    ts = time.strftime("%Y%m%d_%H%M%S")
    out_path = os.path.join("data", "raw", f"imported_{ts}.jsonl")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    processed = 0
    written = 0
    with open(out_path, "w", encoding="utf-8") as out:
        for path in iter_files(args.root, args.exts):
            if args.limit and processed >= args.limit:
                break
            processed += 1
            ext = os.path.splitext(path)[1].lower()
            try:
                if ext == ".json":
                    recs = import_json_file(path)
                elif ext == ".txt":
                    recs = import_text_file(path)
                elif ext == ".html":
                    recs = import_html_file(path)
                elif ext == ".pdf":
                    recs = import_pdf_file(path)
                else:
                    recs = []
            except Exception:
                recs = []

            for r in recs:
                if r.get("text"):
                    out.write(json.dumps(r, ensure_ascii=False) + "\n")
                    written += 1

    print(f"Processed files: {processed}")
    print(f"Wrote raw records: {written}")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()


