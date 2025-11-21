# 🚀 Setup Guide for New Vast.ai Instance

## Template: Ubuntu 24 + CUDA (Base/SSH Only)

This is the **perfect template** - minimal, clean, no port conflicts!

---

## Step 1: Create Instance

1. **Select Template:** Ubuntu 24 + CUDA (Base)
2. **GPU:** RTX A5000 or similar
3. **Storage:** At least 50GB (for model)
4. **Port:** Will auto-assign in range 38506-38941

---

## Step 2: After Instance Starts

### Get Connection Details
- **SSH Port:** (shown in instance details)
- **Public IP:** (shown in instance details)
- **Port Range:** 38506-38941

### Note the Assigned Port
Vast.ai will show which port is mapped. Use that port, or pick a free one in the range.

---

## Step 3: Upload and Configure API

### Upload run_api_on_vast.py
```bash
# From your PC
scp -P <SSH_PORT> run_api_on_vast.py root@<VAST_IP>:/workspace/
```

### Set the Port
Edit `run_api_on_vast.py` and set:
```python
PORT = 38800  # Or whatever port is assigned/free
```

### Install Dependencies
```bash
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors
```

### Start API
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

---

## Step 4: Test

### Locally (on Vast.ai)
```bash
curl http://localhost:38800/health
```

### Externally (from your PC)
```bash
curl http://<VAST_IP>:38800/health
```

---

## Why This Template is Better

✅ **No Port Conflicts**
- No Jupyter (would use 8080)
- No TensorBoard (would use 6006)
- Clean slate

✅ **Full Control**
- Choose any port in range
- No pre-configured services
- Easy to manage

✅ **CUDA Support**
- GPU ready
- PyTorch compatible
- Perfect for AI models

---

## Port Selection Strategy

1. **Check assigned ports** in Vast.ai dashboard
2. **Pick a port** not in use (e.g., 38800, 38750, 38600)
3. **Set PORT** in `run_api_on_vast.py`
4. **Start API** - should work immediately!

---

## Quick Setup Commands

```bash
# 1. Upload file
scp -P <SSH_PORT> run_api_on_vast.py root@<VAST_IP>:/workspace/

# 2. SSH to instance
ssh -p <SSH_PORT> root@<VAST_IP>

# 3. Install dependencies
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors

# 4. Set port (edit PORT = 38800 in run_api_on_vast.py)
sed -i 's/PORT = [0-9]*/PORT = 38800/' /workspace/run_api_on_vast.py

# 5. Start API
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &

# 6. Test
curl http://localhost:38800/health
```

---

## Benefits of This Template

- ✅ **No port conflicts** - clean environment
- ✅ **Fast setup** - minimal configuration
- ✅ **Reliable** - no service interference
- ✅ **Flexible** - use any port you want
- ✅ **GPU ready** - CUDA support included

---

## For Current Instance

Your current instance with port 38800 should work! The Ubuntu 24 + CUDA template would be even better for future instances to avoid these issues from the start.

