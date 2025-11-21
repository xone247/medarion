#!/bin/bash
# Diagnostic script to check model files and API status on Vast.ai

echo "===================================================================="
echo "🔍 Medarion Model & API Diagnostic"
echo "===================================================================="

# Check model directory
MODEL_DIR="/workspace/model_api/extracted"
echo ""
echo "[1/5] Checking model directory..."
if [ -d "$MODEL_DIR" ]; then
    echo "   ✅ Model directory exists: $MODEL_DIR"
    echo "   📁 Contents:"
    ls -lh "$MODEL_DIR" | head -10
    echo ""
    
    # Check for key files
    echo "   [1.1] Checking key model files..."
    if [ -f "$MODEL_DIR/tokenizer.json" ]; then
        echo "      ✅ tokenizer.json found"
    else
        echo "      ❌ tokenizer.json NOT found"
    fi
    
    if [ -f "$MODEL_DIR/config.json" ]; then
        echo "      ✅ config.json found"
    else
        echo "      ❌ config.json NOT found"
    fi
    
    # Check for model files (pytorch_model.bin or model.safetensors)
    if [ -f "$MODEL_DIR/pytorch_model.bin" ] || [ -f "$MODEL_DIR/model.safetensors" ] || [ -f "$MODEL_DIR/model-00001-of-00001.safetensors" ]; then
        echo "      ✅ Model weights file found"
    else
        echo "      ⚠️  Model weights file not found (checking for sharded files)..."
        MODEL_FILES=$(find "$MODEL_DIR" -name "*.safetensors" -o -name "*.bin" | wc -l)
        if [ "$MODEL_FILES" -gt 0 ]; then
            echo "      ✅ Found $MODEL_FILES model weight file(s)"
        else
            echo "      ❌ No model weight files found"
        fi
    fi
else
    echo "   ❌ Model directory NOT found: $MODEL_DIR"
fi

# Check if API is running
echo ""
echo "[2/5] Checking if API is running..."
API_PID=$(ps aux | grep "python3.*run_api_on_vast.py" | grep -v grep | awk '{print $2}')
if [ -n "$API_PID" ]; then
    echo "   ✅ API process found (PID: $API_PID)"
    echo "   📊 Process info:"
    ps aux | grep "python3.*run_api_on_vast.py" | grep -v grep
else
    echo "   ❌ API process NOT running"
fi

# Check port 5000
echo ""
echo "[3/5] Checking port 5000..."
if lsof -i :5000 > /dev/null 2>&1; then
    echo "   ✅ Port 5000 is in use"
    lsof -i :5000
else
    echo "   ❌ Port 5000 is NOT in use"
fi

# Test health endpoint
echo ""
echo "[4/5] Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -H "X-API-Key: medarion-secure-key-2025" http://localhost:5000/health 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Health endpoint responded"
    echo "   Response: $HEALTH_RESPONSE"
    
    # Check if response contains "ok" or "Medarion"
    if echo "$HEALTH_RESPONSE" | grep -q "ok\|Medarion"; then
        echo "   ✅ Health check looks good"
    else
        echo "   ⚠️  Health check response may be invalid"
    fi
else
    echo "   ❌ Health endpoint failed"
    echo "   Error: $HEALTH_RESPONSE"
fi

# Test chat endpoint
echo ""
echo "[5/5] Testing chat endpoint..."
CHAT_BODY='{"messages":[{"role":"user","content":"Hello, who are you?"}]}'
CHAT_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: medarion-secure-key-2025" \
    -d "$CHAT_BODY" \
    http://localhost:5000/chat 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Chat endpoint responded"
    if echo "$CHAT_RESPONSE" | grep -q "choices\|content"; then
        echo "   ✅ Chat response looks valid"
        echo "   Preview: $(echo "$CHAT_RESPONSE" | head -c 200)..."
    else
        echo "   ⚠️  Chat response may be invalid"
        echo "   Response: $CHAT_RESPONSE"
    fi
else
    echo "   ❌ Chat endpoint failed"
    echo "   Error: $CHAT_RESPONSE"
fi

echo ""
echo "===================================================================="
echo "✅ Diagnostic complete!"
echo "===================================================================="

