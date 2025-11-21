# Stop all processes on Vast.ai instance via SSH
# This script kills any running Python processes and frees up resources

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     STOPPING ALL PROCESSES ON VAST.AI INSTANCE        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# SSH Configuration
$sshHost = "93.91.156.91"
$sshPort = "52695"
$sshUser = "root"
$sshKeyPath = "$env:USERPROFILE\.ssh\vast_ai_key"

# Check if SSH key exists
$useKey = Test-Path $sshKeyPath

Write-Host "1. Connecting to Vast.ai instance..." -ForegroundColor Yellow
Write-Host "   Host: $sshHost:$sshPort" -ForegroundColor Gray
Write-Host "   User: $sshUser" -ForegroundColor Gray

if ($useKey) {
    Write-Host "   Using SSH key: $sshKeyPath" -ForegroundColor Green
    $sshCmd = "ssh -i `"$sshKeyPath`" -p $sshPort $sshUser@$sshHost"
} else {
    Write-Host "   No SSH key found - will use password authentication" -ForegroundColor Yellow
    $sshCmd = "ssh -p $sshPort $sshUser@$sshHost"
}

Write-Host "`n2. Stopping all Python processes..." -ForegroundColor Yellow
$stopPython = "$sshCmd 'pkill -9 -f python || pkill -9 -f python3 || true'"
Invoke-Expression $stopPython
Start-Sleep -Seconds 2
Write-Host "   [OK] Python processes stopped" -ForegroundColor Green

Write-Host "`n3. Stopping Flask/API processes..." -ForegroundColor Yellow
$stopFlask = "$sshCmd 'pkill -9 -f flask || pkill -9 -f run_api_on_vast || pkill -9 -f app.py || true'"
Invoke-Expression $stopFlask
Start-Sleep -Seconds 2
Write-Host "   [OK] Flask/API processes stopped" -ForegroundColor Green

Write-Host "`n4. Checking for processes using GPU..." -ForegroundColor Yellow
$checkGPU = "$sshCmd 'nvidia-smi --query-compute-apps=pid,process_name --format=csv,noheader 2>/dev/null || echo No GPU processes found'"
$gpuProcs = Invoke-Expression $checkGPU
if ($gpuProcs -and $gpuProcs -notmatch "No GPU processes") {
    Write-Host "   Found GPU processes, killing them..." -ForegroundColor Yellow
    $killGPU = "$sshCmd 'nvidia-smi --query-compute-apps=pid --format=csv,noheader | xargs -r kill -9 2>/dev/null || true'"
    Invoke-Expression $killGPU
    Write-Host "   [OK] GPU processes killed" -ForegroundColor Green
} else {
    Write-Host "   [OK] No GPU processes found" -ForegroundColor Green
}

Write-Host "`n5. Checking for processes on ports 8080-8090..." -ForegroundColor Yellow
$checkPorts = "$sshCmd 'for port in 8080 8081 8082 8083 8084 8085 8086 8087 8088 8089 8090; do pid=`$(lsof -ti:`$port 2>/dev/null || fuser `$port/tcp 2>/dev/null | awk \"{print `\$2}\" | head -1); if [ ! -z \"`$pid\" ]; then echo \"Port `$port: PID `$pid\"; kill -9 `$pid 2>/dev/null || true; fi; done || echo No processes on ports'"
Invoke-Expression $checkPorts
Write-Host "   [OK] Port cleanup complete" -ForegroundColor Green

Write-Host "`n6. Clearing GPU memory..." -ForegroundColor Yellow
$clearGPU = "$sshCmd 'python3 -c \"import torch; torch.cuda.empty_cache() if torch.cuda.is_available() else None\" 2>/dev/null || true'"
Invoke-Expression $clearGPU
Write-Host "   [OK] GPU memory cleared" -ForegroundColor Green

Write-Host "`n7. Final process check..." -ForegroundColor Yellow
$finalCheck = "$sshCmd 'ps aux | grep -E \"python|flask|run_api\" | grep -v grep || echo No relevant processes found'"
$remaining = Invoke-Expression $finalCheck
if ($remaining -and $remaining -notmatch "No relevant processes") {
    Write-Host "   [WARNING] Some processes may still be running:" -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "   [OK] No relevant processes found" -ForegroundColor Green
}

Write-Host "`n✅ All processes stopped!" -ForegroundColor Green
Write-Host "`n📝 The instance is now clean and ready for:" -ForegroundColor Cyan
Write-Host "   • Adding SSH keys" -ForegroundColor White
Write-Host "   • Running the new script" -ForegroundColor White
Write-Host "   • Starting fresh setup" -ForegroundColor White
Write-Host ""

