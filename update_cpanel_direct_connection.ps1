# Update cPanel to use direct Vast.ai connection (no tunnel)
# This updates the .env file to point directly to the public port

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host "`n🔧 Updating cPanel for Direct Vast.ai Connection..." -ForegroundColor Cyan

# Load configuration
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    exit 1
}

$config = Get-Content $ConfigFile | ConvertFrom-Json
$cpanelHost = $config.ssh.host
$cpanelUser = $config.ssh.username
$sshPassword = $config.ssh.password

$plinkPath = "C:\Program Files\PuTTY\plink.exe"

# Vast.ai direct connection details
# New instance: 93.91.156.91 (port range -1--1, all ports open)
# Using standard port 3001
$vastUrl = "http://93.91.156.91:3001"
$apiKey = "47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a"
$envPath = "/home/medasnnc/nodevenv/medarion/18/bin/.env"

Write-Host "`n📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Vast.ai URL: $vastUrl" -ForegroundColor Gray
Write-Host "   .env Path: $envPath" -ForegroundColor Gray

# Read current .env file
Write-Host "`n📤 Reading current .env..." -ForegroundColor Yellow
try {
    $currentEnv = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" "cat $envPath 2>/dev/null || echo ''"
    
    # Update or add VAST_AI_URL
    $envLines = $currentEnv -split "`n" | Where-Object { $_ -notmatch "^VAST_AI_URL=" -and $_ -notmatch "^AI_MODE=" -and $_.Trim() -ne "" }
    
    # Add/update required variables
    $newEnv = @(
        $envLines
        "AI_MODE=vast"
        "VAST_AI_URL=$vastUrl"
        "VAST_API_KEY=$apiKey"
    ) -join "`n"
    
    Write-Host "`n💾 Updating .env file..." -ForegroundColor Yellow
    $newEnv | & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" "cat > $envPath"
    
    Write-Host "✅ .env file updated!" -ForegroundColor Green
    
    # Verify
    Write-Host "`n📋 Verifying update..." -ForegroundColor Yellow
    $verify = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" "grep -E 'VAST_AI_URL|AI_MODE|VAST_API_KEY' $envPath"
    Write-Host $verify
    
    Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Restart Node.js service: systemctl restart medarion-api.service" -ForegroundColor White
    Write-Host "   2. Test connection: curl http://194.228.55.129:38700/health" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    exit 1
}

