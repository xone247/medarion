# Vast.ai Quick Start Guide

## Jupyter Terminal Commands

Copy and paste these commands into your Jupyter terminal on Vast.ai:

### 1. Install All Dependencies

```bash
pip install --quiet --root-user-action=ignore torch transformers flask flask-cors transformers accelerate tqdm boto3
```

### 2. Verify Installations (Optional)

```bash
python3 -c "import torch; print(f'PyTorch: {torch.__version__}')"
python3 -c "import transformers; print(f'Transformers: {transformers.__version__}')"
python3 -c "import flask; print(f'Flask: {flask.__version__}')"
python3 -c "import boto3; print(f'Boto3: {boto3.__version__}')"
```

### 3. Navigate to Workspace

```bash
cd /workspace/model_api || mkdir -p /workspace/model_api && cd /workspace/model_api
```

### 4. Upload the Script

Upload `run_api_on_vast.py` to `/workspace/model_api/` using:
- Jupyter file uploader, or
- SCP from your local machine

### 5. Run the API Server

```bash
python3 run_api_on_vast.py
```

## All-in-One Command

If you want to do everything at once:

```bash
pip install --quiet --root-user-action=ignore torch transformers flask flask-cors transformers accelerate tqdm boto3 && cd /workspace/model_api && python3 run_api_on_vast.py
```

## What Happens

1. **Downloads model** from AWS S3 (if not present)
2. **Extracts model** files (if needed)
3. **Checks GPU** availability
4. **Loads model** (takes 2-5 minutes)
5. **Starts API server** on port 8080 (or next available)

## Endpoints

Once running, you'll have:
- `GET /health` - Health check
- `GET /ping` - Ping test
- `POST /generate` - Simple generation
- `POST /chat` - OpenAI-compatible chat

## Access

The API will be accessible at:
```
http://YOUR_VAST_IP:8080
```

## Stop Server

Press `Ctrl+C` in the Jupyter terminal to stop the server.

