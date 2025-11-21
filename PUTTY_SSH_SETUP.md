# PuTTY SSH Setup Guide

This guide helps you configure PuTTY SSH access so commands can be run directly from PowerShell.

## 🎯 Overview

Once configured, you'll be able to:
- ✅ Run commands on the server directly from PowerShell
- ✅ Execute deployment scripts automatically
- ✅ Install Node.js and dependencies remotely
- ✅ Manage files and directories

## 📋 Prerequisites

1. **PuTTY installed** (or native SSH available)
2. **SSH access to root** (already arranged via PuTTY)
3. **Connection details** (host, username, port, key/password)

## 🚀 Quick Setup

### Step 1: Run Setup Script

```powershell
.\setup_putty_ssh.ps1
```

This will prompt you for:
- SSH Host (e.g., medarion.africa or 66.29.131.252)
- SSH Username (e.g., root)
- SSH Port (default: 22)
- Authentication method (key or password)
- Key file path (if using key) or password

### Step 2: Test Connection

The setup script will automatically test the connection.

### Step 3: Use SSH Commands

Once configured, you can run:

```powershell
# Run any command
.\run_ssh_command.ps1 "node --version"

# Install Node.js
.\run_ssh_command.ps1 "curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && yum install -y nodejs"

# Check status
.\run_ssh_command.ps1 "whoami && hostname && pwd"
```

## 🔧 Manual Configuration

If you prefer to configure manually, edit `cpanel-config.json`:

```json
{
  "ssh": {
    "host": "medarion.africa",
    "username": "root",
    "port": 22,
    "usePlink": true,
    "plinkPath": "C:\\Program Files\\PuTTY\\plink.exe",
    "useKey": true,
    "keyPath": "C:\\Users\\YourName\\Documents\\key.ppk",
    "password": null,
    "description": "PuTTY SSH access"
  }
}
```

## 🔐 Authentication Methods

### Method 1: PuTTY Private Key (.ppk file)

1. **Export key from PuTTY**:
   - In PuTTY, go to Connection → SSH → Auth
   - Click "Browse" and select your key
   - Or use PuTTYgen to convert OpenSSH key to .ppk

2. **Provide path to .ppk file** during setup

### Method 2: Password

1. **Enter password** during setup
2. **Password will be stored** in config (encrypted in memory)
3. **Note**: For security, consider using keys instead

## 🛠️ Available Tools

### PuTTY Tools:
- **plink.exe** - Command-line SSH client
- **pscp.exe** - Secure file copy
- **Location**: Usually in `C:\Program Files\PuTTY\`

### Native SSH:
- **ssh.exe** - OpenSSH client (Windows 10+)
- **scp.exe** - Secure copy

## 📝 Usage Examples

### Run Single Command

```powershell
.\run_ssh_command.ps1 "ls -la /home/medasnnc"
```

### Install Node.js

```powershell
.\run_ssh_command.ps1 "curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && yum install -y nodejs"
```

### Create Directory

```powershell
.\run_ssh_command.ps1 "mkdir -p /home/medasnnc/nodevenv/medarion/18/bin"
```

### Install Dependencies

```powershell
.\run_ssh_command.ps1 "cd /home/medasnnc/nodevenv/medarion/18/bin && npm install"
```

### Check Node.js Version

```powershell
.\run_ssh_command.ps1 "node --version && npm --version"
```

## 🔒 Security Notes

- ⚠️ **Passwords in config**: Stored in plain text (consider using keys)
- ✅ **Keys are safer**: Use .ppk key files when possible
- ✅ **Config file**: Already in `.gitignore` (won't be committed)

## 🐛 Troubleshooting

### "plink not found"
- Install PuTTY: https://www.putty.org/
- Or use native SSH (Windows 10+)

### "Permission denied"
- Verify key file path is correct
- Check key permissions
- Ensure key is authorized on server

### "Connection refused"
- Check SSH port (usually 22)
- Verify host is correct
- Check firewall settings

## ✅ After Setup

Once configured, you can:

1. **Run commands directly**: `.\run_ssh_command.ps1 "command"`
2. **Deploy via scripts**: `.\deploy_via_putty.ps1`
3. **Automate installations**: All setup scripts will use SSH

---

**Ready to set up?** Run: `.\setup_putty_ssh.ps1`

