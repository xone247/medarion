# 🚀 Quick Start: Expose Your App with ngrok

## ⚡ 3-Step Setup

### 1️⃣ Install & Authenticate ngrok
```powershell
# Download from: https://ngrok.com/download
# Get authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_TOKEN
```

### 2️⃣ Start Your Servers
```powershell
npm start
```
This starts both frontend (5173) and backend (3001)

### 3️⃣ Start ngrok Tunnels
```powershell
.\start_ngrok_simple.ps1
```

## 📱 Share Your App

After starting ngrok, you'll see URLs like:
- **Frontend**: `http://abc123.ngrok-free.app`
- **Backend**: `http://xyz789.ngrok-free.app`

**Share the frontend URL** with testers! 🎉

## ⚠️ Important Notes

- **Free tier**: URLs change each time you restart ngrok
- **Session timeout**: Free tunnels expire after 2 hours
- **CORS**: Backend automatically accepts ngrok URLs

## 🔧 Troubleshooting

**"ngrok not found"**: Install from https://ngrok.com/download

**CORS errors**: The backend is configured to accept ngrok URLs automatically

**Ports not running**: Make sure `npm start` is running first

---

For detailed instructions, see: `NGROK_SETUP_GUIDE.md`

