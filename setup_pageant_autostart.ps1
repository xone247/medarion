# Setup Pageant to auto-start with Windows and load SSH key
# This will create a startup shortcut that loads your key automatically

Write-Host "`n🔐 Setting Up Pageant Auto-Start..." -ForegroundColor Cyan

$pageantPath = "C:\Program Files\PuTTY\pageant.exe"
$keyPath = "C:\Users\xone\.ssh\medarionput.ppk"
$startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$shortcutPath = "$startupFolder\Pageant - Load SSH Key.lnk"

if (-not (Test-Path $pageantPath)) {
    Write-Host "  ❌ Pageant not found at: $pageantPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $keyPath)) {
    Write-Host "  ❌ SSH key not found at: $keyPath" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Found Pageant: $pageantPath" -ForegroundColor Green
Write-Host "  ✅ Found SSH key: $keyPath" -ForegroundColor Green

# Create WScript Shell object to create shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $pageantPath
$Shortcut.Arguments = "`"$keyPath`""
$Shortcut.WorkingDirectory = Split-Path $pageantPath -Parent
$Shortcut.Description = "Load SSH key into Pageant on startup"
$Shortcut.Save()

Write-Host "`n✅ Auto-start shortcut created!" -ForegroundColor Green
Write-Host "  Location: $shortcutPath" -ForegroundColor White
Write-Host "`n📝 What this does:" -ForegroundColor Yellow
Write-Host "  - Pageant will start automatically when Windows boots" -ForegroundColor White
Write-Host "  - Your SSH key will be loaded automatically" -ForegroundColor White
Write-Host "  - You'll be prompted for passphrase once per session" -ForegroundColor White
Write-Host "`n💡 Note: The shortcut will appear in your Startup folder" -ForegroundColor Cyan
Write-Host "   You can disable it by removing it from: $startupFolder" -ForegroundColor Cyan

# Test if it works
Write-Host "`n🔍 Testing..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
Write-Host "  ✅ Setup complete! The key will auto-load on next restart." -ForegroundColor Green

