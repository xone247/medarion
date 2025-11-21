# Install Node.js on Your VPS

Your server: **server1.medarion.africa (66.29.131.252)**
- OS: AlmaLinux 8 cPanel
- You have root access via VPS panel

## 🎯 Best Method: Use cPanel Node.js Selector (Easiest!)

Since you have **cPanel installed**, this is the easiest way:

1. **Log into cPanel**: https://66.29.131.252:2083/cpsess0590300498/
   - Or: https://medarion.africa:2083
   - Username: medasnnc
   - Password: Neorage94

2. **Go to**: Software → Node.js Selector

3. **Click**: "Install Node.js Version"

4. **Select**: Node.js 18.x (or latest LTS)

5. **Click**: "Install"

**That's it!** Node.js will be installed and ready to use.

## 🔧 Alternative: Install via VNC Console

If you want to install directly on the server:

### Step 1: Access VNC Console

1. **In your VPS panel**, click **"VNC"** button
2. **Login** with root credentials:
   - Username: `root`
   - Password: `Neorage94`

### Step 2: Install Node.js

Once in VNC console, run:

```bash
# Update system
yum update -y

# Install Node.js 18 from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Verify for cPanel User

```bash
# Switch to cPanel user
su - medasnnc

# Check Node.js
node --version
npm --version

# Exit back to root
exit
```

## 🔧 Alternative: Install via SSH

If you prefer SSH:

```powershell
# Connect via SSH
ssh root@66.29.131.252
# Password: Neorage94

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Verify
node --version
npm --version
```

## 📊 Your Server Information

- **Hostname**: server1.medarion.africa
- **IP**: 66.29.131.252
- **OS**: AlmaLinux 8 cPanel
- **Disk**: 120 GB (10.74 GB used, 109.26 GB free)
- **Memory**: 6 GB
- **Bandwidth**: 2.93 TB

## ✅ Recommended Approach

**Use cPanel Node.js Selector** because:
- ✅ Easiest method
- ✅ Automatically integrates with cPanel
- ✅ Easy to manage versions
- ✅ Works seamlessly with Node.js Selector applications
- ✅ No command line needed

## 🚀 After Installation

Once Node.js is installed (via any method), continue with:

1. **Upload your application files** (via cPanel File Manager or FTP)
2. **Create Node.js application** in cPanel Node.js Selector
3. **Set environment variables**
4. **Start the application**

See `START_HERE_FINAL.md` for complete setup steps.

## 🔍 Verify Installation

After installation, verify:

```bash
# Check Node.js version
node --version
# Should show: v18.x.x

# Check npm version
npm --version
# Should show: 9.x.x or 10.x.x

# Check for cPanel user
su - medasnnc
node --version
exit
```

## 🐛 Troubleshooting

### If installation fails:

```bash
# Try installing prerequisites first
yum install -y curl

# Then retry Node.js installation
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
```

### If Node.js not found for cPanel user:

```bash
# As root, check PATH
echo $PATH

# Node.js should be in /usr/bin
which node
which npm

# If not, create symlinks
ln -s /usr/bin/node /home/medasnnc/bin/node
ln -s /usr/bin/npm /home/medasnnc/bin/npm
```

## 💡 Quick Decision

**Choose your method:**

1. **cPanel Node.js Selector** ← **RECOMMENDED** (easiest)
2. **VNC Console** (if you want to see the server directly)
3. **SSH** (if you prefer command line)

All methods work, but **cPanel is the easiest** since it's already installed!

---

**Ready?** Log into cPanel and use Node.js Selector to install Node.js 18.x!

