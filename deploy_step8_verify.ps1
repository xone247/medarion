# Step 8: Post-Deployment Verification
# This script verifies that everything is working correctly

$ErrorActionPreference = "Continue"

# Import state management
. .\deploy_state.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Step 8: Post-Deployment Verification                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" -Raw | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$password = $config.ssh.password

# Function to run SSH command
function Run-SSH-Auto {
    param([string]$Cmd)
    $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Cmd 2>&1
    if ($LASTEXITCODE -eq 0 -and $result -notlike "*FATAL ERROR*") {
        return $result
    }
    return $result
}

$allChecksPassed = $true

Write-Host "🔍 Running Verification Checks..." -ForegroundColor Yellow
Write-Host ""

# Check 1: PM2 Status
Write-Host "1️⃣  Checking PM2 Status..." -ForegroundColor Cyan
$pm2Status = Run-SSH-Auto "pm2 list | grep medarion || echo 'NOT_FOUND'"
if ($pm2Status -notlike "*NOT_FOUND*" -and $pm2Status -like "*medarion*") {
    Write-Host "   ✅ PM2 process found" -ForegroundColor Green
    $pm2Status | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
} else {
    Write-Host "   ❌ PM2 process not running" -ForegroundColor Red
    $allChecksPassed = $false
}
Write-Host ""

# Check 2: Application Health
Write-Host "2️⃣  Checking Application Health..." -ForegroundColor Cyan
$healthCheck = Run-SSH-Auto "curl -s http://localhost:3001/api/health 2>/dev/null || echo 'NOT_RESPONDING'"
if ($healthCheck -notlike "*NOT_RESPONDING*" -and $healthCheck -match "healthy|status") {
    Write-Host "   ✅ Application is responding" -ForegroundColor Green
    Write-Host "      $healthCheck" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Application not responding" -ForegroundColor Red
    Write-Host "      Checking logs..." -ForegroundColor Yellow
    $logs = Run-SSH-Auto "pm2 logs medarion --lines 5 --nostream 2>&1 | tail -5"
    $logs | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    $allChecksPassed = $false
}
Write-Host ""

# Check 3: Frontend Files
Write-Host "3️⃣  Checking Frontend Files..." -ForegroundColor Cyan
$indexCheck = Run-SSH-Auto "test -f /home/medasnnc/public_html/index.html && echo 'EXISTS' || echo 'MISSING'"
if ($indexCheck -like "*EXISTS*") {
    Write-Host "   ✅ index.html exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ index.html missing" -ForegroundColor Red
    $allChecksPassed = $false
}

$assetsCheck = Run-SSH-Auto "ls -la /home/medasnnc/public_html/assets 2>/dev/null | wc -l"
if ($assetsCheck -match '\d+' -and [int]$assetsCheck -gt 0) {
    Write-Host "   ✅ Assets directory has files" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Assets directory may be empty" -ForegroundColor Yellow
}
Write-Host ""

# Check 4: Backend Files
Write-Host "4️⃣  Checking Backend Files..." -ForegroundColor Cyan
$serverCheck = Run-SSH-Auto "test -f /home/medasnnc/nodevenv/medarion/18/server/server.js && echo 'EXISTS' || echo 'MISSING'"
if ($serverCheck -like "*EXISTS*") {
    Write-Host "   ✅ server.js exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ server.js missing" -ForegroundColor Red
    $allChecksPassed = $false
}

$packageCheck = Run-SSH-Auto "test -f /home/medasnnc/nodevenv/medarion/18/server/package.json && echo 'EXISTS' || echo 'MISSING'"
if ($packageCheck -like "*EXISTS*") {
    Write-Host "   ✅ package.json exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  package.json missing" -ForegroundColor Yellow
}
Write-Host ""

# Check 5: Database
Write-Host "5️⃣  Checking Database..." -ForegroundColor Cyan
$dbCheck = Run-SSH-Auto "mysql -u $($config.database.username) -p$($config.database.password) $($config.database.name) -e 'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = \"$($config.database.name)\";' 2>/dev/null | tail -1"
if ($dbCheck -match '\d+' -and [int]$dbCheck -gt 0) {
    Write-Host "   ✅ Database has $dbCheck tables" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Could not verify database tables" -ForegroundColor Yellow
}
Write-Host ""

# Check 6: .htaccess
Write-Host "6️⃣  Checking .htaccess..." -ForegroundColor Cyan
$htaccessCheck = Run-SSH-Auto "test -f /home/medasnnc/public_html/.htaccess && echo 'EXISTS' || echo 'MISSING'"
if ($htaccessCheck -like "*EXISTS*") {
    Write-Host "   ✅ .htaccess exists" -ForegroundColor Green
    
    $proxyCheck = Run-SSH-Auto "grep -q 'ProxyPass.*3001' /home/medasnnc/public_html/.htaccess && echo 'HAS_PROXY' || echo 'NO_PROXY'"
    if ($proxyCheck -like "*HAS_PROXY*") {
        Write-Host "   ✅ Proxy configuration found" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Proxy configuration may be missing" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .htaccess missing" -ForegroundColor Red
    $allChecksPassed = $false
}
Write-Host ""

# Check 7: .env File
Write-Host "7️⃣  Checking .env File..." -ForegroundColor Cyan
$envCheck = Run-SSH-Auto "test -f /home/medasnnc/nodevenv/medarion/18/.env && echo 'EXISTS' || echo 'MISSING'"
if ($envCheck -like "*EXISTS*") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env file missing" -ForegroundColor Yellow
}
Write-Host ""

# Check 8: Node.js Version
Write-Host "8️⃣  Checking Node.js Version..." -ForegroundColor Cyan
$nodeVersion = Run-SSH-Auto "node --version 2>/dev/null || echo 'NOT_INSTALLED'"
if ($nodeVersion -notlike "*NOT_INSTALLED*") {
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not installed" -ForegroundColor Red
    $allChecksPassed = $false
}
Write-Host ""

# Check 9: Port Availability
Write-Host "9️⃣  Checking Port 3001..." -ForegroundColor Cyan
$portCheck = Run-SSH-Auto "netstat -tuln 2>/dev/null | grep ':3001' || ss -tuln 2>/dev/null | grep ':3001' || echo 'PORT_FREE'"
if ($portCheck -like "*3001*") {
    Write-Host "   ✅ Port 3001 is in use (application running)" -ForegroundColor Green
    # Check if it's our application
    $portDetails = Run-SSH-Auto "netstat -tulnp 2>/dev/null | grep ':3001' || ss -tulnp 2>/dev/null | grep ':3001' || echo ''"
    if ($portDetails -like "*node*" -or $portDetails -like "*medarion*") {
        Write-Host "      Port is used by Node.js/Medarion" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  Port is used by different process" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Port 3001 not in use (application may not be running)" -ForegroundColor Red
    $allChecksPassed = $false
}
Write-Host ""

# Check 10: Apache Modules
Write-Host "🔟 Checking Apache Modules..." -ForegroundColor Cyan
$modulesToCheck = @(
    @{ Name = "mod_rewrite"; Required = $true },
    @{ Name = "mod_proxy"; Required = $true },
    @{ Name = "mod_proxy_http"; Required = $true }
)

$missingRequired = @()
foreach ($module in $modulesToCheck) {
    $checkCmd = "apache2ctl -M 2>/dev/null | grep -q '$($module.Name)' || httpd -M 2>/dev/null | grep -q '$($module.Name)' || apachectl -M 2>/dev/null | grep -q '$($module.Name)' && echo 'ENABLED' || echo 'DISABLED'"
    $moduleCheck = Run-SSH-Auto $checkCmd
    
    if ($moduleCheck -like "*ENABLED*") {
        Write-Host "   ✅ $($module.Name) is enabled" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($module.Name) is NOT enabled (REQUIRED)" -ForegroundColor Red
        $missingRequired += $module.Name
        $allChecksPassed = $false
    }
}

if ($missingRequired.Count -gt 0) {
    Write-Host "   ⚠️  Required modules missing: $($missingRequired -join ', ')" -ForegroundColor Yellow
    Write-Host "      Contact hosting provider to enable these modules" -ForegroundColor Cyan
}
Write-Host ""

# Check 11: Database Backup
Write-Host "1️⃣1️⃣  Checking for Database Backup..." -ForegroundColor Cyan
$backupCheck = Get-ChildItem "backups" -Filter "medarion_backup_*.sql" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($backupCheck) {
    $backupSize = [math]::Round($backupCheck.Length / 1MB, 2)
    Write-Host "   ✅ Latest backup found: $($backupCheck.Name)" -ForegroundColor Green
    Write-Host "      Size: $backupSize MB" -ForegroundColor Gray
    Write-Host "      Date: $($backupCheck.LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  No database backup found in backups/ directory" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

if ($allChecksPassed) {
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     ALL VERIFICATION CHECKS PASSED!                       ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your application should be working at: https://medarion.africa" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Start Vast.ai tunnel: ssh ${sshUser}@${sshHost} '~/vast_tunnel/start_tunnel.sh'" -ForegroundColor White
    Write-Host "   2. Test website in browser: https://medarion.africa" -ForegroundColor White
    Write-Host "   3. Check PM2 logs: ssh ${sshUser}@${sshHost} 'pm2 logs medarion'" -ForegroundColor White
    Write-Host ""
    
    # Update state
    Update-StepStatus "step8_verify" "completed"
} else {
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║     SOME VERIFICATION CHECKS FAILED                       ║" -ForegroundColor Yellow
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Please review the failed checks above" -ForegroundColor Yellow
    Write-Host "💡 You may need to re-run failed deployment steps" -ForegroundColor Cyan
    Write-Host ""
    
    # Update state
    Update-StepStatus "step8_verify" "failed" "Some verification checks failed"
    exit 1
}

