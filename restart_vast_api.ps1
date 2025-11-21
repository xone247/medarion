# Restart Vast.ai API on public port 38660
# This script connects to Vast.ai and restarts the API

param(
    [string]$VastInstance = "194.228.55.129",
    [string]$VastSSHPort = "38506",
    [string]$VastSSHKey = "$env:USERPROFILE\.ssh\vast_ai_key"
)

Write-Host "`n🚀 Restarting Vast.ai API on Port 38660..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check SSH key
if (-not (Test-Path $VastSSHKey)) {
    Write-Host "`n❌ SSH key not found: $VastSSHKey" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Instance: $VastInstance" -ForegroundColor Gray
Write-Host "   SSH Port: $VastSSHPort" -ForegroundColor Gray
Write-Host "   API Port: 38660 (public)" -ForegroundColor Gray

# Upload restart script
Write-Host "`n📤 Uploading restart script..." -ForegroundColor Yellow
$scriptContent = Get-Content "restart_api_vast_port38660.sh" -Raw
$scriptContent = $scriptContent -replace "`r`n", "`n"
$scriptContent | ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance "cat > /tmp/restart_api.sh"

# Make executable and run
Write-Host "🚀 Running restart script..." -ForegroundColor Yellow
ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance "chmod +x /tmp/restart_api.sh && bash /tmp/restart_api.sh"

Write-Host "`n⏳ Waiting 10 seconds for API to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test connection
Write-Host "`n🧪 Testing direct connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://${VastInstance}:38660/health" -Method GET -TimeoutSec 10
    Write-Host "✅ SUCCESS! API is working on port 38660!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  API not responding yet: $_" -ForegroundColor Yellow
    Write-Host "   The model might still be loading. Wait a minute and try:" -ForegroundColor Gray
    Write-Host "   curl http://${VastInstance}:38660/health" -ForegroundColor Cyan
}

Write-Host "`n✅ API should be accessible at:" -ForegroundColor Green
Write-Host "   http://${VastInstance}:38660" -ForegroundColor Cyan
Write-Host "`n💡 No tunnel needed - direct connection!" -ForegroundColor Yellow

