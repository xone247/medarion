# Watch Frontend Files and Auto-Deploy
# Watches for changes and automatically deploys to cPanel

param(
    [int]$Interval = 30,  # Check every 30 seconds
    [switch]$Once  # Deploy once and exit
)

$ErrorActionPreference = "Continue"

Write-Host "`n👀 Watching Frontend Files for Changes" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "   Watching: src/ directory" -ForegroundColor Gray
Write-Host "   Auto-deploying to: https://medarion.africa" -ForegroundColor Gray
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Track last deployment time
$lastDeploy = Get-Date
$lastHash = ""

# Function to get file hash
function Get-FileHash {
    param([string]$Path)
    $files = Get-ChildItem -Path $Path -Recurse -File -Include *.tsx,*.ts,*.css,*.js,*.json | 
        Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "dist" }
    $content = ($files | Get-Content -Raw) -join "|"
    return $content.GetHashCode()
}

# Initial hash
$initialHash = Get-FileHash "src"
Write-Host "   📋 Initial state captured" -ForegroundColor Green
Write-Host "   ⏳ Waiting for changes..." -ForegroundColor Gray
Write-Host ""

while ($true) {
    Start-Sleep -Seconds $Interval
    
    $currentHash = Get-FileHash "src"
    
    if ($currentHash -ne $initialHash) {
        $timeSinceLastDeploy = (Get-Date) - $lastDeploy
        
        # Only deploy if it's been at least 10 seconds since last deploy
        if ($timeSinceLastDeploy.TotalSeconds -ge 10) {
            Write-Host "`n🔄 Changes detected! Deploying..." -ForegroundColor Yellow
            Write-Host "   Time: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
            
            & ".\deploy_frontend_fast.ps1"
            
            if ($LASTEXITCODE -eq 0) {
                $lastDeploy = Get-Date
                $initialHash = $currentHash
                Write-Host "`n   ✅ Deployed! View: https://medarion.africa" -ForegroundColor Green
                Write-Host "   ⏳ Watching for more changes..." -ForegroundColor Gray
                Write-Host ""
            } else {
                Write-Host "   ❌ Deployment failed, will retry on next change" -ForegroundColor Red
            }
        }
    }
    
    if ($Once) {
        break
    }
}

