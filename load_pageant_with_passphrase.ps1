# Load SSH key into Pageant with passphrase
# This allows automatic authentication without entering passphrase each time

$ErrorActionPreference = "Continue"

# Pageant path
$pageantPath = "C:\Program Files\PuTTY\pageant.exe"

# Check if Pageant is installed
if (-not (Test-Path $pageantPath)) {
    Write-Host "`n❌ Pageant not found at: $pageantPath" -ForegroundColor Red
    Write-Host "   Please install PuTTY or update the path" -ForegroundColor Yellow
    exit 1
}

# Load config to get key path
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "`n❌ Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$keyPath = $config.ssh.keyPath
$passphrase = $config.ssh.password

if (-not (Test-Path $keyPath)) {
    Write-Host "`n❌ SSH key not found: $keyPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔐 Loading SSH Key into Pageant..." -ForegroundColor Cyan
Write-Host "   Key: $keyPath" -ForegroundColor Gray
Write-Host "   Passphrase: [hidden]" -ForegroundColor Gray

# Check if Pageant is already running
$pageantProcess = Get-Process -Name "pageant" -ErrorAction SilentlyContinue

if ($pageantProcess) {
    Write-Host "`n✅ Pageant is already running" -ForegroundColor Green
} else {
    Write-Host "`n🚀 Starting Pageant..." -ForegroundColor Yellow
    Start-Process -FilePath $pageantPath -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Pageant started" -ForegroundColor Green
}

# Load key with passphrase using echo
Write-Host "`n📤 Loading key into Pageant..." -ForegroundColor Yellow

# Use echo to pipe passphrase to pageant
$passphrase | & $pageantPath "$keyPath" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Key loaded successfully!" -ForegroundColor Green
} else {
    # Try alternative method using Start-Process with -ArgumentList
    Write-Host "   ⚠️  Trying alternative method..." -ForegroundColor Yellow
    
    # Create a temporary script to load the key
    $tempScript = "$env:TEMP\load_key.ps1"
    @"
`$passphrase = '$passphrase'
`$keyPath = '$keyPath'
`$pageantPath = '$pageantPath'

# Load key using pageant command line
`$process = Start-Process -FilePath `$pageantPath -ArgumentList "`"`$keyPath`"" -NoNewWindow -PassThru -Wait
"@ | Out-File -FilePath $tempScript -Encoding UTF8

    & $tempScript
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 1
}

# Verify key is loaded
Write-Host "`n🔍 Verifying key is loaded..." -ForegroundColor Cyan
Start-Sleep -Seconds 1

Write-Host "`n✅ Pageant setup complete!" -ForegroundColor Green
Write-Host "`n💡 The key is now loaded in Pageant." -ForegroundColor Cyan
Write-Host "   You won't need to enter the passphrase for SSH/SCP operations." -ForegroundColor Gray
Write-Host "`n📋 To verify, check Pageant system tray icon (should show loaded keys)" -ForegroundColor Gray

