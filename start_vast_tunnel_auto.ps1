# Start SSH Tunnel to Vast.ai for AI Tools (Auto - No User Input)
# This script automatically creates an SSH tunnel from localhost:8081 to Vast.ai:8081

Write-Host "=== Vast.ai SSH Tunnel (Auto Start) ===" -ForegroundColor Cyan
Write-Host ""

# Configuration - New Instance (27831217)
$VAST_HOST = "ssh1.vast.ai"
$VAST_PORT = 31216
$VAST_IP = "93.91.156.91"
$LOCAL_PORT = 8081  # Use 8081 to avoid conflict with backend on 3001
$REMOTE_PORT = 3001  # API is running on port 3001
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\id_ed25519_vast"

# Check for SSH key
$useKey = Test-Path $SSH_KEY_PATH

# Stop any existing tunnel on the local port
Write-Host "Checking for existing tunnel..." -ForegroundColor Cyan
$existingTunnel = Get-NetTCPConnection -LocalPort $LOCAL_PORT -ErrorAction SilentlyContinue
if ($existingTunnel) {
    Write-Host "   Stopping existing tunnel..." -ForegroundColor Yellow
    $process = Get-Process -Id $existingTunnel.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# Build SSH command
if ($useKey) {
    Write-Host "✅ Using SSH key: $SSH_KEY_PATH" -ForegroundColor Green
    $sshCommand = "ssh -i `"$SSH_KEY_PATH`" -p $VAST_PORT root@${VAST_HOST} -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} -N -o StrictHostKeyChecking=no -o ServerAliveInterval=60"
} else {
    Write-Host "⚠️  No SSH key found. Will use password authentication." -ForegroundColor Yellow
    $sshCommand = "ssh -p $VAST_PORT root@${VAST_HOST} -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} -N -o StrictHostKeyChecking=no -o ServerAliveInterval=60"
}

Write-Host ""
Write-Host "🚀 Starting SSH tunnel..." -ForegroundColor Cyan
Write-Host "   Local:  localhost:$LOCAL_PORT" -ForegroundColor Gray
Write-Host "   Remote: ${VAST_HOST}:${VAST_PORT} -> localhost:${REMOTE_PORT}" -ForegroundColor Gray
Write-Host ""
Write-Host "[IMPORTANT] Keep this window open while using AI tools!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the tunnel when done." -ForegroundColor Yellow
Write-Host ""

# Start the SSH tunnel
try {
    Invoke-Expression $sshCommand
} catch {
    Write-Host "❌ Error starting tunnel: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if SSH key exists: $SSH_KEY_PATH" -ForegroundColor White
    Write-Host "   2. Verify Vast.ai instance is running" -ForegroundColor White
    Write-Host "   3. Check network connectivity" -ForegroundColor White
    exit 1
}

