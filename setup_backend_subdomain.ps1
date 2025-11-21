# Setup Backend as Subdomain via SSH
# Moves server out of public_html and configures as subdomain

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Setting Up Backend as Subdomain" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Load configuration
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "`n❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

# Paths
$oldBackendPath = "/home/medasnnc/public_html/server"
$newBackendPath = "/home/medasnnc/server"
$subdomain = "api.medarion.africa"  # or server.medarion.africa

Write-Host "`n📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Old Location: $oldBackendPath" -ForegroundColor White
Write-Host "   New Location: $newBackendPath" -ForegroundColor White
Write-Host "   Subdomain: $subdomain" -ForegroundColor White

# Function to run SSH command
function Run-SSH-Command {
    param([string]$Cmd, [switch]$ShowOutput = $true)
    $result = & $plinkPath -P $sshPort "${sshUser}@${sshHost}" $Cmd 2>&1
    if ($ShowOutput -and $result) {
        Write-Host $result -ForegroundColor Gray
    }
    return $result
}

# ============================================================
# Step 1: Stop Backend Server
# ============================================================
Write-Host "`n[1/6] Stopping Backend Server..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Run-SSH-Command "pkill -f 'node.*server.js' || true" -ShowOutput $false
Start-Sleep -Seconds 2
Write-Host "   ✅ Backend stopped" -ForegroundColor Green

# ============================================================
# Step 2: Create New Backend Directory
# ============================================================
Write-Host "`n[2/6] Creating New Backend Directory..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Run-SSH-Command "mkdir -p $newBackendPath" -ShowOutput $false
Write-Host "   ✅ Created: $newBackendPath" -ForegroundColor Green

# ============================================================
# Step 3: Move Backend Files
# ============================================================
Write-Host "`n[3/6] Moving Backend Files..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   Moving files from $oldBackendPath to $newBackendPath..." -ForegroundColor Gray
Run-SSH-Command "cp -r $oldBackendPath/* $newBackendPath/ 2>/dev/null || true" -ShowOutput $false
Run-SSH-Command "cp -r $oldBackendPath/.* $newBackendPath/ 2>/dev/null || true" -ShowOutput $false

# Verify files were moved
$fileCheck = Run-SSH-Command "test -f $newBackendPath/server.js && echo 'exists' || echo 'missing'" -ShowOutput $false
if ($fileCheck -like "*exists*") {
    Write-Host "   ✅ Files moved successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Files may not have moved - checking..." -ForegroundColor Yellow
    Run-SSH-Command "ls -la $newBackendPath/ | head -10" -ShowOutput $true
}

# ============================================================
# Step 4: Create Subdomain via cPanel API or Manual Setup
# ============================================================
Write-Host "`n[4/6] Setting Up Subdomain..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   Creating subdomain: $subdomain" -ForegroundColor Gray
Write-Host "   This needs to be done via cPanel or WHM API" -ForegroundColor Gray

# Try to create subdomain via cPanel API
$subdomainScript = @"
#!/bin/bash
# Create subdomain via cPanel API
SUBDOMAIN="api"
DOMAIN="medarion.africa"
CPANEL_USER="medasnnc"
CPANEL_PASS="Neorage94"

# Create subdomain directory
mkdir -p /home/medasnnc/public_html/$SUBDOMAIN

# Create .htaccess for subdomain to proxy to Node.js
cat > /home/medasnnc/public_html/$SUBDOMAIN/.htaccess << 'HTACCESS'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3001/\$1 [P,L]
HTACCESS

echo "Subdomain directory created"
"@

# Upload and run subdomain setup script
$tempScript = "$env:TEMP\setup_subdomain.sh"
Set-Content -Path $tempScript -Value $subdomainScript -Encoding UTF8
& $pscpPath -P $sshPort "$tempScript" "${sshUser}@${sshHost}:/tmp/setup_subdomain.sh" 2>&1 | Out-Null
Run-SSH-Command "chmod +x /tmp/setup_subdomain.sh && /tmp/setup_subdomain.sh" -ShowOutput $true

Write-Host "   ⚠️  Subdomain needs to be created in cPanel manually:" -ForegroundColor Yellow
Write-Host "      1. Go to cPanel → Subdomains" -ForegroundColor White
Write-Host "      2. Create subdomain: api" -ForegroundColor White
Write-Host "      3. Document Root: /home/medasnnc/public_html/api" -ForegroundColor White

# ============================================================
# Step 5: Configure .htaccess for Subdomain
# ============================================================
Write-Host "`n[5/6] Configuring Subdomain .htaccess..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$htaccessContent = @"
# Proxy all requests to Node.js backend
RewriteEngine On

# Proxy API requests to Node.js backend on port 3001
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3001/\$1 [P,L]

# Enable proxy module
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyPassReverse / http://localhost:3001/
</IfModule>
"@

$tempHtaccess = "$env:TEMP\subdomain_htaccess.htaccess"
Set-Content -Path $tempHtaccess -Value $htaccessContent -Encoding UTF8

# Upload .htaccess to subdomain directory
$subdomainPath = "/home/medasnnc/public_html/api"
Run-SSH-Command "mkdir -p $subdomainPath" -ShowOutput $false
& $pscpPath -P $sshPort "$tempHtaccess" "${sshUser}@${sshHost}:${subdomainPath}/.htaccess" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ .htaccess configured for subdomain" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .htaccess upload failed - will create manually" -ForegroundColor Yellow
    Run-SSH-Command "cat > $subdomainPath/.htaccess << 'HTEOF'
$htaccessContent
HTEOF" -ShowOutput $false
}

# ============================================================
# Step 6: Start Backend in New Location
# ============================================================
Write-Host "`n[6/6] Starting Backend in New Location..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   Starting backend at: $newBackendPath" -ForegroundColor Gray
Run-SSH-Command "cd $newBackendPath && nohup node server.js > server.log 2>&1 &" -ShowOutput $false
Start-Sleep -Seconds 3

# Verify backend is running
$processCheck = Run-SSH-Command "ps aux | grep 'node.*server.js' | grep -v grep" -ShowOutput $false
if ($processCheck -and $processCheck.Trim() -ne "") {
    Write-Host "   ✅ Backend started successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend may not have started - check logs" -ForegroundColor Yellow
    Run-SSH-Command "cd $newBackendPath && tail -20 server.log 2>/dev/null || echo 'no_logs'" -ShowOutput $true
}

# ============================================================
# Summary
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Backend Subdomain Setup Complete" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Gray

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Create subdomain in cPanel:" -ForegroundColor White
Write-Host "      • Go to: cPanel → Subdomains" -ForegroundColor Gray
Write-Host "      • Subdomain: api" -ForegroundColor Gray
Write-Host "      • Document Root: /home/medasnnc/public_html/api" -ForegroundColor Gray
Write-Host "   2. Update frontend API URL to use subdomain:" -ForegroundColor White
Write-Host "      • Change from '/server' to 'https://api.medarion.africa'" -ForegroundColor Gray
Write-Host "   3. Test: https://api.medarion.africa/health" -ForegroundColor White
Write-Host "   4. Test: https://api.medarion.africa/api/blog" -ForegroundColor White

Write-Host "`n💡 Backend Location:" -ForegroundColor Yellow
Write-Host "   • Files: $newBackendPath" -ForegroundColor White
Write-Host "   • Running on: localhost:3001" -ForegroundColor White
Write-Host "   • Accessible via: https://api.medarion.africa" -ForegroundColor White

Write-Host "`n"

