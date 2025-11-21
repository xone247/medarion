# Upload Script to Vast.ai - Manual Commands

## Option 1: Using SCP (from your local machine)

### With SSH Key (if you have one):
```powershell
scp -i "$env:USERPROFILE\.ssh\vast_ai_key" -P 52695 "C:\xampp\htdocs\medarion\run_api_on_vast.py" root@93.91.156.91:/workspace/model_api/run_api_on_vast.py
```

### Without SSH Key (will prompt for password):
```powershell
scp -P 52695 "C:\xampp\htdocs\medarion\run_api_on_vast.py" root@93.91.156.91:/workspace/model_api/run_api_on_vast.py
```

## Option 2: Using Jupyter File Uploader (Easiest)

1. Open Jupyter on Vast.ai
2. Navigate to `/workspace/model_api` (create it if needed)
3. Click "Upload" button
4. Select `run_api_on_vast.py` from your local machine
5. File will be uploaded

## Option 3: Create Directory First, Then Upload

### Step 1: Create directory via SSH
```powershell
ssh -p 52695 root@93.91.156.91 "mkdir -p /workspace/model_api"
```

### Step 2: Upload file
```powershell
scp -P 52695 "C:\xampp\htdocs\medarion\run_api_on_vast.py" root@93.91.156.91:/workspace/model_api/
```

## After Upload - Run in Jupyter Terminal

```bash
cd /workspace/model_api
pip install --quiet --root-user-action=ignore torch transformers flask flask-cors transformers accelerate tqdm boto3
python3 run_api_on_vast.py
```

