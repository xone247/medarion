# Fresh Vast.ai Instance Setup

## Complete Setup for Brand New Instance

Since this is a completely fresh instance with no files, follow these steps:

### Step 1: Create Workspace Directory

In Jupyter terminal, run:
```bash
mkdir -p /workspace/model_api
cd /workspace/model_api
```

### Step 2: Upload the Script

Upload `run_api_on_vast.py` to `/workspace/model_api/` using:
- Jupyter file uploader (drag and drop)
- Or use SCP from your local machine

### Step 3: Install Dependencies

```bash
pip install --quiet --root-user-action=ignore torch transformers flask flask-cors transformers accelerate tqdm boto3
```

### Step 4: Run the Script

```bash
cd /workspace/model_api
python3 run_api_on_vast.py
```

## All-in-One Commands

### Option 1: Manual Setup
```bash
mkdir -p /workspace/model_api && cd /workspace/model_api && pip install --quiet --root-user-action=ignore torch transformers flask flask-cors transformers accelerate tqdm boto3 && python3 run_api_on_vast.py
```

### Option 2: Step by Step
```bash
# Create directory
mkdir -p /workspace/model_api
cd /workspace/model_api

# Install dependencies
pip install --quiet --root-user-action=ignore torch transformers flask flask-cors transformers accelerate tqdm boto3

# Upload run_api_on_vast.py via Jupyter file uploader, then:
python3 run_api_on_vast.py
```

## What the Script Does

1. **Creates directories** - `/workspace/model_api` and `/workspace/model_api/extracted`
2. **Downloads model** - From AWS S3 (takes 10-30 minutes depending on connection)
3. **Extracts model** - Extracts tar.gz file (takes 5-10 minutes)
4. **Checks GPU** - Verifies CUDA is available
5. **Loads model** - Loads Mistral 7B (takes 2-5 minutes)
6. **Starts API** - Starts Flask server on port 8080

## First Run Timeline

- **Download**: 10-30 minutes (depends on connection speed)
- **Extraction**: 5-10 minutes
- **Model Loading**: 2-5 minutes
- **Total**: ~20-45 minutes for first run

## Subsequent Runs

After first run, the script will:
- Skip download (file exists)
- Skip extraction (files already extracted)
- Just load model and start server (~2-5 minutes)

## Troubleshooting

### If download fails:
- Check internet connection on Vast.ai instance
- Verify AWS credentials are correct
- Try running again (script will resume)

### If extraction fails:
- Check disk space: `df -h`
- Verify tar.gz file is complete
- Delete and re-download if corrupted

### If model loading fails:
- Check GPU: `nvidia-smi`
- Verify model files are complete
- Restart instance if out of memory

