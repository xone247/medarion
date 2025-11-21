# Clean Previous Uploads and Upload Essential Files
# This ensures a clean setup without conflicts

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$sshHost = $config.ssh.host
$sshPort = $config.ssh.port
$sshUser = $config.ssh.username
$sshPassword = "RgIyt5SEkc4E]nmp"
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$plinkPath = $config.ssh.plinkPath
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18/bin"

Write-Host "🧹 Cleaning Previous Uploads..." -ForegroundColor Cyan
Write-Host ""

# Clean all previous files and directories
$cleanCmd = @"
cd $nodeAppPath
rm -rf config middleware routes services server.js package.json .env node_modules 2>/dev/null
mkdir -p config middleware routes services
echo 'Directory cleaned and ready'
"@

$cleanResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $cleanCmd 2>&1

if ($cleanResult -match "cleaned|ready") {
    Write-Host "✅ Previous files deleted" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cleanup completed (some files may not have existed)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📤 Now uploading essential files..." -ForegroundColor Cyan
Write-Host ""

# Now run the upload script
& ".\upload_essential_files.ps1" -SkipTest

