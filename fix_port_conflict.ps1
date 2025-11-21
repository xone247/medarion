# Fix port conflict on Vast.ai
# Check what's using port 44047 and provide solutions

$ErrorActionPreference = "Continue"

Write-Host "`n🔍 Checking Port 44047 Usage..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
$vastSSHPort = 44939
$vastHost = "ssh1.vast.ai"

Write-Host "`n[Option 1] Check what's using port 44047..." -ForegroundColor Yellow
$checkCmd = "lsof -i :44047 || fuser 44047/tcp || netstat -tulpn | grep 44047 || echo 'Port check command not available'"
$checkResult = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" $checkCmd 2>&1
Write-Host "   $checkResult" -ForegroundColor White

Write-Host "`n[Option 2] Kill process on port 44047..." -ForegroundColor Yellow
$killCmd = "fuser -k 44047/tcp 2>&1 || lsof -ti :44047 | xargs kill -9 2>&1 || echo 'No process found or already stopped'"
$killResult = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" $killCmd 2>&1
Write-Host "   $killResult" -ForegroundColor White

Write-Host "`n💡 Alternative: Use port 44123 (already open)" -ForegroundColor Cyan
Write-Host "   This port is mapped: 93.91.156.86:44123 -> 8080/tcp" -ForegroundColor Gray
Write-Host "   Update PORT = 44123 in run_api_on_vast.py" -ForegroundColor White

