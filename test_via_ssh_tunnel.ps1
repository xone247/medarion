#!/usr/bin/env pwsh
# Test Vast.ai API via SSH tunnel

$SSH_KEY = "$env:USERPROFILE\.ssh\id_ed25519_vast"
$SSH_PORT = 31216
$LOCAL_PORT = 3001
$REMOTE_HOST = "ssh1.vast.ai"
$API_KEY = "medarion-secure-key-2025"

Write-Host "`n🔗 Setting up SSH Tunnel..." -ForegroundColor Cyan
Write-Host "   Local port: $LOCAL_PORT" -ForegroundColor Gray
Write-Host "   Remote: localhost:3001" -ForegroundColor Gray

# Check if tunnel already exists
$existingTunnel = Get-Process -Name ssh -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*$LOCAL_PORT:localhost:3001*"
}

if ($existingTunnel) {
    Write-Host "   ⚠️  Tunnel may already exist, killing old process..." -ForegroundColor Yellow
    $existingTunnel | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start SSH tunnel in background
Write-Host "`n🚀 Starting SSH tunnel..." -ForegroundColor Cyan
$tunnelProcess = Start-Process -FilePath "ssh" `
    -ArgumentList "-i", "$SSH_KEY", "-p", "$SSH_PORT", "-L", "${LOCAL_PORT}:localhost:3001", "-N", "-f", "root@${REMOTE_HOST}" `
    -PassThru `
    -NoNewWindow `
    -ErrorAction Stop

Start-Sleep -Seconds 3

Write-Host "   ✅ Tunnel started (PID: $($tunnelProcess.Id))" -ForegroundColor Green
Write-Host "`n🧪 Testing API via Tunnel..." -ForegroundColor Cyan

# Test Health
Write-Host "`n1️⃣  Health Check:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:${LOCAL_PORT}/health" -TimeoutSec 10
    Write-Host "   ✅ $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    $tunnelProcess | Stop-Process -Force -ErrorAction SilentlyContinue
    exit 1
}

# Test Chat
Write-Host "`n2️⃣  Chat Test:" -ForegroundColor Yellow
try {
    $chatBody = @{
        messages = @(
            @{
                role = "user"
                content = "Say hello"
            }
        )
        max_tokens = 10
    } | ConvertTo-Json

    $chatResponse = Invoke-RestMethod -Uri "http://localhost:${LOCAL_PORT}/chat" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "X-API-Key" = $API_KEY
        } `
        -Body $chatBody `
        -TimeoutSec 60

    Write-Host "   ✅ Chat successful!" -ForegroundColor Green
    Write-Host "   Response:" -ForegroundColor Gray
    $chatResponse | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
} catch {
    Write-Host "   ❌ Chat failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ Testing Complete!" -ForegroundColor Green
Write-Host "`n💡 To keep tunnel running, don't close this window." -ForegroundColor Cyan
Write-Host "   To stop tunnel: Stop-Process -Id $($tunnelProcess.Id)" -ForegroundColor Gray

