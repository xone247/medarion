import { Router } from 'express';
import fetch from 'node-fetch';
import { query as ragQuery, upsert as ragUpsert } from '../rag/localStore.js';
import { sagemakerService } from '../services/sagemakerService.js';
import { vastAiService } from '../services/vastAiService.js';

const router = Router();

// Check which AI service to use (priority: Vast.ai > SageMaker > vLLM/Ollama)
const useVastAi = process.env.AI_MODE === 'vast' || !!process.env.VAST_AI_URL;
const useSageMaker = !useVastAi && (process.env.AI_MODE === 'cloud' || !!process.env.SAGEMAKER_ENDPOINT_NAME);

router.get('/health', async (req, res) => {
	let inference = false;
	let mode = 'local';
	
	if (useVastAi) {
		inference = await vastAiService.healthCheck();
		mode = 'vast';
	} else if (useSageMaker) {
		inference = await sagemakerService.healthCheck();
		mode = 'cloud';
	} else {
		inference = Boolean(process.env.VLLM_BASE_URL || process.env.MISTRAL_7B_ENDPOINT);
		mode = 'local';
	}
	
	res.json({ 
		status: 'OK', 
		rag: true, 
		inference,
		mode
	});
});

router.post('/ingest', async (req, res) => {
	const docs = Array.isArray(req.body?.docs) ? req.body.docs : [];
	const result = ragUpsert(docs);
	return res.json({ ok: true, ...result });
});

router.post('/query', async (req, res) => {
	try {
		const q = String(req.body?.query || '');
		const topK = Number(req.body?.topK || 5);
		const context = ragQuery(q, topK).map((d) => ({ text: d.text, meta: d.metadata, score: d.score }));

		const sys = 'You are Medarion, a concise assistant for African healthcare markets. Use provided CONTEXT to answer.';
		const messages = [
			{ role: 'system', content: sys },
			{ role: 'user', content: `CONTEXT:\n${context.map((c)=>`- ${c.text}` ).join('\n')}\n\nQUESTION: ${q}` }
		];

		let answer = '';
		
		// Use Vast.ai if configured (highest priority)
		if (useVastAi) {
			try {
				console.log('[AI Query] Using Vast.ai, URL:', process.env.VAST_AI_URL || 'http://localhost:8081');
				const response = await vastAiService.invoke(messages, {
					temperature: 0.2,
					max_tokens: 4000
				});
				answer = response?.choices?.[0]?.message?.content || '';
				console.log('[AI Query] Vast.ai response received, length:', answer?.length || 0);
			} catch (error) {
				console.error('[AI Query] Vast.ai error:', error.message);
				console.error('[AI Query] Error details:', {
					message: error.message,
					stack: error.stack,
					url: process.env.VAST_AI_URL || 'http://localhost:8081'
				});
				// Don't throw - fallback to demo answer
			}
		} else if (useSageMaker) {
			// Use SageMaker if in cloud mode
			try {
				const response = await sagemakerService.invoke(messages, {
					temperature: 0.2,
					max_tokens: 4000
				});
				answer = response?.choices?.[0]?.message?.content || '';
			} catch (error) {
				console.error('SageMaker error:', error);
				console.error('Error details:', {
					message: error.message,
					stack: error.stack,
					endpoint: process.env.SAGEMAKER_ENDPOINT_NAME,
					region: process.env.SAGEMAKER_REGION
				});
				// Don't throw - fallback to demo answer
			}
		} else {
			// Fallback to vLLM/Ollama
			const base = (process.env.VLLM_BASE_URL || process.env.MISTRAL_7B_ENDPOINT || '').replace(/\/$/, '');
			const model = process.env.VLLM_MODEL || process.env.MISTRAL_7B_MODEL || 'mistral-7b-instruct';
			
			if (base) {
				try {
					const r = await fetch(`${base}/v1/chat/completions`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ model, messages, temperature: 0.2 })
					});
					if (r.ok) {
						const data = await r.json();
						answer = data?.choices?.[0]?.message?.content || '';
					}
				} catch (error) {
					console.error('vLLM/Ollama error:', error);
				}
			}
		}

		if (!answer) {
			answer = `Demo answer for: ${q}\n\nTop context:\n${context.map((c)=>`- ${c.text}` ).join('\n')}`;
		}

		return res.json({ answer, sources: context });
	} catch (error) {
		console.error('[AI Query] Unexpected error:', error);
		console.error('[AI Query] Error stack:', error.stack);
		return res.status(500).json({ 
			error: 'Internal server error',
			message: error.message,
			answer: `Error: ${error.message}`
		});
	}
});

export default router;




