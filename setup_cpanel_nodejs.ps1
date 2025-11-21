# Complete cPanel Node.js Setup Script
# This script prepares everything needed for Node.js deployment on cPanel

param(
    [string]$ConfigFile = "cpanel-config.json",
    [switch]$GenerateOnly = $false
)

Write-Host "🚀 Medarion cPanel Node.js Setup" -ForegroundColor Cyan
Write-Host ""

# Check if config exists
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    Write-Host "   Please run deploy_to_cpanel.ps1 first to create it, or copy cpanel-config.json.example" -ForegroundColor Yellow
    exit 1
}

# Load configuration
try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "❌ Error reading configuration: $_" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Preparing Node.js application files for cPanel..." -ForegroundColor Cyan
Write-Host ""

# Create cPanel Node.js app directory structure
$nodeAppDir = "cpanel-nodejs-app"
if (Test-Path $nodeAppDir) {
    Write-Host "⚠️  Directory $nodeAppDir already exists. Removing..." -ForegroundColor Yellow
    Remove-Item $nodeAppDir -Recurse -Force
}

New-Item -ItemType Directory -Path $nodeAppDir | Out-Null
Write-Host "✅ Created directory: $nodeAppDir" -ForegroundColor Green

# Copy server files
Write-Host "📋 Copying server files..." -ForegroundColor Cyan
Copy-Item -Path "server\*" -Destination $nodeAppDir -Recurse -Exclude "node_modules"
Write-Host "✅ Server files copied" -ForegroundColor Green

# Create production package.json (ensure it's compatible with cPanel)
$packageJson = @{
    name = "medarion-backend"
    version = "1.0.0"
    description = "Medarion Healthcare Platform Backend API"
    main = "server.js"
    type = "module"
    scripts = @{
        start = "node server.js"
    }
    dependencies = @{
        "@aws-sdk/client-s3" = "^3.927.0"
        "@aws-sdk/client-sagemaker-runtime" = "^3.925.0"
        "bcryptjs" = "^2.4.3"
        "cors" = "^2.8.5"
        "dotenv" = "^16.3.1"
        "express" = "^4.18.2"
        "express-rate-limit" = "^7.1.5"
        "helmet" = "^7.1.0"
        "http-proxy-middleware" = "^3.0.5"
        "joi" = "^17.11.0"
        "jsonwebtoken" = "^9.0.2"
        "mysql2" = "^3.6.5"
        "node-fetch" = "^3.3.2"
        "uuid" = "^13.0.0"
    }
    engines = @{
        node = ">=18.0.0"
        npm = ">=9.0.0"
    }
}

$packageJson | ConvertTo-Json -Depth 10 | Out-File "$nodeAppDir\package.json" -Encoding UTF8
Write-Host "✅ Created production package.json" -ForegroundColor Green

# Create .env file for production
$envContent = @"
# Medarion Production Environment Variables
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=${config.database.host}
DB_PORT=${config.database.port}
DB_NAME=${config.database.name}
DB_USER=${config.database.username}
DB_PASSWORD=${config.database.password}

# CORS Configuration
CORS_ORIGIN=https://medarion.africa

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API Keys (if needed)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
"@

$envContent | Out-File "$nodeAppDir\.env" -Encoding UTF8
Write-Host "✅ Created .env file template" -ForegroundColor Green
Write-Host "   ⚠️  Remember to update .env with your actual production values!" -ForegroundColor Yellow

# Create .htaccess for Node.js (if using subdomain or subdirectory)
$htaccessContent = @"
# Node.js Application Configuration
# This file helps route requests to your Node.js app

RewriteEngine On
RewriteBase /

# Proxy requests to Node.js app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
"@

$htaccessContent | Out-File "$nodeAppDir\.htaccess" -Encoding UTF8
Write-Host "✅ Created .htaccess for Node.js routing" -ForegroundColor Green

# Create setup instructions file
$setupInstructions = @"
# cPanel Node.js Setup Instructions

## Step 1: Access Node.js Selector in cPanel

1. Log into your cPanel
2. Go to: Software → Node.js Selector
3. Click "Create Application"

## Step 2: Configure Node.js Application

Fill in the following settings:

- **Node.js Version**: Select the latest available (18.x or higher recommended)
- **Application Mode**: Production
- **Application Root**: /home/username/nodevenv/medarion/18/bin
- **Application URL**: /medarion-api (or your preferred path)
- **Application Startup File**: server.js
- **Application Port**: 3001 (or let cPanel assign one)

## Step 3: Install Dependencies

After creating the app, cPanel will show you the application path.
SSH into your server and run:

```bash
cd /home/username/nodevenv/medarion/18/bin
npm install
```

Or use cPanel's "Run NPM Install" button if available.

## Step 4: Configure Environment Variables

1. In cPanel Node.js Selector, click on your application
2. Go to "Environment Variables" section
3. Add the following variables (from your .env file):
   - NODE_ENV=production
   - PORT=3001
   - DB_HOST=localhost
   - DB_PORT=3306
   - DB_NAME=your_database_name
   - DB_USER=your_database_user
   - DB_PASSWORD=your_database_password
   - CORS_ORIGIN=https://yourdomain.com
   - JWT_SECRET=your-secret-key

## Step 5: Start the Application

1. In Node.js Selector, click "Start" on your application
2. Check the logs to ensure it started successfully
3. Test the API endpoint: https://yourdomain.com/medarion-api/health

## Step 6: Configure Domain/Subdomain (Optional)

If you want to use a subdomain (e.g., api.yourdomain.com):

1. Go to: Domains → Subdomains
2. Create subdomain: api
3. Point it to: /home/username/nodevenv/medarion/18/bin
4. Update CORS_ORIGIN in environment variables

## Troubleshooting

- **Application won't start**: Check logs in Node.js Selector
- **Database connection failed**: Verify database credentials
- **Port already in use**: Change PORT in environment variables
- **Module not found**: Run `npm install` again

## File Structure on cPanel

Your Node.js app should be located at:
/home/username/nodevenv/medarion/[version]/bin/

Upload all files from the 'cpanel-nodejs-app' directory to this location.
"@

$setupInstructions | Out-File "$nodeAppDir\CPANEL_SETUP_INSTRUCTIONS.md" -Encoding UTF8
Write-Host "✅ Created setup instructions" -ForegroundColor Green

# Create a deployment checklist
$checklist = @"
# cPanel Node.js Deployment Checklist

## Pre-Deployment
- [ ] Built frontend: `npm run build`
- [ ] Created cPanel database
- [ ] Created database user and granted permissions
- [ ] Configured cpanel-config.json with credentials

## cPanel Setup
- [ ] Created Node.js application in cPanel Node.js Selector
- [ ] Selected Node.js version 18.x or higher
- [ ] Set application root path
- [ ] Set application URL path
- [ ] Set startup file to: server.js
- [ ] Set port (or let cPanel assign)

## File Upload
- [ ] Uploaded all files from 'cpanel-nodejs-app' directory
- [ ] Uploaded to: /home/username/nodevenv/medarion/[version]/bin/
- [ ] Set correct file permissions (755 for directories, 644 for files)

## Configuration
- [ ] Updated .env file with production database credentials
- [ ] Set environment variables in cPanel Node.js Selector
- [ ] Updated CORS_ORIGIN to your production domain
- [ ] Set JWT_SECRET to a strong random value

## Dependencies
- [ ] Ran `npm install` in the application directory
- [ ] Verified all dependencies installed successfully

## Database
- [ ] Created production database
- [ ] Imported database schema (if needed)
- [ ] Tested database connection

## Testing
- [ ] Started Node.js application in cPanel
- [ ] Checked application logs for errors
- [ ] Tested health endpoint: /health
- [ ] Tested API endpoints
- [ ] Verified CORS is working
- [ ] Tested authentication endpoints

## Frontend Integration
- [ ] Updated frontend API base URL to production
- [ ] Deployed frontend files to public_html
- [ ] Tested full application flow
- [ ] Verified all API calls work from frontend

## Security
- [ ] Changed default JWT_SECRET
- [ ] Verified HTTPS is enabled
- [ ] Checked that sensitive files are not publicly accessible
- [ ] Verified .env file is not in public directory
"@

$checklist | Out-File "$nodeAppDir\DEPLOYMENT_CHECKLIST.md" -Encoding UTF8
Write-Host "✅ Created deployment checklist" -ForegroundColor Green

# Create a quick start script for cPanel (to be run on server)
$quickStartScript = @"
#!/bin/bash
# Quick Start Script for cPanel Node.js App
# Run this in your Node.js application directory on cPanel

echo "🚀 Starting Medarion Node.js Application Setup..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "   Please create .env file with your production configuration"
    exit 1
fi

# Test database connection
echo "🔍 Testing database connection..."
node -e "
import('./config/database.js').then(async (db) => {
    const connected = await db.testConnection();
    if (connected) {
        console.log('✅ Database connection successful');
        process.exit(0);
    } else {
        console.log('❌ Database connection failed');
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
"

if [ $? -eq 0 ]; then
    echo "✅ Setup complete! Start your application in cPanel Node.js Selector"
else
    echo "❌ Setup failed. Check the errors above."
    exit 1
fi
"@

$quickStartScript | Out-File "$nodeAppDir\setup.sh" -Encoding UTF8
Write-Host "✅ Created setup.sh script" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Node.js application prepared!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Files ready in: $nodeAppDir\" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Review: $nodeAppDir\CPANEL_SETUP_INSTRUCTIONS.md" -ForegroundColor White
Write-Host "   2. Follow the checklist: $nodeAppDir\DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
Write-Host "   3. Upload all files from '$nodeAppDir' to your cPanel Node.js app directory" -ForegroundColor White
Write-Host "   4. Configure environment variables in cPanel Node.js Selector" -ForegroundColor White
Write-Host "   5. Run 'npm install' in the application directory" -ForegroundColor White
Write-Host "   6. Start the application in cPanel" -ForegroundColor White
Write-Host ""

if (-not $GenerateOnly) {
    Write-Host "💡 Tip: You can now deploy these files using:" -ForegroundColor Cyan
    Write-Host "   .\deploy_to_cpanel.ps1 -ConfigFile $ConfigFile" -ForegroundColor White
    Write-Host ""
}

