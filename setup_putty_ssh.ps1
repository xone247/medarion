# Setup PuTTY SSH Access for Automated Commands
# This configures SSH access using PuTTY/plink

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host "🔧 Setting Up PuTTY SSH Access" -ForegroundColor Cyan
Write-Host ""

# Check if config exists
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    exit 1
}

# Load configuration
try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "❌ Error reading configuration" -ForegroundColor Red
    exit 1
}

Write-Host "📋 PuTTY SSH Configuration" -ForegroundColor Yellow
Write-Host ""

# Get connection details
Write-Host "Please provide your PuTTY SSH connection details:" -ForegroundColor Cyan
Write-Host ""

$sshHost = Read-Host "SSH Host (e.g., medarion.africa or 66.29.131.252)"
$sshUser = Read-Host "SSH Username (e.g., root)"
$sshPort = Read-Host "SSH Port (default: 22)"
if ([string]::IsNullOrWhiteSpace($sshPort)) { $sshPort = "22" }

Write-Host ""
Write-Host "🔐 Authentication Method:" -ForegroundColor Yellow
Write-Host "   1. PuTTY Private Key (.ppk file)" -ForegroundColor White
Write-Host "   2. Password (stored securely)" -ForegroundColor White
Write-Host ""

$authMethod = Read-Host "Choose method (1 or 2)"

if ($authMethod -eq "1") {
    Write-Host ""
    Write-Host "📁 PuTTY Key File:" -ForegroundColor Cyan
    $ppkPath = Read-Host "Path to .ppk file (e.g., C:\Users\YourName\Documents\key.ppk)"
    
    if (-not (Test-Path $ppkPath)) {
        Write-Host "❌ Key file not found: $ppkPath" -ForegroundColor Red
        exit 1
    }
    
    $sshPassword = $null
    $useKey = $true
} else {
    Write-Host ""
    Write-Host "🔑 Password:" -ForegroundColor Cyan
    $sshPassword = Read-Host "SSH Password" -AsSecureString
    $sshPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sshPassword)
    )
    $useKey = $false
    $ppkPath = $null
}

Write-Host ""

# Check for plink (PuTTY command-line)
$plinkPath = Get-Command plink -ErrorAction SilentlyContinue
if (-not $plinkPath) {
    # Common PuTTY installation paths
    $commonPaths = @(
        "${env:ProgramFiles}\PuTTY\plink.exe",
        "${env:ProgramFiles(x86)}\PuTTY\plink.exe",
        "$env:LOCALAPPDATA\Programs\PuTTY\plink.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $plinkPath = $path
            break
        }
    }
}

# Check for native SSH
$sshCmd = Get-Command ssh -ErrorAction SilentlyContinue

Write-Host "🔍 Checking Available SSH Tools:" -ForegroundColor Yellow
Write-Host ""

if ($plinkPath) {
    Write-Host "   ✅ PuTTY plink found: $plinkPath" -ForegroundColor Green
    $usePlink = $true
} else {
    Write-Host "   ⚠️  PuTTY plink not found" -ForegroundColor Yellow
    Write-Host "   💡 Install PuTTY from: https://www.putty.org/" -ForegroundColor Gray
    $usePlink = $false
}

if ($sshCmd) {
    Write-Host "   ✅ Native SSH found: $($sshCmd.Source)" -ForegroundColor Green
    $useNativeSSH = $true
} else {
    Write-Host "   ⚠️  Native SSH not found" -ForegroundColor Yellow
    $useNativeSSH = $false
}

if (-not $usePlink -and -not $useNativeSSH) {
    Write-Host ""
    Write-Host "❌ No SSH tools available!" -ForegroundColor Red
    Write-Host "   Please install PuTTY or enable OpenSSH" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Update configuration
Write-Host "📝 Updating configuration..." -ForegroundColor Yellow
Write-Host ""

$config.ssh = @{
    host = $sshHost
    username = $sshUser
    port = [int]$sshPort
    usePlink = $usePlink
    plinkPath = if ($usePlink) { $plinkPath.Source } else { $null }
    useKey = $useKey
    keyPath = if ($useKey) { $ppkPath } else { $null }
    password = if (-not $useKey) { $sshPasswordPlain } else { $null }
    description = "PuTTY SSH access configured"
}

$config | ConvertTo-Json -Depth 10 | Out-File $ConfigFile -Encoding UTF8

Write-Host "✅ Configuration updated" -ForegroundColor Green
Write-Host ""

# Test connection
Write-Host "🧪 Testing Connection..." -ForegroundColor Yellow
Write-Host ""

if ($usePlink) {
    if ($useKey) {
        $testCmd = "& `"$($plinkPath.Source)`" -i `"$ppkPath`" -P $sshPort $sshUser@${sshHost} `"echo 'Connection successful' && whoami && hostname`""
    } else {
        $testCmd = "echo $sshPasswordPlain | & `"$($plinkPath.Source)`" -P $sshPort -pw `"$sshPasswordPlain`" $sshUser@${sshHost} `"echo 'Connection successful' && whoami && hostname`""
    }
} else {
    if ($useKey) {
        $testCmd = "ssh -i `"$ppkPath`" -p $sshPort $sshUser@${sshHost} `"echo 'Connection successful' && whoami && hostname`""
    } else {
        $testCmd = "ssh -p $sshPort $sshUser@${sshHost} `"echo 'Connection successful' && whoami && hostname`""
    }
}

Write-Host "   Running test command..." -ForegroundColor Gray
Write-Host ""

try {
    if ($usePlink -and -not $useKey) {
        # Use plink with password
        $testResult = Invoke-Expression "echo $sshPasswordPlain | & `"$($plinkPath.Source)`" -P $sshPort -pw `"$sshPasswordPlain`" $sshUser@${sshHost} `"echo 'Connection successful' && whoami && hostname`"" 2>&1
    } elseif ($usePlink -and $useKey) {
        # Use plink with key
        $testResult = & $plinkPath.Source -i $ppkPath -P $sshPort "$sshUser@${sshHost}" "echo 'Connection successful' && whoami && hostname" 2>&1
    } elseif ($useNativeSSH -and $useKey) {
        # Use native SSH with key
        $testResult = ssh -i $ppkPath -p $sshPort "$sshUser@${sshHost}" "echo 'Connection successful' && whoami && hostname" 2>&1
    } else {
        # Use native SSH with password (will prompt)
        Write-Host "   ⚠️  Native SSH will prompt for password" -ForegroundColor Yellow
        Write-Host "   Password: [enter your password]" -ForegroundColor Gray
        $testResult = ssh -p $sshPort "$sshUser@${sshHost}" "echo 'Connection successful' && whoami && hostname" 2>&1
    }
    
    if ($LASTEXITCODE -eq 0 -and $testResult -like "*Connection successful*") {
        Write-Host "   ✅ Connection test successful!" -ForegroundColor Green
        Write-Host "   Response:" -ForegroundColor Gray
        $testResult | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ⚠️  Connection test had issues" -ForegroundColor Yellow
        Write-Host "   Result: $testResult" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Connection test failed: $_" -ForegroundColor Yellow
}

Write-Host ""

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         PuTTY SSH Setup Complete!                        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Host: $sshHost" -ForegroundColor Gray
Write-Host "   User: $sshUser" -ForegroundColor Gray
Write-Host "   Port: $sshPort" -ForegroundColor Gray
Write-Host "   Method: $(if ($useKey) { 'PuTTY Key' } else { 'Password' })" -ForegroundColor Gray
Write-Host "   Tool: $(if ($usePlink) { 'PuTTY plink' } else { 'Native SSH' })" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 You can now use:" -ForegroundColor Cyan
Write-Host "   .\run_ssh_command.ps1 'your command here'" -ForegroundColor White
Write-Host "   .\deploy_via_putty.ps1" -ForegroundColor White
Write-Host ""

