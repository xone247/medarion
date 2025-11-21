# Prepare for cPanel Deployment

## ✅ Local Testing Status

Before deploying to cPanel, ensure:
- [ ] Local backend works with Vast.ai API
- [ ] Local frontend connects to backend
- [ ] AI chat works in browser
- [ ] Responses are clean (no gibberish)
- [ ] Medarion identity is preserved
- [ ] No errors in console/logs

## 📋 cPanel Configuration

### Environment Variables (.env on cPanel)

Create or update `.env` file in your cPanel application root:

```env
# Vast.ai Configuration
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast

# Database (your existing config)
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Other existing variables...
```

### Important Notes

1. **Same URL**: Use the same Cloudflare tunnel URL on cPanel
2. **No SSH Tunnel Needed**: Cloudflare tunnel provides public HTTPS access
3. **API Key**: Same key works everywhere
4. **No Port Conflicts**: Cloudflare tunnel handles everything

## 🚀 Deployment Steps

### 1. Build Production Frontend

```bash
npm run build
```

This creates `dist/` folder with production files.

### 2. Prepare Files for cPanel

**Files to upload:**
- `dist/` folder contents → `public_html/`
- `server/` folder → `public_html/server/` (or separate directory)
- `server/.env` → Update with cPanel values
- Database files (if needed)

**Files NOT needed:**
- `node_modules/` (install on cPanel)
- Development files
- Test scripts
- `.git/` folder

### 3. cPanel Setup

1. **Upload files** via File Manager or FTP
2. **Install dependencies:**
   ```bash
   cd server
   npm install --production
   ```
3. **Update .env** with cPanel-specific values
4. **Set up Node.js app** in cPanel (if using Node.js selector)
5. **Configure PM2** or similar for process management

### 4. Test on cPanel

1. Check backend health: `https://yourdomain.com/api/ai/health`
2. Test AI chat in browser
3. Verify responses are clean
4. Check logs for errors

## 🔧 cPanel-Specific Considerations

### Node.js Version
- Ensure Node.js version matches local (check `package.json`)
- Use cPanel Node.js selector if available

### Process Management
- Use PM2 or similar to keep backend running
- Set up auto-restart on server reboot

### Environment Variables
- Set in cPanel Node.js app settings
- Or use `.env` file in application root

### SSL/HTTPS
- Cloudflare tunnel provides HTTPS
- No additional SSL needed for API connection

## ✅ Verification Checklist

After deployment:

- [ ] Backend health endpoint works
- [ ] AI chat endpoint works
- [ ] Responses are clean (no gibberish)
- [ ] Medarion identity preserved
- [ ] No 503/502 errors
- [ ] Fast response times
- [ ] No errors in logs

## 🐛 Troubleshooting on cPanel

### If AI doesn't work:
1. Check `.env` file has correct URL
2. Verify Node.js version matches
3. Check backend logs
4. Test API directly: `curl https://establish-ought-operation-areas.trycloudflare.com/health`

### If responses are gibberish:
1. Check API logs on Vast.ai
2. Verify fine-tuned model is loaded
3. Check cleaning patterns in code

### If connection fails:
1. Verify Cloudflare tunnel is active
2. Check firewall settings
3. Test API URL directly

## 📝 Quick Reference

**API URL**: `https://establish-ought-operation-areas.trycloudflare.com`
**API Key**: `medarion-secure-key-2025`
**Model**: Medarion-Mistral-7B (fine-tuned)

