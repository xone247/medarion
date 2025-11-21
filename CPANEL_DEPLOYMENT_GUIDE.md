# cPanel Deployment Guide - Medarion AI

## ✅ Pre-Deployment Checklist

Before deploying, ensure local testing passes:
- [ ] Backend health shows `inference: true`
- [ ] Chat endpoint works from backend
- [ ] Frontend connects to backend
- [ ] AI responses are clean (no gibberish)
- [ ] Medarion identity preserved
- [ ] No errors in browser console

## 📦 Step 1: Build Production Frontend

```bash
npm run build
```

This creates the `dist/` folder with optimized production files.

## 📤 Step 2: Prepare Files for Upload

### Files to Upload to cPanel:

**Frontend (to `public_html/`):**
- All contents from `dist/` folder
- Keep folder structure intact

**Backend (to `public_html/server/` or separate directory):**
- `server/` folder (excluding `node_modules/`)
- `server/.env` (update with cPanel values)
- `server/package.json`
- All server source files

**Do NOT upload:**
- `node_modules/` (install on cPanel)
- `.git/` folder
- Development/test files
- `*.ps1` scripts
- Documentation files (optional)

## 🔧 Step 3: cPanel Configuration

### A. Update `.env` on cPanel

Create/update `.env` in your backend directory:

```env
# Vast.ai Configuration (SAME AS LOCAL)
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast

# Database Configuration (cPanel specific)
DB_HOST=localhost
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_cpanel_db_password
DB_NAME=your_cpanel_db_name

# Server Configuration
PORT=3001
NODE_ENV=production
JWT_SECRET=your_jwt_secret

# CORS (your domain)
CORS_ORIGIN=https://yourdomain.com
```

### B. Install Dependencies

SSH into cPanel or use Terminal:

```bash
cd ~/public_html/server
npm install --production
```

### C. Set Up Node.js App

1. Go to cPanel → **Node.js Selector**
2. Create new application:
   - **Node.js version**: Match your local version
   - **Application root**: `public_html/server` (or your path)
   - **Application URL**: `/server` (or your path)
   - **Application startup file**: `server.js`
3. Set environment variables in Node.js app settings
4. Start the application

### D. Configure Process Manager (PM2)

If using PM2:

```bash
cd ~/public_html/server
pm2 start server.js --name medarion-backend
pm2 save
pm2 startup
```

## 🧪 Step 4: Test on cPanel

### Test Backend Health:
```bash
curl https://yourdomain.com/api/ai/health
```

Expected:
```json
{
  "status": "OK",
  "rag": true,
  "inference": true,
  "mode": "vast"
}
```

### Test Chat Endpoint:
```bash
curl -X POST https://yourdomain.com/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query":"Who are you?"}'
```

### Test in Browser:
1. Open your website
2. Log in
3. Test AI chat
4. Verify:
   - ✅ Responses are clean
   - ✅ Identifies as Medarion
   - ✅ No gibberish
   - ✅ No errors

## 🔍 Step 5: Verify Everything Works

### Check Backend Logs:
```bash
# If using PM2
pm2 logs medarion-backend

# Or check application logs in cPanel
```

### Check Browser Console:
- No 503 errors
- No connection errors
- API calls successful

### Check Network Tab:
- Requests to `/api/ai/query` succeed
- Responses are clean JSON

## 🐛 Troubleshooting on cPanel

### Backend Not Starting:
1. Check Node.js version matches
2. Verify `.env` file exists and is correct
3. Check file permissions
4. Review application logs

### AI Not Working:
1. Verify `VAST_AI_URL` in `.env`
2. Test API directly: `curl https://establish-ought-operation-areas.trycloudflare.com/health`
3. Check backend logs for errors
4. Verify Cloudflare tunnel is active

### Responses Are Gibberish:
1. Check API logs on Vast.ai: `tail -50 /workspace/api.log`
2. Verify fine-tuned model is loaded
3. Check cleaning patterns in code

### 503 Errors:
1. Backend may not be running
2. Check process manager (PM2)
3. Verify Node.js app is started in cPanel
4. Check application logs

## 📝 Quick Reference

**API URL**: `https://establish-ought-operation-areas.trycloudflare.com`
**API Key**: `medarion-secure-key-2025`
**Model**: Medarion-Mistral-7B (fine-tuned)

**cPanel .env**:
```env
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast
```

## ✅ Success Indicators

- [ ] Backend health shows `inference: true`
- [ ] Chat endpoint returns clean responses
- [ ] Website AI chat works
- [ ] Responses identify as Medarion
- [ ] No gibberish in answers
- [ ] Fast response times
- [ ] No errors in logs

## 🎯 Next Steps After Deployment

1. Monitor logs for first few days
2. Test AI responses regularly
3. Verify Cloudflare tunnel stays active
4. Set up monitoring/alerts if needed

---

**Ready to deploy!** 🚀
