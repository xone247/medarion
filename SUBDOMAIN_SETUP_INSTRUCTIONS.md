# API Subdomain Setup Instructions

## Issue
The `api.medarion.africa` subdomain is returning 404, even though the Node.js server is running on port 3001.

## Solution

The subdomain needs to be configured in cPanel to point to the correct directory. Follow these steps:

### Step 1: Verify Subdomain Configuration in cPanel

1. Log into cPanel
2. Go to **Subdomains** (under **Domains**)
3. Find `api.medarion.africa`
4. Check the **Document Root** - it should be: `/home/medasnnc/public_html/api`
5. If it's different, edit the subdomain and change the Document Root to `/home/medasnnc/public_html/api`

### Step 2: Verify .htaccess File

The `.htaccess` file should be at `/home/medasnnc/public_html/api/.htaccess` with this content:

```apache
# API Subdomain .htaccess
# Proxy all requests to Node.js backend on port 3001

RewriteEngine On

# Enable proxy module
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Proxy to Node.js backend
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
```

### Step 3: Verify Server is Running

SSH into the server and check:

```bash
ps aux | grep 'node.*server.js'
curl http://localhost:3001/health
```

### Step 4: Test the Subdomain

After configuring, test:
- https://api.medarion.africa/health
- https://api.medarion.africa/api/blog?status=published&limit=1

### Alternative: Use Main Domain with Path

If subdomain configuration is problematic, we can use the main domain with a path:
- Frontend: https://medarion.africa
- Backend API: https://medarion.africa/api/* (via .htaccess in public_html)

This would require updating the frontend's `getApiBaseUrl()` to return `/api` instead of `https://api.medarion.africa`.

