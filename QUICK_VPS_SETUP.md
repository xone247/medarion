# ⚡ Quick VPS Setup - Install Node.js

Your VPS: **server1.medarion.africa (66.29.131.252)**

## 🎯 Fastest Method: Use cPanel

**You have cPanel installed!** Use it - it's the easiest:

1. **Log into cPanel**: https://66.29.131.252:2083/cpsess0590300498/
2. **Go to**: Software → Node.js Selector
3. **Click**: "Install Node.js Version"
4. **Select**: 18.x
5. **Click**: "Install"

**Done!** Node.js is installed.

## 🔧 Alternative: VNC Console

If you want to use VNC:

1. **In VPS panel**, click **"VNC"**
2. **Login**: root / Neorage94
3. **Paste this**:

```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && yum install -y nodejs && node --version
```

## 🔧 Alternative: SSH

```powershell
ssh root@66.29.131.252
# Password: Neorage94

curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && yum install -y nodejs
```

## ✅ After Installation

Continue with your application setup:
- See `START_HERE_FINAL.md` for next steps

---

**Recommendation**: Use **cPanel Node.js Selector** - it's the easiest! 🚀

