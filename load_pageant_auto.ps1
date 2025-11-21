# Auto-load SSH key into Pageant with passphrase from config
# Simplified version that works with PuTTY Pageant

$ErrorActionPreference = "Continue"

# Pageant path
$pageantPath = "C:\Program Files\PuTTY\pageant.exe"

if (-not (Test-Path $pageantPath)) {
    Write-Host "`n❌ Pageant not found. Please install PuTTY." -ForegroundColor Red
    exit 1
}

# Load config
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

# Start Pageant if not running
$pageantProcess = Get-Process -Name "pageant" -ErrorAction SilentlyContinue
if (-not $pageantProcess) {
    Write-Host "   Starting Pageant..." -ForegroundColor Yellow
    Start-Process -FilePath $pageantPath -WindowStyle Minimized
    Start-Sleep -Seconds 2
}

# Load key using pageant.exe with passphrase
# Note: Pageant GUI will prompt for passphrase, but we can automate it
Write-Host "   Loading key: $keyPath" -ForegroundColor Gray

# Method 1: Try using pageant.exe directly (may prompt for passphrase)
$result = Start-Process -FilePath $pageantPath -ArgumentList "`"$keyPath`"" -Wait -PassThru -NoNewWindow 2>&1

# Method 2: If that doesn't work, use a helper script
if ($LASTEXITCODE -ne 0) {
    # Create a VBScript to send passphrase to Pageant window
    $vbsScript = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "`"$pageantPath`" `"$keyPath`"", 1, False
WScript.Sleep 1000
WshShell.SendKeys "$passphrase"
WshShell.SendKeys "{ENTER}"
"@
    
    $vbsPath = "$env:TEMP\pageant_load.vbs"
    $vbsScript | Out-File -FilePath $vbsPath -Encoding ASCII
    & cscript.exe //nologo $vbsPath
    Remove-Item $vbsPath -ErrorAction SilentlyContinue
}

Write-Host "   ✅ Key loading initiated" -ForegroundColor Green
Write-Host "`n💡 If prompted, enter passphrase: $passphrase" -ForegroundColor Yellow
Write-Host "   (This should only happen once per session)" -ForegroundColor Gray
