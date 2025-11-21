# New Vast.ai Instance Configuration

## SSH Connection Details

### Direct Connection (Recommended)
```bash
ssh -p 52695 root@93.91.156.91 -L 8080:localhost:8080
```

### Proxy Connection (Alternative)
```bash
ssh -p 20675 root@ssh2.vast.ai -L 8080:localhost:8080
```

## SSH Tunnel Setup

### Windows PowerShell
Run the script:
```powershell
.\start_vast_ssh_tunnel.ps1
```

Or manually:
```powershell
ssh -p 52695 root@93.91.156.91 -L 8080:localhost:8080 -N
```

### Linux/Mac
```bash
ssh -p 52695 root@93.91.156.91 -L 8080:localhost:8080 -N
```

## API Endpoint

Once the tunnel is running, the API will be accessible at:
```
http://localhost:8080
```

## Endpoints

- `GET /health` - Health check
- `GET /ping` - Ping test  
- `POST /generate` - Simple generation
- `POST /chat` - OpenAI-compatible chat

## Quick Start on Vast.ai Instance

1. **Install dependencies:**
```bash
pip install --quiet --root-user-action=ignore torch transformers flask flask-cors transformers accelerate tqdm boto3
```

2. **Navigate and run:**
```bash
cd /workspace/model_api && python3 run_api_on_vast.py
```

## All-in-One Command

```bash
pip install --quiet --root-user-action=ignore torch transformers flask flask-cors transformers accelerate tqdm boto3 && cd /workspace/model_api && python3 run_api_on_vast.py
```

## Notes

- The API runs on port 8080 on the Vast.ai instance
- The SSH tunnel maps localhost:8080 to the instance's port 8080
- Keep the SSH tunnel window open while using AI tools
- Press Ctrl+C to stop the tunnel

