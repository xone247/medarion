# 📦 Install Python Dependencies for Vast.ai Script

## Quick Command

Run this on your Vast.ai instance (via SSH):

```bash
pip install torch transformers tqdm flask flask-cors
```

---

## Required Packages

From `run_api_on_vast.py` imports:

| Package | Purpose | Install Required |
|---------|---------|----------------|
| `torch` | PyTorch (deep learning framework) | ✅ Yes |
| `transformers` | Hugging Face Transformers | ✅ Yes |
| `tqdm` | Progress bars | ✅ Yes |
| `flask` | Web framework | ✅ Yes |
| `flask-cors` | CORS support | ✅ Yes |
| `tarfile` | Archive handling | ❌ Built-in |
| `os` | OS interface | ❌ Built-in |
| `json` | JSON handling | ❌ Built-in |
| `socket` | Network sockets | ❌ Built-in |
| `sys` | System parameters | ❌ Built-in |

---

## Installation Steps

### 1. SSH into Vast.ai
```bash
ssh -i ~/.ssh/vast_ai_key -p 37792 root@194.228.55.129
```

### 2. Navigate to workspace
```bash
cd /workspace/model_api
```

### 3. Install dependencies
```bash
pip install torch transformers tqdm flask flask-cors
```

### 4. Verify installation
```bash
python3 -c "import torch; import transformers; import flask; print('✅ All packages installed')"
```

---

## Alternative: Using requirements.txt

Create `requirements.txt`:
```txt
torch
transformers
tqdm
flask
flask-cors
```

Then install:
```bash
pip install -r requirements.txt
```

---

## Notes

- **torch** and **transformers** are large packages (several GB)
- Installation may take 5-10 minutes
- Ensure you have enough disk space on Vast.ai instance
- GPU support is included in PyTorch by default on Vast.ai

---

**Last Updated**: Current session

