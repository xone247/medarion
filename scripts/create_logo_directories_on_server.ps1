# Create Logo Directories on cPanel Server
# Creates the upload directories for logos on the server

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$ssh = $config.ssh

Write-Host "Creating logo directories on server..." -ForegroundColor Yellow

$plinkPath = $ssh.plinkPath
if (-not (Test-Path $plinkPath)) {
    Write-Host "❌ PLINK not found at: $plinkPath" -ForegroundColor Red
    exit 1
}

$remotePath = "/home/medasnnc/public_html/public/uploads"
$createDirsCmd = "mkdir -p $remotePath/company $remotePath/investor $remotePath/regulatory && chmod -R 755 $remotePath"

if ($ssh.useKey -and $ssh.keyPath) {
    $sshCmd = "& `"$plinkPath`" -P $($ssh.port) -i `"$($ssh.keyPath)`" $($ssh.username)@$($ssh.host) `"$createDirsCmd`""
} else {
    $sshCmd = "echo $($ssh.password) | & `"$plinkPath`" -P $($ssh.port) -pw `"$($ssh.password)`" $($ssh.username)@$($ssh.host) `"$createDirsCmd`""
}

Invoke-Expression $sshCmd | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Logo directories created on server" -ForegroundColor Green
} else {
    Write-Host "⚠️  Directory creation may have failed, but continuing..." -ForegroundColor Yellow
}

