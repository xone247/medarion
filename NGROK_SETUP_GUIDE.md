# 🌐 ngrok Setup Guide for Medarion

This guide will help you expose your local Medarion application to the internet using ngrok for testing.

## 📋 Prerequisites

1. **ngrok Account** (Free tier is sufficient)
   - Sign up at: https://dashboard.ngrok.com/signup
   - Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

2. **Install ngrok**
   - Download from: https://ngrok.com/download
   - Extract to a folder in your PATH (or use Chocolatey: `choco install ngrok`)

3. **Authenticate ngrok**
   ```powershell
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

## 🚀 Quick Start

### Option 1: Simple Setup (Recommended)

1. **Start your servers** (in separate terminals):
   ```powershell
   # Terminal 1: Backend
   npm run server:dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. **Start ngrok tunnels**:
   ```powershell
   .\start_ngrok_simple.ps1
   ```

   This will open two separate PowerShell windows:
   - One for frontend tunnel (port 5173)
   - One for backend tunnel (port 3001)

3. **Get your public URLs**:
   - Check each ngrok window for the public URL
   - Frontend URL: `http://xxxx-xxxx-xxxx.ngrok-free.app`
   - Backend URL: `http://xxxx-xxxx-xxxx.ngrok-free.app`

4. **Share the frontend URL** with testers!

### Option 2: Advanced Setup (Single Window)

1. **Start your servers** first

2. **Start ngrok with config file**:
   ```powershell
   .\start_ngrok.ps1
   ```

3. **View ngrok dashboard**:
   - Open: http://127.0.0.1:4040
   - You'll see both tunnels and their public URLs

## 🔧 Manual Setup

If you prefer to run ngrok manually:

### Frontend Tunnel
```powershell
ngrok http 5173
```

### Backend Tunnel (in another terminal)
```powershell
ngrok http 3001
```

## 📝 Important Notes

### 1. Update Backend CORS (if needed)

If you get CORS errors, update `server/.env`:
```env
CORS_ORIGIN=https://your-frontend-ngrok-url.ngrok-free.app
```

Or update `server/server.js` to accept all origins (for testing only):
```javascript
app.use(cors({
  origin: '*', // Allow all origins (testing only!)
  credentials: true
}));
```

### 2. ngrok Free Tier Limitations

- **Session timeout**: Free tunnels expire after 2 hours
- **Random URLs**: URLs change each time you restart ngrok
- **Rate limits**: Limited requests per minute

### 3. ngrok Paid Plans

For production testing, consider:
- **Static domains**: Keep the same URL
- **No session timeouts**: Tunnels stay active
- **Higher rate limits**: More requests allowed

## 🔍 Troubleshooting

### Issue: "ngrok is not installed"
**Solution**: 
1. Download ngrok from https://ngrok.com/download
2. Extract to a folder in your PATH
3. Or use: `choco install ngrok`

### Issue: "ngrok: command not found"
**Solution**: Add ngrok to your system PATH or run from the ngrok directory

### Issue: "authtoken required"
**Solution**: 
```powershell
ngrok config add-authtoken YOUR_TOKEN
```
Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken

### Issue: "Port already in use"
**Solution**: 
- Make sure your servers are running on ports 5173 (frontend) and 3001 (backend)
- Check if another ngrok instance is running: `taskkill /F /IM ngrok.exe`

### Issue: CORS errors when accessing via ngrok
**Solution**: 
1. Update `server/.env` with the ngrok frontend URL
2. Or temporarily allow all origins in `server/server.js` (testing only)

### Issue: "ngrok session expired"
**Solution**: 
- Free tier sessions expire after 2 hours
- Restart ngrok to get a new session
- Consider upgrading to a paid plan for longer sessions

## 📱 Testing Checklist

- [ ] Both servers are running (frontend on 5173, backend on 3001)
- [ ] ngrok tunnels are active
- [ ] Frontend URL is accessible from another device
- [ ] Backend API calls work from the frontend
- [ ] Authentication/login works
- [ ] AI tools are functional (if using Vast.ai)

## 🔗 Useful Links

- **ngrok Dashboard**: https://dashboard.ngrok.com/
- **ngrok Documentation**: https://ngrok.com/docs
- **ngrok Status**: https://status.ngrok.com/

## 💡 Tips

1. **Bookmark your ngrok URLs** - They change each time you restart
2. **Use ngrok dashboard** - View requests, inspect traffic, debug issues
3. **Test on mobile** - Access your app from your phone to test responsive design
4. **Share with team** - Send the frontend URL to team members for testing
5. **Monitor traffic** - Use ngrok dashboard to see all requests in real-time

---

**Note**: ngrok free tier is perfect for development and testing. For production deployments, consider using a proper hosting service.

