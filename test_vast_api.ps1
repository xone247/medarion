# Test Vast.ai API
# Tests both directly on Vast.ai and via tunnel

$ErrorActionPreference = "Continue"

Write-Host "`n🧪 Testing Vast.ai API" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
$vastSSHPort = 44939
$vastHost = "ssh1.vast.ai"
$apiPort = 44050
$localPort = 8081

# Test 1: Direct test on Vast.ai
Write-Host "`n[1/3] Testing directly on Vast.ai..." -ForegroundColor Yellow
$healthCmd = "curl -s http://localhost:44050/health"
$healthResult = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" $healthCmd 2>&1

if ($healthResult -match '"status"') {
    Write-Host "   ✅ Health check passed!" -ForegroundColor Green
    Write-Host "   $healthResult" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Health check: $healthResult" -ForegroundColor Yellow
}

# Test 2: Chat test on Vast.ai
Write-Host "`n[2/3] Testing chat endpoint on Vast.ai..." -ForegroundColor Yellow
$chatTestFile = "/tmp/test_chat.json"
$chatJson = '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":100}'

# Create test file on Vast.ai
ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" "echo '$chatJson' > $chatTestFile" 2>&1 | Out-Null

# Run curl with file
$chatCmd = "curl -s -X POST http://localhost:44050/chat -H 'Content-Type: application/json' -H 'X-API-Key: medarion-secure-key-2025' -d @$chatTestFile"
$chatResult = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" $chatCmd 2>&1

if ($chatResult -match '"content"') {
    try {
        $chatObj = $chatResult | ConvertFrom-Json
        $content = $chatObj.choices[0].message.content
        Write-Host "   ✅ Chat response received!" -ForegroundColor Green
        Write-Host "   Content: '$content'" -ForegroundColor White
        Write-Host "   Length: $($content.Length) chars" -ForegroundColor Gray
        
        if ($content -notmatch "###|function\s*\(" -and $content.Length -gt 5) {
            Write-Host "   ✅ Response is clean!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Response may contain artifacts" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  Could not parse response: $chatResult" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Chat test result: $chatResult" -ForegroundColor Yellow
}

# Test 3: Test via tunnel (if available)
Write-Host "`n[3/3] Testing via SSH tunnel (localhost:8081)..." -ForegroundColor Yellow
try {
    $tunnelHealth = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET -TimeoutSec 3
    Write-Host "   ✅ Tunnel is working!" -ForegroundColor Green
    Write-Host "   $($tunnelHealth | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Tunnel not available: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   💡 To start tunnel:" -ForegroundColor Cyan
    Write-Host "      ssh -i `"$vastKey`" -p $vastSSHPort -L ${localPort}:localhost:${apiPort} root@${vastHost} -N" -ForegroundColor White
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Testing complete!" -ForegroundColor Green

