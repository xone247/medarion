# Deploy Vast.ai SSH Tunnel Setup to cPanel
# This script uploads the tunnel setup script and runs it

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host "`n🔧 Deploying Vast.ai SSH Tunnel to cPanel..." -ForegroundColor Cyan

# Load configuration
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    exit 1
}

$config = Get-Content $ConfigFile | ConvertFrom-Json
# Use SSH host (server1.medarion.africa) for SSH connection
$cpanelHost = $config.ssh.host
$cpanelUser = $config.ssh.username
$sshPassword = $config.ssh.password

Write-Host "`n📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Host: $cpanelHost" -ForegroundColor Gray
Write-Host "   User: $cpanelUser" -ForegroundColor Gray

# Upload tunnel setup script
Write-Host "`n📤 Uploading tunnel setup script..." -ForegroundColor Yellow

$plinkPath = "C:\Program Files\PuTTY\plink.exe"
if (-not (Test-Path $plinkPath)) {
    Write-Host "❌ PuTTY plink not found at: $plinkPath" -ForegroundColor Red
    exit 1
}

# Upload script
$uploadCmd = "echo y | `"$plinkPath`" -ssh -pw `"$sshPassword`" $cpanelUser@$cpanelHost `"cat > /tmp/setup_vast_tunnel.sh`" < setup_vast_tunnel_cpanel.sh"
Write-Host "   Running: plink upload..." -ForegroundColor Gray

try {
    Get-Content "setup_vast_tunnel_cpanel.sh" | & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" "cat > /tmp/setup_vast_tunnel.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Script uploaded successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Upload failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Upload error: $_" -ForegroundColor Red
    exit 1
}

# Make script executable and run it
Write-Host "`n🚀 Running tunnel setup..." -ForegroundColor Yellow

$runCmd = "chmod +x /tmp/setup_vast_tunnel.sh && /tmp/setup_vast_tunnel.sh"

try {
    $output = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $runCmd
    
    Write-Host "`n📋 Output:" -ForegroundColor Cyan
    Write-Host $output
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Tunnel setup completed!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Setup completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n❌ Setup error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify tunnel: curl http://localhost:8081/health" -ForegroundColor White
Write-Host "   2. Update .env: VAST_AI_URL=http://localhost:8081" -ForegroundColor White
Write-Host "   3. Restart Node.js service" -ForegroundColor White

