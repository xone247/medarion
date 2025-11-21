# cPanel Access Information

## 🔗 Your cPanel Access URL

**Direct Access URL:**
```
http://66.29.131.252:2087/cpsess3229491970/
```

**Note:** This URL includes a session ID that may expire. Use the standard access method below for permanent access.

## 🌐 Standard cPanel Access

**Primary Access:**
- **URL**: https://medarion.africa:2083
- **Username**: medasnnc (or your cPanel username)
- **Password**: Neorage94

**Alternative Access:**
- **IP**: http://66.29.131.252:2083
- **Username**: medasnnc
- **Password**: Neorage94

## 🔐 WHM Access (Root)

**WHM URL:**
- **URL**: https://medarion.africa:2087
- **IP**: http://66.29.131.252:2087
- **Username**: root
- **Password**: Neorage94

## 📋 Quick Access Links

### For Node.js Setup:
1. **cPanel**: https://medarion.africa:2083
2. **Navigate to**: Software → Node.js Selector
3. **Create Application** with these settings:
   - Application Root: `/home/medasnnc/nodevenv/medarion/18/bin`
   - Application URL: `/medarion-api`
   - Startup File: `server.js`
   - Port: `3001`

### For File Management:
1. **cPanel**: https://medarion.africa:2083
2. **Navigate to**: Files → File Manager
3. **Upload files** to:
   - Frontend: `public_html/`
   - API: `public_html/api/`
   - Config: `public_html/config/`

### For Database:
1. **cPanel**: https://medarion.africa:2083
2. **Navigate to**: Databases → MySQL Databases
3. **Database**: medasnnc_medarion
4. **User**: medasnnc_medarion
5. **Password**: Neorage94

## 🚀 Next Steps

Now that you have cPanel access, you can:

1. **Install Node.js** (if not done via SSH):
   - Go to: Software → Node.js Selector
   - Click "Install Node.js Version"
   - Select Node.js 18.x

2. **Create Node.js Application**:
   - Go to: Software → Node.js Selector
   - Click "Create Application"
   - Use settings from `COMPLETE_MANUAL_SETUP.md`

3. **Upload Files** (if not done via SSH):
   - Use File Manager or FTP
   - Upload `cpanel-nodejs-app/` to `/home/medasnnc/nodevenv/medarion/18/bin`
   - Upload `medarion-dist/` to `public_html/`

## 📝 Important Notes

- **Session URLs** (like the one you provided) expire after a period of inactivity
- **Use standard URLs** (medarion.africa:2083) for permanent access
- **Port 2083** = cPanel (regular user)
- **Port 2087** = WHM (root/admin)
- **Port 2086** = Webmail

## 🔒 Security

- Keep your cPanel credentials secure
- Don't share session URLs publicly
- Use HTTPS when possible
- Change default ports if needed

---

**Ready to continue setup?** Use the access information above to complete the Node.js application setup in cPanel!

