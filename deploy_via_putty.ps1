# Deploy to cPanel via PuTTY SSH
# This script uses PuTTY/plink to deploy files and run commands

param(
    [string]$ConfigFile = "cpanel-config.json",
    [switch]$DeployFrontend = $true,
    [switch]$DeployNodeJS = $false,
    [string]$NodeAppPath = ""
)

Write-Host "🚀 Deploying via PuTTY SSH" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    Write-Host "   Run: .\setup_putty_ssh.ps1 first" -ForegroundColor Yellow
    exit 1
}

try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "❌ Error reading configuration" -ForegroundColor Red
    exit 1
}

if (-not $config.ssh) {
    Write-Host "❌ SSH not configured" -ForegroundColor Red
    Write-Host "   Run: .\setup_putty_ssh.ps1 first" -ForegroundColor Yellow
    exit 1
}

$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$usePlink = $config.ssh.usePlink
$plinkPath = $config.ssh.plinkPath
$useKey = $config.ssh.useKey
$keyPath = $config.ssh.keyPath
$password = $config.ssh.password

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Host: $sshHost" -ForegroundColor Gray
Write-Host "   User: $sshUser" -ForegroundColor Gray
Write-Host "   Method: $(if ($useKey) { 'Key' } else { 'Password' })" -ForegroundColor Gray
Write-Host ""

# Function to run SSH command
function Invoke-SSHCommand {
    param([string]$Command)
    
    if ($usePlink -and $plinkPath) {
        if ($useKey -and $keyPath) {
            & $plinkPath -i $keyPath -P $sshPort "$sshUser@${sshHost}" $Command 2>&1
        } else {
            echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Command 2>&1
        }
    } else {
        if ($useKey -and $keyPath) {
            ssh -i $keyPath -p $sshPort "$sshUser@${sshHost}" $Command 2>&1
        } else {
            ssh -p $sshPort "$sshUser@${sshHost}" $Command 2>&1
        }
    }
}

# Function to upload file via SCP
function Invoke-SCPUpload {
    param(
        [string]$LocalPath,
        [string]$RemotePath
    )
    
    # Check for pscp (PuTTY SCP) or native scp
    $pscpPath = if ($usePlink) { $plinkPath -replace "plink.exe", "pscp.exe" } else { $null }
    
    if ($pscpPath -and (Test-Path $pscpPath)) {
        # Use PuTTY pscp
        if ($useKey -and $keyPath) {
            & $pscpPath -i $keyPath -P $sshPort $LocalPath "$sshUser@${sshHost}:${RemotePath}" 2>&1
        } else {
            echo $password | & $pscpPath -P $sshPort -pw $password $LocalPath "$sshUser@${sshHost}:${RemotePath}" 2>&1
        }
    } else {
        # Use native scp
        if ($useKey -and $keyPath) {
            scp -i $keyPath -P $sshPort $LocalPath "$sshUser@${sshHost}:${RemotePath}" 2>&1
        } else {
            scp -P $sshPort $LocalPath "$sshUser@${sshHost}:${RemotePath}" 2>&1
        }
    }
}

# Test connection
Write-Host "🔍 Testing connection..." -ForegroundColor Yellow
$testResult = Invoke-SSHCommand "echo 'Connection test' && whoami && hostname"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Connection successful!" -ForegroundColor Green
    Write-Host "   $testResult" -ForegroundColor Gray
} else {
    Write-Host "❌ Connection failed" -ForegroundColor Red
    Write-Host "   Error: $testResult" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Deploy Frontend
if ($DeployFrontend) {
    Write-Host "📦 Deploying Frontend..." -ForegroundColor Yellow
    Write-Host ""
    
    if (-not (Test-Path "medarion-dist")) {
        Write-Host "❌ Frontend not built! Run: npm run build" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   Creating directories..." -ForegroundColor Gray
    Invoke-SSHCommand "mkdir -p public_html/api public_html/config" | Out-Null
    
    Write-Host "   Uploading frontend files..." -ForegroundColor Gray
    # Upload frontend (simplified - would need to upload each file or use tar)
    Write-Host "   ⚠️  File upload via SSH requires additional setup" -ForegroundColor Yellow
    Write-Host "   💡 Use cPanel File Manager or FTP for file uploads" -ForegroundColor Cyan
}

# Deploy Node.js App
if ($DeployNodeJS) {
    if ([string]::IsNullOrWhiteSpace($NodeAppPath)) {
        Write-Host "❌ Node.js app path required" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "🔧 Deploying Node.js Application..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "   Creating directory..." -ForegroundColor Gray
    Invoke-SSHCommand "mkdir -p $NodeAppPath" | Out-Null
    
    Write-Host "   ⚠️  File upload via SSH requires tar/zip method" -ForegroundColor Yellow
    Write-Host "   💡 Use cPanel File Manager or prepare tar archive" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Deployment script ready!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 For file uploads, use:" -ForegroundColor Cyan
Write-Host "   - cPanel File Manager (easiest)" -ForegroundColor White
Write-Host "   - FTP client" -ForegroundColor White
Write-Host "   - Or prepare tar/zip and upload via SSH" -ForegroundColor White
Write-Host ""

