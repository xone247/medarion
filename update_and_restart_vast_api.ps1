# Update and Restart Vast.ai API
# Uploads updated run_api_on_vast.py and restarts the API

$ErrorActionPreference = "Continue"

Write-Host "`n🔄 Updating Vast.ai API..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
$vastHost = "ssh1.vast.ai"
$vastPort = 31216

if (-not (Test-Path $vastKey)) {
    Write-Host "`n❌ SSH key not found: $vastKey" -ForegroundColor Red
    exit 1
}

# Step 1: Upload file
Write-Host "`n[1/4] Uploading run_api_on_vast.py..." -ForegroundColor Yellow
try {
    scp -i $vastKey -P $vastPort "run_api_on_vast.py" "root@${vastHost}:/workspace/run_api_on_vast.py" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ File uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Upload completed (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Stop existing API
Write-Host "`n[2/4] Stopping existing API..." -ForegroundColor Yellow
$stopCmd = "pkill -f 'python3.*run_api_on_vast.py' 2>&1 || echo 'No process to stop'"
$stopResult = ssh -i $vastKey -p $vastPort "root@${vastHost}" $stopCmd 2>&1
Write-Host "   $stopResult" -ForegroundColor Gray
Start-Sleep -Seconds 2

# Step 3: Start updated API
Write-Host "`n[3/4] Starting updated API..." -ForegroundColor Yellow
$startCmd = "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 1 && echo 'API started'"
$startResult = ssh -i $vastKey -p $vastPort "root@${vastHost}" $startCmd 2>&1
Write-Host "   $startResult" -ForegroundColor Gray
Start-Sleep -Seconds 3

# Step 4: Verify and test
Write-Host "`n[4/4] Verifying API..." -ForegroundColor Yellow
$checkCmd = "ps aux | grep 'python3.*run_api_on_vast.py' | grep -v grep | head -1"
$checkResult = ssh -i $vastKey -p $vastPort "root@${vastHost}" $checkCmd 2>&1

if ($checkResult -match "python3.*run_api_on_vast") {
    Write-Host "   ✅ API is running" -ForegroundColor Green
    
    Write-Host "`n🧪 Testing API..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET -Headers @{"X-API-Key"="medarion-secure-key-2025"} -TimeoutSec 5
        Write-Host "   ✅ Health check: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
        
        Write-Host "`n🧪 Testing chat endpoint..." -ForegroundColor Cyan
        $testBody = @{
            messages = @(
                @{ role = "user"; content = "Say hello" }
            )
            max_tokens = 100
            temperature = 0.7
        } | ConvertTo-Json -Depth 10
        
        $chatResponse = Invoke-RestMethod -Uri "http://localhost:8081/chat" -Method POST -Body $testBody -ContentType "application/json" -Headers @{"X-API-Key"="medarion-secure-key-2025"} -TimeoutSec 30
        $content = $chatResponse.choices[0].message.content
        
        Write-Host "`n📥 Response:" -ForegroundColor Yellow
        Write-Host "   Length: $($content.Length) chars" -ForegroundColor Gray
        Write-Host "   Content: '$content'" -ForegroundColor White
        
        if ($content -match "###|function\s*\(") {
            Write-Host "`n   ⚠️  Still contains patterns" -ForegroundColor Yellow
        } else {
            Write-Host "`n   ✅ Response looks clean!" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ API is not running" -ForegroundColor Red
    Write-Host "   Check logs: ssh -i $vastKey -p $vastPort root@${vastHost} 'tail -20 /workspace/api.log'" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Update complete!" -ForegroundColor Green
Write-Host "`n💡 Now test the AI in your browser" -ForegroundColor Cyan

