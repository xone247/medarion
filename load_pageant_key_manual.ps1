# Manually Load SSH Key into Pageant with Passphrase
# This script opens Pageant and loads the key, prompting for passphrase

$ErrorActionPreference = "Continue"

# Load config
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "`n❌ Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$keyPath = $config.ssh.keyPath
$passphrase = $config.ssh.password
$pageantPath = "C:\Program Files\PuTTY\pageant.exe"

if (-not (Test-Path $keyPath)) {
    Write-Host "`n❌ SSH key not found: $keyPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $pageantPath)) {
    Write-Host "`n❌ Pageant not found at: $pageantPath" -ForegroundColor Red
    Write-Host "   Please install PuTTY or update the path" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🔐 Loading SSH Key into Pageant" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "`n📋 Key Information:" -ForegroundColor Yellow
Write-Host "   Key: $keyPath" -ForegroundColor White
Write-Host "   Passphrase: $passphrase" -ForegroundColor White
Write-Host ""

# Check if Pageant is running
$pageantProcess = Get-Process -Name "pageant" -ErrorAction SilentlyContinue
if ($pageantProcess) {
    Write-Host "✅ Pageant is already running" -ForegroundColor Green
} else {
    Write-Host "🚀 Starting Pageant..." -ForegroundColor Yellow
    Start-Process -FilePath $pageantPath -WindowStyle Normal
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Pageant started" -ForegroundColor Green
}

# Load key - this will open Pageant window and prompt for passphrase
Write-Host "`n📤 Loading key into Pageant..." -ForegroundColor Yellow
Write-Host "   A Pageant window will appear - enter the passphrase when prompted" -ForegroundColor Cyan
Write-Host "   Passphrase: $passphrase" -ForegroundColor Yellow
Write-Host ""

# Use Start-Process to open Pageant with the key
# This will show the Pageant window where user can enter passphrase
Start-Process -FilePath $pageantPath -ArgumentList "`"$keyPath`"" -WindowStyle Normal

Write-Host "⏳ Waiting for you to enter passphrase in Pageant window..." -ForegroundColor Yellow
Write-Host "   (Enter: $passphrase)" -ForegroundColor Cyan
Write-Host ""

# Wait a bit for user to enter passphrase
Start-Sleep -Seconds 5

Write-Host "✅ Key loading process initiated" -ForegroundColor Green
Write-Host "`n💡 Check Pageant system tray icon:" -ForegroundColor Cyan
Write-Host "   • Right-click Pageant icon → View Keys" -ForegroundColor White
Write-Host "   • Should see: medarionput.ppk" -ForegroundColor White
Write-Host "`n🧪 Testing SSH connection..." -ForegroundColor Yellow

# Test SSH connection
$plinkPath = $config.ssh.plinkPath
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

if (Test-Path $plinkPath) {
    $testResult = & $plinkPath -P $sshPort "${sshUser}@${sshHost}" "whoami" 2>&1
    if ($LASTEXITCODE -eq 0 -and $testResult -notlike "*FATAL*" -and $testResult -notlike "*Access denied*") {
        Write-Host "   ✅ SSH connection successful!" -ForegroundColor Green
        Write-Host "   User: $testResult" -ForegroundColor Gray
        Write-Host "`n🎯 SSH access is ready for deployment!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  SSH connection failed" -ForegroundColor Yellow
        Write-Host "   Error: $($testResult -join ' ')" -ForegroundColor Gray
        Write-Host "`n💡 Make sure you entered the passphrase in Pageant window" -ForegroundColor Cyan
        Write-Host "   Then run this script again to test" -ForegroundColor White
    }
} else {
    Write-Host "   ⚠️  Plink not found: $plinkPath" -ForegroundColor Yellow
}

Write-Host ""

