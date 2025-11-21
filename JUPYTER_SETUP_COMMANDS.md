# Jupyter Terminal Commands - Vast.ai Setup

Copy and paste these commands **one by one** into your Jupyter terminal on Vast.ai:

## Step 1: Install Dependencies

```bash
python3 -m pip install --upgrade pip
```

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

```bash
pip install flask transformers accelerate
```

## Step 2: Verify Installations

```bash
python3 -c "import torch; print('✅ PyTorch:', torch.__version__)"
```

```bash
python3 -c "import flask; print('✅ Flask:', flask.__version__)"
```

```bash
python3 -c "import transformers; print('✅ Transformers:', transformers.__version__)"
```

## Step 3: Create Script File

```bash
cat > /workspace/run_api_on_vast.py << 'ENDOFFILE'
[PASTE THE ENTIRE run_api_on_vast.py CONTENT HERE]
ENDOFFILE
```

**OR** if you already uploaded it via SCP, just verify it exists:

```bash
ls -la /workspace/run_api_on_vast.py
```

## Step 4: Check Model Directory

```bash
ls -la /workspace/model_api/extracted/ | head -10
```

If the model is not there, you need to download and extract it first.

## Step 5: Start the API

```bash
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

## Step 6: Verify API is Running

```bash
ps aux | grep 'python3.*run_api_on_vast.py' | grep -v grep
```

## Step 7: Test the API

```bash
curl http://localhost:44050/health
```

```bash
curl -X POST http://localhost:44050/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":100}'
```

## Step 8: Check Logs (if needed)

```bash
tail -30 /workspace/api.log
```

## Stop the API (if needed)

```bash
pkill -f 'python3.*run_api_on_vast.py'
```

---

**Note**: The API will run on port **44050** (public port in your allowed range 44033-44939)

