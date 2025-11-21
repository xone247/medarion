# Upload run_api_on_vast.py to Vast.ai Server
# This script uploads the fixed file to Vast.ai

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "🚀 UPLOAD run_api_on_vast.py TO VAST.AI" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Configuration
$VAST_IP = "194.228.55.129"
$VAST_PORT = 37792
$SSH_KEY = "$env:USERPROFILE\.ssh\vast_ai_key"
$LOCAL_FILE = "run_api_on_vast.py"
$REMOTE_PATH = "/workspace/run_api_on_vast.py"

# Check if file exists
if (-not (Test-Path $LOCAL_FILE)) {
    Write-Host "❌ File not found: $LOCAL_FILE" -ForegroundColor Red
    Write-Host "   Make sure you're in the project directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Local file: $LOCAL_FILE" -ForegroundColor Cyan
Write-Host "📁 Remote path: $REMOTE_PATH" -ForegroundColor Cyan
Write-Host ""

# Check for SSH key
$useKey = Test-Path $SSH_KEY
if ($useKey) {
    Write-Host "✅ Using SSH key: $SSH_KEY" -ForegroundColor Green
    $scpCommand = "scp -i `"$SSH_KEY`" -P $VAST_PORT `"$LOCAL_FILE`" root@${VAST_IP}:${REMOTE_PATH}"
} else {
    Write-Host "⚠️  No SSH key found. Will use password authentication." -ForegroundColor Yellow
    $scpCommand = "scp -P $VAST_PORT `"$LOCAL_FILE`" root@${VAST_IP}:${REMOTE_PATH}"
}

Write-Host ""
Write-Host "📤 Uploading file..." -ForegroundColor Cyan
Write-Host "   This may prompt for password if no SSH key is available" -ForegroundColor Yellow
Write-Host ""

try {
    Invoke-Expression $scpCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ File uploaded successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "   1. SSH into Vast.ai:" -ForegroundColor White
        if ($useKey) {
            Write-Host "      ssh -i `"$SSH_KEY`" -p $VAST_PORT root@${VAST_IP}" -ForegroundColor Gray
        } else {
            Write-Host "      ssh -p $VAST_PORT root@${VAST_IP}" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "   2. Stop the running API:" -ForegroundColor White
        Write-Host "      pkill -f 'run_api_on_vast.py'" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   3. Start the new API:" -ForegroundColor White
        Write-Host "      cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   4. Test from local machine:" -ForegroundColor White
        Write-Host "      Invoke-WebRequest -Uri 'http://localhost:8081/health'" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Upload failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "   Check your SSH connection and credentials" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error during upload: $_" -ForegroundColor Red
    exit 1
}

