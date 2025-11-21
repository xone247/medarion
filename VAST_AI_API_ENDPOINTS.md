# Vast.ai AI API Endpoints

Complete list of all available endpoints from the Mistral 7B Flask API running on Vast.ai.

## Base URL
- **Local (via SSH tunnel)**: `http://localhost:8081`
- **Direct (if accessible)**: `http://194.228.55.129:8081` (or current Vast.ai IP)

---

## 📋 Available Endpoints

### 1. **GET /health**
**Purpose**: Health check and system status

**Method**: `GET`

**Request**:
```bash
curl http://localhost:8081/health
```

**Response**:
```json
{
  "status": "healthy",
  "gpu": "NVIDIA RTX A5000",
  "vram_used": "14.23 GB",
  "vram_total": "23.55 GB"
}
```

**Fields**:
- `status`: Server health status
- `gpu`: GPU model name
- `vram_used`: VRAM currently used by model
- `vram_total`: Total available VRAM

---

### 2. **GET /ping**
**Purpose**: Simple connectivity test

**Method**: `GET`

**Request**:
```bash
curl http://localhost:8081/ping
```

**Response**:
```json
{
  "message": "pong"
}
```

---

### 3. **POST /generate**
**Purpose**: Simple text generation from a prompt

**Method**: `POST`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body** (Option 1 - Simple prompt):
```json
{
  "prompt": "What are the healthcare trends in Nigeria?",
  "max_tokens": 200,
  "temperature": 0.7
}
```

**Request Body** (Option 2 - Chat format):
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What are the healthcare trends in Nigeria?"}
  ],
  "max_tokens": 200,
  "temperature": 0.7
}
```

**Parameters**:
- `prompt` (string, optional): Simple text prompt
- `messages` (array, optional): Chat format messages
- `max_tokens` (integer, default: 100): Maximum tokens to generate
- `temperature` (float, default: 0.7): Sampling temperature (0.0-2.0)

**Response**:
```json
{
  "response": "The healthcare market in Nigeria is rapidly growing...",
  "tokens_generated": 156
}
```

**Fields**:
- `response`: Generated text
- `tokens_generated`: Number of tokens generated

---

### 4. **POST /chat** ⭐ (Primary Endpoint)
**Purpose**: OpenAI-compatible chat endpoint (used by application)

**Method**: `POST`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "messages": [
    {"role": "system", "content": "You are Medarion, a concise assistant for African healthcare markets."},
    {"role": "user", "content": "What are the top 3 healthcare investment trends in Kenya?"}
  ],
  "max_tokens": 4000,
  "temperature": 0.2
}
```

**Parameters**:
- `messages` (array, **required**): Array of message objects with `role` and `content`
  - `role`: `"system"`, `"user"`, or `"assistant"`
  - `content`: Message text
- `max_tokens` (integer, default: 100): Maximum tokens to generate
- `temperature` (float, default: 0.7): Sampling temperature (0.0-2.0)

**Response** (OpenAI-compatible format):
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "The top 3 healthcare investment trends in Kenya are:\n\n1. Telemedicine and digital health solutions...\n2. Primary care and diagnostics expansion...\n3. Pharmaceutical manufacturing and distribution..."
      }
    }
  ],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 234,
    "total_tokens": 279
  }
}
```

**Fields**:
- `choices[0].message.content`: Generated response text
- `usage.prompt_tokens`: Number of tokens in input
- `usage.completion_tokens`: Number of tokens generated
- `usage.total_tokens`: Total tokens used

**Note**: This is the endpoint used by the application's `vastAiService.js`

---

## 🔧 Current Configuration

- **Model**: Mistral 7B (from S3: `medarion-final-model.tar.gz`)
- **Default Port**: 8080 (auto-finds alternative if in use)
- **Host**: 0.0.0.0 (listens on all interfaces)
- **Timeout**: 120 seconds (2 minutes) for generation
- **CORS**: Enabled (allows cross-origin requests)

---

## 📝 Example Usage

### JavaScript/Node.js
```javascript
// Health check
const health = await fetch('http://localhost:8081/health');
const healthData = await health.json();
console.log(healthData);

// Chat request
const response = await fetch('http://localhost:8081/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What are healthcare trends in Nigeria?' }
    ],
    max_tokens: 4000,
    temperature: 0.2
  })
});
const data = await response.json();
console.log(data.choices[0].message.content);
```

### Python
```python
import requests

# Health check
response = requests.get('http://localhost:8081/health')
print(response.json())

# Chat request
response = requests.post('http://localhost:8081/chat', json={
    "messages": [
        {"role": "user", "content": "What are healthcare trends in Nigeria?"}
    ],
    "max_tokens": 4000,
    "temperature": 0.2
})
print(response.json()['choices'][0]['message']['content'])
```

### cURL
```bash
# Health check
curl http://localhost:8081/health

# Chat request
curl -X POST http://localhost:8081/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are healthcare trends in Nigeria?"}
    ],
    "max_tokens": 4000,
    "temperature": 0.2
  }'
```

---

## ⚠️ Important Notes

1. **Response Truncation Fix**: The `/chat` endpoint has been updated to extract only generated tokens, preventing truncation at the beginning of responses.

2. **Token Limits**: 
   - Default `max_tokens`: 100
   - Recommended for full responses: 4000
   - Model context window: ~8000 tokens

3. **Temperature Guidelines**:
   - `0.0-0.3`: More deterministic, factual responses
   - `0.4-0.7`: Balanced creativity and accuracy (default)
   - `0.8-2.0`: More creative, less predictable

4. **Error Responses**: All endpoints return `500` status with error details in JSON format:
   ```json
   {
     "error": "Error message here"
   }
   ```

---

## 🔗 Integration Points

- **Backend Service**: `server/services/vastAiService.js` uses `/chat` endpoint
- **Backend Route**: `server/routes/ai.js` calls `vastAiService.invoke()`
- **Frontend Service**: `src/services/ai/index.ts` calls backend API which proxies to Vast.ai

