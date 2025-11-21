import fs from 'fs';
import path from 'path';

const CHUNKS_DIR = path.resolve(process.cwd(), 'data', 'chunks');
const CHUNKS_FILE = path.join(CHUNKS_DIR, 'chunks.jsonl');

function ensureDir() {
	if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });
}

export function loadAll() {
	try {
		ensureDir();
		if (!fs.existsSync(CHUNKS_FILE)) return [];
		const lines = fs.readFileSync(CHUNKS_FILE, 'utf8').split(/\r?\n/).filter(Boolean);
		return lines.map((l) => JSON.parse(l));
	} catch {
		return [];
	}
}

export function upsert(docs = []) {
	ensureDir();
	const stream = fs.createWriteStream(CHUNKS_FILE, { flags: 'a' });
	for (const d of docs) {
		const rec = {
			id: d.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
			text: String(d.text || ''),
			metadata: d.metadata || {},
		};
		stream.write(JSON.stringify(rec) + '\n');
	}
	stream.end();
	return { upserted: docs.length };
}

function tokenize(text) {
	return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

export function query(text, topK = 5) {
	const qTokens = tokenize(text);
	const corpus = loadAll();
	const scores = corpus.map((doc, idx) => {
		const dTokens = tokenize(doc.text);
		// simple overlap score
		let score = 0;
		for (const t of qTokens) if (dTokens.includes(t)) score += 1;
		return { idx, score };
	}).filter((s) => s.score > 0);
	scores.sort((a, b) => b.score - a.score);
	const hits = scores.slice(0, topK).map(({ idx, score }) => ({
		...corpus[idx],
		score,
	}));
	return hits;
}




