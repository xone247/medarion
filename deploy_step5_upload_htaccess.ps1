# Step 5: Upload .htaccess Configuration
# This script uploads the Apache .htaccess file for API proxying

$ErrorActionPreference = "Continue"

# Import state management
. .\deploy_state.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Step 5: Upload .htaccess                                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" -Raw | ConvertFrom-Json
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$plinkPath = $config.ssh.plinkPath
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$password = $config.ssh.password
$publicHtml = "/home/medasnnc/public_html"

# Function to upload file
function Upload-File-Auto {
    param([string]$Local, [string]$Remote)
    if (-not (Test-Path $Local)) {
        return $false
    }
    echo $password | & $pscpPath -P $sshPort -pw $password "$Local" "$sshUser@${sshHost}:${Remote}" 2>&1 | Out-Null
    return ($LASTEXITCODE -eq 0)
}

# Function to run SSH command
function Run-SSH-Auto {
    param([string]$Cmd)
    $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Cmd 2>&1
    if ($LASTEXITCODE -eq 0 -and $result -notlike "*FATAL ERROR*") {
        return $result
    }
    return $null
}

# Check if .htaccess already exists on server
Write-Host "🔍 Checking existing .htaccess on server..." -ForegroundColor Yellow
$existingCheck = Run-SSH-Auto "test -f $publicHtml/.htaccess && echo 'EXISTS' || echo 'NOT_EXISTS'"
if ($existingCheck -like "*EXISTS*") {
    Write-Host "   ℹ️  .htaccess already exists on server" -ForegroundColor Gray
    $response = Read-Host "   Overwrite .htaccess? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "   ⏭️  Skipping .htaccess upload" -ForegroundColor Gray
        exit 0
    }
}
Write-Host ""

# Check if .htaccess exists locally
if (Test-Path ".htaccess") {
    Write-Host "📄 Using existing .htaccess file..." -ForegroundColor Yellow
    $htaccessFile = ".htaccess"
} else {
    Write-Host "📝 Creating .htaccess file..." -ForegroundColor Yellow
    
    # Create production .htaccess
    $htaccessContent = @'
# Medarion Platform - Apache Configuration for cPanel

# Enable Rewrite Engine
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Proxy API requests to Node.js backend
    RewriteCond %{REQUEST_URI} ^/api/(.*)$
    RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

    # Handle React Router - redirect all requests to index.html except for existing files
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>

# Enable proxy modules
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3001/api/
    ProxyPassReverse /api/ http://localhost:3001/api/
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# PHP Configuration
<IfModule mod_php7.c>
    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value max_execution_time 300
    php_value max_input_time 300
    php_value memory_limit 256M
</IfModule>

# Enable Gzip Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/json "access plus 0 seconds"
</IfModule>

# Prevent directory listing
Options -Indexes

# Protect sensitive files
<FilesMatch "\.(env|log|json|md)$">
    Order allow,deny
    Deny from all
</FilesMatch>
'@
    
    $htaccessFile = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $htaccessFile -Value $htaccessContent -NoNewline
    Write-Host "   ✅ .htaccess created" -ForegroundColor Green
}

Write-Host ""
Write-Host "📤 Uploading .htaccess..." -ForegroundColor Yellow

$htaccessRemote = "${publicHtml}/.htaccess"
if (Upload-File-Auto $htaccessFile $htaccessRemote) {
    Write-Host "   ✅ .htaccess uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload .htaccess" -ForegroundColor Red
    if ($htaccessFile -ne ".htaccess") {
        Remove-Item $htaccessFile -ErrorAction SilentlyContinue
    }
    exit 1
}

# Clean up temp file if we created it
if ($htaccessFile -ne ".htaccess") {
    Remove-Item $htaccessFile -ErrorAction SilentlyContinue
}

# Verify upload
Write-Host ""
Write-Host "🔍 Verifying upload..." -ForegroundColor Yellow
$verify = Run-SSH-Auto "test -f $htaccessRemote && echo 'EXISTS' || echo 'MISSING'"
if ($verify -like "*EXISTS*") {
    Write-Host "   ✅ .htaccess verified on server" -ForegroundColor Green
    
    # Check if it contains proxy configuration
    $proxyCheck = Run-SSH-Auto "grep -q 'ProxyPass.*3001' $htaccessRemote && echo 'HAS_PROXY' || echo 'NO_PROXY'"
    if ($proxyCheck -like "*HAS_PROXY*") {
        Write-Host "   ✅ Proxy configuration found" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Proxy configuration may be missing" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .htaccess not found on server!" -ForegroundColor Red
    exit 1
}

# Check Apache modules
Write-Host ""
Write-Host "🔍 Checking Apache modules..." -ForegroundColor Yellow

$modulesToCheck = @(
    @{ Name = "mod_rewrite"; Required = $true },
    @{ Name = "mod_proxy"; Required = $true },
    @{ Name = "mod_proxy_http"; Required = $true },
    @{ Name = "mod_headers"; Required = $false },
    @{ Name = "mod_deflate"; Required = $false },
    @{ Name = "mod_expires"; Required = $false }
)

$missingRequired = @()
$missingOptional = @()

foreach ($module in $modulesToCheck) {
    # Try different methods to check modules
    $checkCmd = "apache2ctl -M 2>/dev/null | grep -q '$($module.Name)' || httpd -M 2>/dev/null | grep -q '$($module.Name)' || apachectl -M 2>/dev/null | grep -q '$($module.Name)' && echo 'ENABLED' || echo 'DISABLED'"
    $moduleCheck = Run-SSH-Auto $checkCmd
    
    if ($moduleCheck -like "*ENABLED*") {
        Write-Host "   ✅ $($module.Name) is enabled" -ForegroundColor Green
    } else {
        if ($module.Required) {
            Write-Host "   ❌ $($module.Name) is NOT enabled (REQUIRED)" -ForegroundColor Red
            $missingRequired += $module.Name
        } else {
            Write-Host "   ⚠️  $($module.Name) is NOT enabled (optional)" -ForegroundColor Yellow
            $missingOptional += $module.Name
        }
    }
}

if ($missingRequired.Count -gt 0) {
    Write-Host ""
    Write-Host "   ⚠️  WARNING: Required Apache modules are missing!" -ForegroundColor Red
    Write-Host "      Missing: $($missingRequired -join ', ')" -ForegroundColor Red
    Write-Host "      The application may not work correctly." -ForegroundColor Yellow
    Write-Host "      Contact your hosting provider to enable these modules." -ForegroundColor Cyan
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
} else {
    Write-Host "   ✅ All required Apache modules are enabled" -ForegroundColor Green
}

if ($missingOptional.Count -gt 0) {
    Write-Host "   ℹ️  Optional modules missing: $($missingOptional -join ', ')" -ForegroundColor Gray
}

# Update state
Update-StepStatus "step5_upload_htaccess" "completed"

Write-Host ""
Write-Host "✅ Step 5 Complete: .htaccess uploaded successfully" -ForegroundColor Green
Write-Host ""

