# 🔐 ngrok Authentication Guide

## Important: ngrok Uses Authtokens (Not SSH Keys)

ngrok uses **authtokens** for authentication, not SSH keys. This is different from SSH tunneling (like we used for Vast.ai).

## 📋 Quick Setup

### Option 1: Automatic Setup (Recommended)

Run the setup script:
```powershell
.\setup_ngrok_auth.ps1
```

The script will:
1. Check if ngrok is installed
2. Prompt you for your authtoken
3. Configure ngrok automatically

### Option 2: Manual Setup

1. **Get your authtoken:**
   - Sign up/Login: https://dashboard.ngrok.com/signup
   - Get token: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy the authtoken

2. **Configure ngrok:**
   ```powershell
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

3. **Verify it worked:**
   ```powershell
   ngrok version
   ```
   You should see your ngrok version without errors.

## 🔍 Check Current Configuration

To see if ngrok is already configured:
```powershell
# Check config file location
$env:USERPROFILE\.ngrok2\ngrok.yml
```

Or test by running:
```powershell
ngrok http 5173
```

If you see an authentication error, you need to add your authtoken.

## 📝 Example

```powershell
# Example authtoken (yours will be different)
ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

## ✅ After Configuration

Once configured, you can:
1. Start your servers: `npm start`
2. Start ngrok tunnels: `.\start_ngrok_simple.ps1`
3. Share your public URLs with testers!

## 🔗 Useful Links

- **ngrok Dashboard**: https://dashboard.ngrok.com/
- **Get Authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken
- **ngrok Docs**: https://ngrok.com/docs

---

**Note**: The authtoken is stored in `~/.ngrok2/ngrok.yml` and is used automatically for all ngrok commands.

