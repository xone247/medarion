import { Router } from 'express';
import pool, { testConnection } from '../config/database.js';

const router = Router();

router.get('/health', async (req, res) => {
	try {
		const ok = await testConnection();
		if (!ok) return res.status(500).json({ status: 'DOWN' });
		const [rows] = await pool.query('SELECT 1 AS ok');
		return res.json({ status: 'UP', result: rows?.[0]?.ok === 1 ? 'ok' : 'unknown' });
	} catch (e) {
		return res.status(500).json({ status: 'DOWN', error: e?.message || 'unknown' });
	}
});

export default router;




