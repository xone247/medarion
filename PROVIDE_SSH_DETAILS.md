# Provide Your PuTTY SSH Details

To configure SSH access, I need the following information:

## 📋 Required Information

### Basic Connection:
1. **SSH Host**: 
   - e.g., `medarion.africa` or `66.29.131.252`

2. **SSH Username**: 
   - e.g., `root` or `medasnnc`

3. **SSH Port**: 
   - Usually `22` (default)

### Authentication (Choose One):

**Option A: PuTTY Key File**
- **Key File Path**: Full path to your `.ppk` file
  - e.g., `C:\Users\YourName\Documents\key.ppk`

**Option B: Password**
- **Password**: Your SSH password

## 🚀 Quick Setup

### Method 1: Interactive Setup

Run:
```powershell
.\configure_putty_ssh.ps1
```

It will prompt you for all details.

### Method 2: Direct Configuration

Run with parameters:
```powershell
# With key file
.\configure_putty_ssh.ps1 -Host "medarion.africa" -User "root" -Port 22 -KeyPath "C:\path\to\key.ppk"

# With password
.\configure_putty_ssh.ps1 -Host "medarion.africa" -User "root" -Port 22 -Password "yourpassword"
```

### Method 3: Manual Edit

Edit `cpanel-config.json` and add:

```json
{
  "ssh": {
    "host": "your-host-here",
    "username": "root",
    "port": 22,
    "usePlink": true,
    "plinkPath": "C:\\Program Files\\PuTTY\\plink.exe",
    "useKey": true,
    "keyPath": "C:\\path\\to\\key.ppk",
    "password": null
  }
}
```

## 🔍 Finding Your PuTTY Key

If you're using PuTTY with a saved session:

1. **Open PuTTY**
2. **Load your session**
3. **Go to**: Connection → SSH → Auth
4. **Check**: "Private key file for authentication"
5. **Copy that path** - that's your key file

Or export from PuTTY:
1. **Open PuTTYgen**
2. **Load** your existing key
3. **Save private key** as .ppk file

## ✅ After Configuration

Once configured, you can:

```powershell
# Test connection
.\run_ssh_command.ps1 "whoami && hostname"

# Install Node.js
.\run_ssh_command.ps1 "curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && yum install -y nodejs"

# Run any command
.\run_ssh_command.ps1 "your command here"
```

## 📝 What I Need From You

Please provide:
1. SSH Host (IP or domain)
2. SSH Username
3. SSH Port (if not 22)
4. Either:
   - Path to .ppk key file, OR
   - Password

Then I'll configure everything for you!

---

**Ready?** Share your SSH details and I'll set it up! 🚀

