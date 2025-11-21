# 🔑 Creating API Key in Vast.ai Dashboard

## Step-by-Step Guide

### Step 1: Fill Out the Form

**Name Field:**
- Enter a descriptive name (3-50 characters)
- Examples:
  - `Medarion Production`
  - `Medarion API Key`
  - `Medarion cPanel Integration`
  - `Medarion AI Service`

⚠️ **DO NOT** use the generated API key value as the name!

### Step 2: Set Permissions

For your use case (running AI API on Vast.ai instance), you typically need:

**Recommended Settings:**
- **Instances**: `Read` (to check instance status) or `No Access` (if not needed)
- **User**: `No Access` (unless you need user management)
- **Billing/Earning**: `No Access` (unless you need billing info)
- **Miscellaneous**: `No Access` or `Read & Write` (depending on your needs)

**Minimal Setup (API only):**
- All permissions: `No Access` (if you only need to access your own API)

### Step 3: Create the Key

1. Click **"Create API Key"** or **"Generate"**
2. **IMPORTANT**: Copy the API key immediately!
   - Vast.ai will show the key only once
   - You won't be able to see it again
   - Save it securely

### Step 4: Use the Vast.ai-Generated Key

Once you have the key from Vast.ai dashboard:

1. **On Vast.ai Instance:**
   ```bash
   export VAST_API_KEY="vast-ai-generated-key-here"
   python3 run_api_on_vast.py
   ```

2. **On cPanel (.env file):**
   ```env
   VAST_API_KEY=vast-ai-generated-key-here
   VAST_AI_URL=http://194.228.55.129:3001
   AI_MODE=vast
   ```

3. **Restart Services:**
   - Restart Vast.ai API
   - Restart cPanel Node.js: `systemctl restart medarion-api.service`

---

## Important Notes

✅ **Use Vast.ai's generated key** - Not the one I generated earlier
✅ **The key I generated** (`wUFqr9dClA8IKRNVQ5fXDEeM6SO4WshjGJzuxY3B7vbTigmL1ckyptnHZ0P2ao`) was for custom authentication
✅ **Vast.ai's key** is better because it's managed through their dashboard
✅ **You can revoke/rotate** Vast.ai keys easily through the dashboard

---

## After Creating the Key

Once you have the Vast.ai-generated API key, share it with me and I'll:
1. Configure it on the Vast.ai instance
2. Update the cPanel .env file
3. Test the connection
4. Verify everything works

---

## Troubleshooting

**"Name must be between 3 and 50 characters"**
- Use a descriptive name, not the API key value
- Examples: "Medarion Production", "My API Key"

**Can't see the key after creation**
- Vast.ai only shows it once
- You'll need to create a new key if you lost it
- Or check if there's a way to view it in the dashboard

**Key not working**
- Make sure you copied the entire key (no spaces)
- Verify it's set correctly in environment variables
- Check that services are restarted after configuration

