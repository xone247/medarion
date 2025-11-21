# 🚀 Deploy to cPanel - Complete Guide

## ✅ Local Environment Status

- ✅ Backend tested and running on port 3001
- ✅ Frontend built successfully (medarion-dist/)
- ✅ All files ready for upload

## 📦 Files to Upload

### 1. Frontend (Upload to: `public_html/`)
- **Source:** `medarion-dist/` folder
- **Destination:** Upload ALL contents to `public_html/`
- **Files include:**
  - `index.html`
  - `assets/` folder (CSS, JS, images)
  - Keep folder structure intact

### 2. Backend (Upload to: `public_html/server/`)
- **Source:** `server/` folder
- **Destination:** Upload entire `server/` folder to `public_html/server/`
- **Include:**
  - `server.js`
  - `package.json`
  - `routes/` folder
  - `services/` folder
  - `middleware/` folder
  - `config/` folder
  - All other server files
- **Do NOT upload:**
  - `node_modules/` (install on cPanel)
  - `.git/` folder
  - Development files

## 🔧 cPanel Setup Steps

### Step 1: Upload Files
1. Use cPanel File Manager or FTP/SFTP
2. Upload `medarion-dist/` contents to `public_html/`
3. Upload `server/` folder to `public_html/server/`

### Step 2: Install Backend Dependencies
SSH into cPanel or use Terminal:
```bash
cd ~/public_html/server
npm install --production
```

### Step 3: Create .env File
Create `server/.env` on cPanel with these values:

```env
# Vast.ai Configuration
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast

# Database Configuration (UPDATE WITH YOUR CPANEL VALUES)
DB_HOST=localhost
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_cpanel_db_password
DB_NAME=your_cpanel_db_name

# Server Configuration
PORT=3001
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here

# CORS (UPDATE WITH YOUR DOMAIN)
CORS_ORIGIN=https://yourdomain.com
```

**Important:** Replace:
- `your_cpanel_db_user` with your actual database username
- `your_cpanel_db_password` with your actual database password
- `your_cpanel_db_name` with your actual database name
- `your_jwt_secret_here` with a secure random string
- `https://yourdomain.com` with your actual domain

### Step 4: Set Up Node.js App in cPanel

1. Go to **cPanel → Node.js Selector**
2. Click **Create Application**
3. Configure:
   - **Node.js version:** 18 or 20 (match your local version)
   - **Application root:** `public_html/server`
   - **Application URL:** `/server` (or leave empty)
   - **Application startup file:** `server.js`
4. Add environment variables:
   - Click **Load Variables from .env file** (if available)
   - Or manually add each variable from your `.env` file
5. Click **Create**
6. Click **Run NPM Install** (if available)
7. Click **Start Application**

### Step 5: Alternative - Use PM2 (if available)

If PM2 is available on your cPanel:
```bash
cd ~/public_html/server
pm2 start server.js --name medarion-backend
pm2 save
pm2 startup
```

## 🧪 Testing

### Test Backend
- Health check: `https://yourdomain.com/api/health`
- Should return: `{"status":"OK"}`

### Test Frontend
- Visit: `https://yourdomain.com`
- Should load the application

### Test AI
- Use the chat interface on the website
- Or test directly: `https://yourdomain.com/api/ai/query`

## ✅ Verification Checklist

- [ ] Frontend files uploaded to `public_html/`
- [ ] Backend files uploaded to `public_html/server/`
- [ ] Dependencies installed (`npm install --production`)
- [ ] `.env` file created with correct values
- [ ] Node.js app created and started in cPanel
- [ ] Backend health check works (`/api/health`)
- [ ] Frontend loads correctly
- [ ] AI endpoint responds

## 🐛 Troubleshooting

### Backend Not Starting
- Check Node.js version matches (18 or 20)
- Check `.env` file has correct values
- Check logs in cPanel Node.js Selector
- Verify port 3001 is available

### 503 Errors
- Check backend is running in Node.js Selector
- Check backend logs for errors
- Verify `.env` file is correct

### CORS Errors
- Update `CORS_ORIGIN` in `.env` with your domain
- Restart Node.js app after changing `.env`

### Database Errors
- Verify database credentials in `.env`
- Check database exists and user has permissions
- Test database connection

### AI Not Working
- Check `VAST_AI_URL` is correct in `.env`
- Check `VAST_AI_API_KEY` is correct
- Verify Vast.ai API is accessible
- Check backend logs for AI errors

## 📞 Support

If you encounter issues:
1. Check cPanel Node.js Selector logs
2. Check backend console output
3. Verify all environment variables are correct
4. Ensure all files are uploaded correctly

---

**Ready to deploy!** Follow the steps above to get your website online. 🚀

