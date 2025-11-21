# Medarion Fine-Tuned Model Configuration

## ✅ Model Identity

- **Model Name**: Medarion-Mistral-7B
- **Type**: Fine-tuned Mistral 7B
- **Augmentation**: Trained on African healthcare market data
- **Identity**: Medarion AI Assistant
- **Purpose**: African healthcare markets support

## 🔧 Configuration

### API Settings
- **Port**: 5000 (internal)
- **Public URL**: `https://establish-ought-operation-areas.trycloudflare.com`
- **Authentication**: API key required (`medarion-secure-key-2025`)

### Model Parameters (Optimized for Fine-Tuned Model)
- **Temperature**: 0.7 (default) - Balanced for natural responses
- **Max Tokens**: 1024 (default) - Allows complete responses
- **Top P**: 0.9 - High-quality token selection
- **Repetition Penalty**: 1.15 - Prevents repetition
- **No Repeat N-gram**: 3 - Prevents 3-gram repetition

### Response Cleaning
The API includes multi-layer cleaning to prevent gibberish:

1. **Stop Patterns** (stops at training artifacts):
   - `### Instruction:`, `### Response:`, `### Training:`
   - JavaScript code patterns
   - Training data format markers

2. **Gentle Cleaning** (preserves valid content):
   - Removes only actual garbage
   - Preserves Medarion identity and valid responses
   - Trusts the fine-tuned model output

3. **Backend Cleaning** (additional safety):
   - Removes control characters
   - Removes zero-width characters
   - Normalizes whitespace
   - Preserves intentional formatting

## 🎯 Identity Preservation

The fine-tuned model is configured to:
- ✅ Maintain Medarion identity in responses
- ✅ Use healthcare-focused knowledge
- ✅ Support African healthcare markets
- ✅ Provide accurate, context-aware answers

## 📝 Backend Configuration

Update `server/.env`:
```env
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
```

## ✅ Verification

### Test Health:
```bash
curl https://establish-ought-operation-areas.trycloudflare.com/health
```

### Test Chat (with Medarion identity):
```bash
curl -X POST https://establish-ought-operation-areas.trycloudflare.com/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Who are you?"}],"max_tokens":100}'
```

Expected: Response should identify as Medarion and be relevant to healthcare.

## 🐛 Troubleshooting

### If responses are gibberish:
1. Check API logs: `tail -50 /workspace/api.log`
2. Verify model loaded correctly
3. Check cleaning patterns are working
4. Ensure backend is using correct URL

### If identity is wrong:
1. Verify fine-tuned model is loaded (not base model)
2. Check system prompts in backend
3. Ensure model path is correct: `/workspace/model_api/extracted`

## 📊 Monitoring

The API logs:
- Response length
- Stop pattern detection
- Cleaning actions
- Model generation stats

Check logs for: `[API] Generated response: X chars (fine-tuned Medarion model)`

