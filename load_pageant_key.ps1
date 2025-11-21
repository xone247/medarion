# Quick script to load SSH key into Pageant
# Run this after PC restart to quickly reload your key

Write-Host "`n🔐 Loading SSH Key into Pageant..." -ForegroundColor Cyan

$pageantPath = "C:\Program Files\PuTTY\pageant.exe"
$keyPath = "C:\Users\xone\.ssh\medarionput.ppk"

# Check if Pageant is running
$pageantProcess = Get-Process -Name "pageant" -ErrorAction SilentlyContinue

if (-not $pageantProcess) {
    Write-Host "  Starting Pageant..." -ForegroundColor Yellow
    Start-Process $pageantPath
    Start-Sleep -Seconds 2
}

if (Test-Path $keyPath) {
    Write-Host "  ✅ Found key: $keyPath" -ForegroundColor Green
    Write-Host "  Adding key to Pageant..." -ForegroundColor Yellow
    
    # Add key to Pageant (will prompt for passphrase if needed)
    Start-Process $pageantPath -ArgumentList "`"$keyPath`"" -Wait
    
    Write-Host "`n✅ Key loaded! Testing connection..." -ForegroundColor Green
    Start-Sleep -Seconds 1
    
    # Test connection
    $config = Get-Content "cpanel-config.json" | ConvertFrom-Json
    $plinkPath = "C:\Program Files\PuTTY\plink.exe"
    $result = & $plinkPath -P $config.ssh.port -batch "$($config.ssh.username)@$($config.ssh.host)" "echo 'Connection OK'" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ SSH Connection verified!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Connection test failed - check passphrase" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ Key file not found: $keyPath" -ForegroundColor Red
}

Write-Host "`n💡 Tip: Pin this script to your taskbar for quick access after restart" -ForegroundColor Cyan
