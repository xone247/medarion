# Medarion - Quick Reference Card

**For detailed information, see `WORKING_ENVIRONMENT.md`**

---

## 🔐 SSH Connection (Quick Setup)

### After PC Restart:
1. **Start Pageant:**
   - Open Pageant from Start Menu
   - Right-click system tray icon → "Add Key"
   - Select: `C:\Users\xone\.ssh\medarionput.ppk`
   - Enter passphrase if prompted (once per session)

2. **Verify Connection:**
   ```powershell
   $config = Get-Content "cpanel-config.json" | ConvertFrom-Json
   & "C:\Program Files\PuTTY\plink.exe" -P 22 -batch "root@server1.medarion.africa" "echo 'Connected'"
   ```

### SSH Details:
- **Host:** `server1.medarion.africa`
- **User:** `root`
- **Port:** `22`
- **Key:** `C:\Users\xone\.ssh\medarionput.ppk`
- **Password:** `RgIyt5SEkc4E]nmp` (fallback)

---

## 🚀 Quick Deploy Commands

### Frontend + Backend Deployment:
```powershell
# Build
npm run build

# Deploy (run from project root)
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$pscp = "C:\Program Files\PuTTY\pscp.exe"
$plink = "C:\Program Files\PuTTY\plink.exe"
$host = $config.ssh.host
$user = $config.ssh.username
$port = $config.ssh.port

# Upload frontend
& $pscp -P $port -r "medarion-dist\*" "${user}@${host}:/home/medasnnc/public_html/"

# Upload backend routes
& $pscp -P $port "server/routes/admin.js" "${user}@${host}:/home/medasnnc/api.medarion.africa/routes/admin.js"
& $pscp -P $port "server/routes/blog.js" "${user}@${host}:/home/medasnnc/api.medarion.africa/routes/blog.js"
& $pscp -P $port "server/routes/notifications.js" "${user}@${host}:/home/medasnnc/api.medarion.africa/routes/notifications.js"

# Restart backend
& $plink -P $port -batch "${user}@${host}" "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend"
```

---

## 🖥️ Server Paths

- **Frontend:** `/home/medasnnc/public_html/`
- **Backend:** `/home/medasnnc/api.medarion.africa/`
- **PM2:** `/opt/cpanel/ea-nodejs22/bin/pm2`

---

## 📝 Pageant Passphrase FAQ

**Q: Do I need to add passphrase to Pageant?**  
A: No. Pageant doesn't use passphrases. Your `.ppk` file may have a passphrase, which you'll enter once when loading the key in Pageant.

**Q: When do I enter the passphrase?**  
A: Only when you first load the key in Pageant. After that, Pageant handles authentication automatically.

**Q: What if I restart my PC?**  
A: You'll need to start Pageant again and reload your key (enter passphrase once).

---

## ✅ Verification Checklist

After restarting PC:
- [ ] Pageant is running
- [ ] SSH key loaded in Pageant
- [ ] Can connect via PLINK
- [ ] Backend server running (check PM2 status)
- [ ] Frontend accessible at https://medarion.africa

---

**Full Documentation:** See `WORKING_ENVIRONMENT.md` for complete details.


