# How to Start Local Backend and Frontend Servers

## 🚀 Quick Start (Easiest - Both Servers Together)

From the **project root** (`C:\xampp\htdocs\medarion`):

```powershell
npm start
```

This starts both:
- **Backend** on port 3001 (with nodemon for auto-reload)
- **Frontend** on port 5173 (Vite dev server)

---

## 🔧 Start Servers Separately (Recommended for Development)

### Option 1: Using Root Scripts (From Project Root)

**Terminal 1 - Backend:**
```powershell
npm run server:dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

### Option 2: Manual (Direct Commands)

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```
*(Run from project root, not from server directory)*

---

## 📋 Prerequisites

### 1. Install Dependencies (First Time Only)

From project root:
```powershell
npm run install:all
```

This installs dependencies for both root and server directories.

### 2. Setup Database (First Time Only)

Make sure XAMPP MySQL is running, then:
```powershell
npm run setup:db
```

### 3. Environment Variables

Create `server/.env` file with:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medarion_platform
DB_USER=root
DB_PASSWORD=

PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS

AI_MODE=vast
VAST_AI_URL=http://localhost:8081
```

---

## ✅ Verify Servers Are Running

### Check Backend:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/ai/health" -UseBasicParsing
```

### Check Frontend:
Open browser: `http://localhost:5173`

---

## 📝 Available Commands Summary

From **project root**:
- `npm start` - Start both backend and frontend together
- `npm run dev` - Start frontend only
- `npm run server:dev` - Start backend only (development mode with nodemon)
- `npm run server` - Start backend only (production mode)
- `npm run install:all` - Install all dependencies
- `npm run setup:db` - Setup database

From **server directory**:
- `npm start` - Start backend (production mode - uses `node`)
- `npm run dev` - Start backend (development mode - uses `nodemon`)

---

## ⚠️ Common Issues

### Port Already in Use
If port 3001 or 5173 is already in use:
```powershell
# Find process using port 3001
Get-NetTCPConnection -LocalPort 3001

# Find process using port 5173
Get-NetTCPConnection -LocalPort 5173
```

### Database Connection Failed
- Ensure XAMPP MySQL is running
- Check `server/.env` has correct database credentials

### Module Not Found
- Run `npm run install:all` from project root
- Or manually: `npm install` in root, then `cd server && npm install`

---

## 🎯 What Each Command Does

- **`npm start`** (root): Uses `concurrently` to run both `npm run server:dev` and `npm run dev` at the same time
- **`npm run server:dev`** (root): Changes to `server` directory and runs `npm run dev` (which uses nodemon)
- **`npm run dev`** (root): Runs Vite dev server for frontend
- **`npm run dev`** (server): Runs nodemon to watch and restart backend on file changes
- **`npm start`** (server): Runs node directly (no auto-reload)


