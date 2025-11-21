import argparse
import json
import os
from typing import Iterable, Dict, List, Tuple


DEFAULT_INPUT = os.path.join("data", "normalized", "dataset.jsonl")
ALPACA_DIR = os.path.join("data", "sft", "alpaca")
CHAT_DIR = os.path.join("data", "sft", "chat_mistral")


def iter_normalized(path: str) -> Iterable[Dict]:
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            yield json.loads(line)


def simple_summary(text: str, max_chars: int = 1200) -> str:
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "…"


def make_samples(doc: Dict) -> List[Tuple[str, str, str]]:
    title = doc.get("title") or "Untitled document"
    content = doc.get("text") or ""
    if not content:
        return []
    summary = simple_summary(content)

    samples: List[Tuple[str, str, str]] = []

    # 1) Summarization-style
    samples.append((
        f"Summarize the following document: {title}",
        content,
        summary,
    ))

    # 2) Key facts extraction-style (heuristic: reuse summary)
    samples.append((
        f"Extract the key facts and bullet them for: {title}",
        content,
        "- " + "\n- ".join(summary.split(". ")[:6]).strip("- "),
    ))

    # 3) Short description
    samples.append((
        f"In one short paragraph, describe what this document is about: {title}",
        content,
        summary.split(". ")[0] + ".",
    ))

    return samples


def ensure_dirs() -> None:
    os.makedirs(ALPACA_DIR, exist_ok=True)
    os.makedirs(CHAT_DIR, exist_ok=True)


def shard_writer(base_dir: str, prefix: str, shard_size_mb: int):
    bytes_limit = shard_size_mb * 1024 * 1024
    idx = 0
    current_bytes = 0
    f = open(os.path.join(base_dir, f"{prefix}_part_{idx:03d}.jsonl"), "w", encoding="utf-8")

    def write(record_str: str):
        nonlocal f, idx, current_bytes
        size = len(record_str.encode("utf-8")) + 1
        if current_bytes + size > bytes_limit:
            f.close()
            idx += 1
            current_bytes = 0
            f = open(os.path.join(base_dir, f"{prefix}_part_{idx:03d}.jsonl"), "w", encoding="utf-8")
        f.write(record_str + "\n")
        current_bytes += size

    def close():
        f.close()

    return write, close


def build_datasets(input_path: str, shard_size_mb: int) -> None:
    ensure_dirs()
    write_alpaca, close_alpaca = shard_writer(ALPACA_DIR, "sft", shard_size_mb)
    write_chat, close_chat = shard_writer(CHAT_DIR, "sft", shard_size_mb)

    count = 0
    for doc in iter_normalized(input_path):
        for instr, inp, out in make_samples(doc):
            alpaca_obj = {"instruction": instr, "input": inp, "output": out}
            write_alpaca(json.dumps(alpaca_obj, ensure_ascii=False))

            chat_text = f"<s>[INST] {instr}\n{inp} [/INST]\n{out}</s>"
            chat_obj = {"text": chat_text}
            write_chat(json.dumps(chat_obj, ensure_ascii=False))
            count += 1

    close_alpaca()
    close_chat()
    print(f"Wrote {count} samples across chat + alpaca shards.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build SFT dataset shards from normalized docs.")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Path to normalized dataset.jsonl")
    parser.add_argument("--shard_size_mb", type=int, default=2000, help="Max size per shard in MB")
    args = parser.parse_args()

    build_datasets(args.input, args.shard_size_mb)


if __name__ == "__main__":
    main()


