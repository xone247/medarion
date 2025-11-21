import { Router } from 'express';
import fetch from 'node-fetch';
import { query as ragQuery, upsert as ragUpsert } from '../rag/localStore.js';
import { vastAiService } from '../services/vastAiService.js';

const router = Router();

// Check which AI service to use (priority: Vast.ai > vLLM/Ollama)
const useVastAi = process.env.AI_MODE === 'vast' || !!process.env.VAST_AI_URL;

router.get('/health', async (req, res) => {
	let inference = false;
	let mode = 'local';
	
	if (useVastAi) {
		inference = await vastAiService.healthCheck();
		mode = 'vast';
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
		
		// Safely get context from RAG
		let context = [];
		try {
			context = ragQuery(q, topK).map((d) => ({ text: d.text, meta: d.metadata, score: d.score }));
		} catch (ragError) {
			console.error('[AI Query] RAG query error:', ragError.message);
			context = []; // Empty context if RAG fails
		}

		// Detect simple questions (greetings, short questions) for brief responses
		const isSimpleQuestion = q.trim().length < 50 && (
			q.toLowerCase().match(/^(hi|hello|hey|who are you|what are you|good morning|good afternoon|good evening|thanks|thank you)/) ||
			q.trim().split(/\s+/).length < 6
		);
		
		// Optimized system prompt - very concise for chat
		const sys = isSimpleQuestion 
			? `You are Medarion, a helpful AI assistant for African healthcare markets. Be brief and friendly. Keep responses under 2-3 sentences for simple questions.`
			: `You are Medarion, an expert AI assistant for African healthcare markets. Provide accurate, concise answers. Be direct and avoid unnecessary verbosity.`;

		const messages = [
			{ role: 'system', content: sys },
			{ role: 'user', content: context.length > 0 
				? `CONTEXT:\n${context.map((c)=>`- ${c.text}` ).join('\n')}\n\nQUESTION: ${q}`
				: q
			}
		];

		let answer = '';
		
		// Use Vast.ai if configured (highest priority) - Direct fine-tuned Medarion model
		// The model was trained specifically for Medarion, so trust its output
		if (useVastAi) {
			try {
			console.log('[AI Query] Using Vast.ai fine-tuned Medarion model, URL:', process.env.VAST_AI_URL || 'http://localhost:8081');
			const response = await vastAiService.invoke(messages, {
				temperature: isSimpleQuestion ? 0.5 : 0.7,  // Slightly higher for more natural responses from fine-tuned model
				max_tokens: isSimpleQuestion ? 500 : 4000,  // Increased to allow complete, full responses from fine-tuned model
				top_p: 0.9,  // High-quality token selection
				repetition_penalty: isSimpleQuestion ? 1.1 : 1.15  // Prevent repetition
			});
			answer = response?.choices?.[0]?.message?.content || '';
			
			console.log('[AI Query] Raw response from API:', {
				length: answer.length,
				preview: answer.substring(0, 100)
			});
			
			// REMOVED ALL FILTERING - Trust the fine-tuned Medarion model completely
			// The model was fine-tuned specifically for this purpose, so we trust its output
			console.log('[AI Query] Using fine-tuned Medarion model - NO filtering applied');
			
			// Only minimal cleanup - remove actual control characters that break display
			// But preserve ALL content from the fine-tuned model
			answer = answer.replace(/\uFFFD/g, ''); // Remove replacement characters
			answer = answer.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, ''); // Control chars only
			answer = answer.replace(/[\u200B-\u200D\uFEFF\u2060]/g, ''); // Zero-width chars
			answer = answer.trim();
			
			console.log('[AI Query] Fine-tuned model response (unfiltered):', {
				length: answer.length,
				preview: answer.substring(0, 150)
			});
			
			// REMOVED: All pattern stopping, validation, truncation, and aggressive cleaning
			// The fine-tuned model knows what to output - trust it completely
		} catch (error) {
			console.error('[AI Query] Vast.ai error:', error.message);
			console.error('[AI Query] Error details:', {
				message: error.message,
				stack: error.stack,
				url: process.env.VAST_AI_URL || 'http://localhost:8081'
			});
				// Don't throw - let it fall through to check if answer is empty
				// This will return 503 if no answer, which is better than 500
			}
		} else {
			// NO FALLBACK - Use direct fine-tuned Medarion model only
			// If Vast.ai is not configured, return error (no fallback to other services)
			console.error('[AI Query] Vast.ai not configured - fine-tuned Medarion model required');
			// answer will remain empty, will return 503 below
		}

		if (!answer) {
			// Instead of demo answer, return an error so frontend knows AI is not available
			return res.status(503).json({ 
				success: false,
				error: 'AI service unavailable',
				message: 'The AI service is currently unavailable. Please try again later.',
				answer: '',
				sources: context
			});
		}

		// Ensure full answer is returned (no truncation)
		return res.json({ 
			success: true,
			answer: answer, // Full answer, not truncated
			sources: context,
			answerLength: answer.length // Include length for debugging
		});
	} catch (error) {
		console.error('[AI Query] Unexpected error:', error);
		console.error('[AI Query] Error stack:', error.stack);
		console.error('[AI Query] Request body:', req.body);
		console.error('[AI Query] Request headers:', req.headers);
		console.error('[AI Query] Error name:', error.name);
		console.error('[AI Query] Error message:', error.message);
		// Return more detailed error for debugging
		return res.status(500).json({ 
			success: false,
			error: 'Internal server error',
			message: error.message || 'Something went wrong',
			errorName: error.name || 'Unknown',
			errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			answer: `Error processing query: ${error.message || 'Unknown error'}`
		});
	}
});

export default router;




