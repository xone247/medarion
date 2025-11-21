# 🔑 Vast.ai API Key Setup Guide

## Step 1: Create API Key in Vast.ai Dashboard

1. Log in to your Vast.ai dashboard
2. Navigate to **Settings** or **API Keys** section
3. Click **Create New API Key** or **Generate API Key**
4. Give it a name (e.g., "Medarion Production")
5. Copy the API key immediately (you won't be able to see it again!)

## Step 2: Configure on Vast.ai Instance

Set the API key as an environment variable on your Vast.ai instance:

```bash
export VAST_API_KEY="your-vast-api-key-here"
```

Or add it to your startup script:
```bash
VAST_API_KEY="your-vast-api-key-here" python3 run_api_on_vast.py
```

## Step 3: Configure on cPanel

In `/home/medasnnc/nodevenv/medarion/18/bin/.env`:

```env
AI_MODE=vast
VAST_AI_URL=http://194.228.55.129:3001
VAST_API_KEY=your-vast-api-key-here
```

**Note**: Use `VAST_API_KEY` (not `VAST_AI_API_KEY`) for Vast.ai native keys.

## Step 4: Restart Services

### On Vast.ai:
```bash
# Restart your API
pkill -f run_api_on_vast.py
VAST_API_KEY="your-key" python3 run_api_on_vast.py &
```

### On cPanel:
```bash
systemctl restart medarion-api.service
```

## Step 5: Test Connection

```bash
curl -H "X-API-Key: your-vast-api-key-here" http://194.228.55.129:3001/health
```

Should return: `{"status":"ok","model":"Mistral-7B"}`

## Security Notes

✅ **Vast.ai native API keys are more secure**
✅ **Managed through Vast.ai dashboard**
✅ **Can be revoked/rotated easily**
✅ **Better integration with Vast.ai services**

## Troubleshooting

- If you get "Unauthorized", check:
  1. API key is correct (no extra spaces)
  2. Environment variable is set on Vast.ai
  3. .env file has `VAST_API_KEY` (not `VAST_AI_API_KEY`)
  4. Services are restarted after changes
