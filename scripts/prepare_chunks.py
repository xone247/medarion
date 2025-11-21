import os
import argparse
import json
from pathlib import Path


def split_text(text: str, chunk_tokens: int = 800, overlap_tokens: int = 120):
	words = text.split()
	chunks = []
	i = 0
	while i < len(words):
		chunk = words[i:i + chunk_tokens]
		chunks.append(' '.join(chunk))
		i += max(1, chunk_tokens - overlap_tokens)
	return chunks


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('--input_dir', required=True)
	parser.add_argument('--output_dir', required=True)
	args = parser.parse_args()

	in_dir = Path(args.input_dir)
	out_dir = Path(args.output_dir)
	out_dir.mkdir(parents=True, exist_ok=True)

	with open(out_dir / 'chunks.jsonl', 'w', encoding='utf-8') as out:
		for fp in in_dir.rglob('*'):
			if not fp.is_file():
				continue
			if fp.suffix.lower() not in {'.txt', '.md'}:
				continue
			text = fp.read_text(encoding='utf-8', errors='ignore')
			for chunk in split_text(text):
				rec = {
					'text': chunk,
					'metadata': {
						'source': str(fp.relative_to(in_dir)),
						'type': fp.suffix.lower().lstrip('.')
					}
				}
				out.write(json.dumps(rec) + '\n')


if __name__ == '__main__':
	main()




