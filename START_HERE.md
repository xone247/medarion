# 🚀 START HERE - Deploy Medarion to cPanel

**Everything is configured!** You have two SSH access levels set up.

## 🔐 Your SSH Access Levels

1. **cPanel User (medasnnc)** - For regular deployments ✅
   - User: `medasnnc`
   - Password: `Neorage94`
   - Use for: Regular deployments, file uploads

2. **WHM Root (root)** - For admin tasks ⚠️
   - User: `root`
   - Password: `Neorage94`
   - Use for: Admin tasks, fixing permissions

**Recommendation**: Use **cPanel user** for regular deployments (safer).

## ⚡ Quick Deploy (Copy & Paste)

### 1. Prepare Everything
```powershell
.\setup_complete_cpanel.ps1
```

### 2. Create Node.js App in cPanel
- Log into cPanel: https://medarion.africa:2083
- Go to: **Software** → **Node.js Selector** → **Create Application**
- Settings:
  - Node.js Version: `18.x` or `20.x`
  - Application URL: `/medarion-api`
  - Startup File: `server.js`
  - Port: `3001`
- **Copy the Application Root path** (shown after creation)

### 3. Deploy Everything (Uses cPanel User - Recommended)
```powershell
.\deploy_via_ssh_simple.ps1 -DeployNodeJS -NodeAppPath "/home/medasnnc/nodevenv/medarion/18/bin"
```
*(Replace path with your actual path from Step 2)*

**Password when prompted:** `Neorage94`

This uses the **cPanel user (medasnnc)** - safe for regular deployments.

### 4. Configure Environment Variables
In cPanel Node.js Selector → Your App → Environment Variables:
```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medasnnc_medarion
DB_USER=medasnnc_medarion
DB_PASSWORD=Neorage94
CORS_ORIGIN=https://medarion.africa
JWT_SECRET=[GENERATE_RANDOM]
```

Generate JWT_SECRET:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 5. Start Application
In cPanel Node.js Selector, click **"Start"**

### 6. Test
- Frontend: https://medarion.africa
- API: https://medarion.africa/medarion-api/health

## 🔑 When to Use Root Access

Use root access only for admin tasks:

```powershell
# For admin tasks (fixing permissions, etc.)
.\deploy_via_root_ssh.ps1 -DeployNodeJS -NodeAppPath "/path/to/app"
```

**Use root only when:**
- Fixing file permissions
- System configuration
- Admin tasks
- When cPanel user doesn't have access

## ✅ Your Credentials

**cPanel User (Regular Deployments):**
- SSH: medasnnc@medarion.africa
- Password: Neorage94

**WHM Root (Admin Tasks):**
- SSH: root@medarion.africa
- Password: Neorage94

**Database:**
- Database: medasnnc_medarion
- User: medasnnc_medarion
- Password: Neorage94

## 📚 Documentation

- `SSH_ACCESS_LEVELS.md` - Complete guide on both access levels
- `DEPLOY_NOW.md` - Detailed deployment steps
- `QUICK_DEPLOY.md` - Quick reference

---

**Ready?** Run Step 1 above! 🚀

**Remember**: Use **cPanel user (medasnnc)** for regular deployments. Use **WHM root** only for admin tasks.
