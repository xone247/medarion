# Update Vast.ai Tunnel Configuration
# Use this script to update the tunnel with new Vast.ai connection details

param(
    [string]$VastIP = "",
    [string]$VastPort = "",
    [string]$RemotePort = "3001"
)

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$sshHost = $config.ssh.host
$sshPort = $config.ssh.port
$sshUser = $config.ssh.username
$sshPassword = "RgIyt5SEkc4E]nmp"
$plinkPath = $config.ssh.plinkPath

Write-Host "🔧 Update Vast.ai Tunnel Configuration" -ForegroundColor Cyan
Write-Host ""

# Get current values or prompt
if (-not $VastIP) {
    Write-Host "Current Vast.ai IP: 194.228.55.129" -ForegroundColor Gray
    $VastIP = Read-Host "Enter new Vast.ai IP (or press Enter to keep current)"
    if (-not $VastIP) { $VastIP = "194.228.55.129" }
}

if (-not $VastPort) {
    Write-Host "Current SSH Port: 38506" -ForegroundColor Gray
    $VastPort = Read-Host "Enter new SSH port (or press Enter to keep current)"
    if (-not $VastPort) { $VastPort = "38506" }
}

Write-Host ""
Write-Host "📋 New Configuration:" -ForegroundColor Yellow
Write-Host "   Vast.ai IP: $VastIP" -ForegroundColor White
Write-Host "   SSH Port: $VastPort" -ForegroundColor White
Write-Host "   Remote Port: $RemotePort" -ForegroundColor White
Write-Host "   Local Port: 8081" -ForegroundColor White
Write-Host ""

# Test connection first
Write-Host "🔍 Testing SSH Connection..." -ForegroundColor Cyan
$testCmd = "ssh -i /root/.ssh/vast_ai_key -p $VastPort -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@${VastIP} 'echo Connection successful' 2>&1"
$testResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $testCmd 2>&1

if ($testResult -match "Connection successful") {
    Write-Host "✅ SSH connection successful!" -ForegroundColor Green
} else {
    Write-Host "❌ SSH connection failed: $testResult" -ForegroundColor Red
    Write-Host "   Please verify the IP and port are correct" -ForegroundColor Yellow
    exit 1
}

# Update tunnel script
Write-Host "`n📝 Updating tunnel configuration..." -ForegroundColor Cyan
$updateCmd = @"
cat > /usr/local/bin/vast-ai-tunnel.sh << 'TUNNELEOF'
#!/bin/bash
SSH_KEY="/root/.ssh/vast_ai_key"
VAST_IP="$VastIP"
VAST_PORT="$VastPort"
LOCAL_PORT="8081"
REMOTE_PORT="$RemotePort"

if lsof -Pi :\${LOCAL_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    kill -9 \$(lsof -t -i:\${LOCAL_PORT}) 2>/dev/null || true
    sleep 2
fi

ssh -i "\$SSH_KEY" \
    -p \$VAST_PORT \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -N -L \${LOCAL_PORT}:localhost:\${REMOTE_PORT} \
    root@\${VAST_IP} &

TUNNEL_PID=\$!
echo \$TUNNEL_PID > /var/run/vast-ai-tunnel.pid
sleep 2

if ps -p \$TUNNEL_PID > /dev/null; then
    echo "✅ Vast.ai tunnel started (PID: \$TUNNEL_PID)"
    echo "   Local: localhost:\${LOCAL_PORT} → Remote: \${VAST_IP}:\${REMOTE_PORT}"
else
    echo "❌ Failed to start tunnel"
    exit 1
fi
TUNNELEOF
chmod +x /usr/local/bin/vast-ai-tunnel.sh
systemctl daemon-reload
systemctl restart vast-ai-tunnel.service
"@

$updateResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $updateCmd 2>&1

Write-Host "✅ Tunnel configuration updated!" -ForegroundColor Green
Write-Host ""

# Verify
Start-Sleep -Seconds 5
Write-Host "🔍 Verifying tunnel..." -ForegroundColor Cyan
$status = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" "systemctl status vast-ai-tunnel.service --no-pager | head -10" 2>&1
Write-Host $status -ForegroundColor White

$health = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" "curl -s -m 5 http://localhost:8081/health 2>&1" 2>&1
if ($health -match "ok|healthy|status") {
    Write-Host "`n✅ Tunnel is working! AI is accessible!" -ForegroundColor Green
    Write-Host "   Health: $health" -ForegroundColor White
} else {
    Write-Host "`n⚠️  Tunnel started but health check failed" -ForegroundColor Yellow
    Write-Host "   Response: $health" -ForegroundColor Gray
    Write-Host "   Make sure API is running on Vast.ai instance" -ForegroundColor Yellow
}

