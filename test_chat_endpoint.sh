#!/bin/bash
# Test chat endpoint
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 20
  }' | jq .

