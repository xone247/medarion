# Quick PuTTY SSH Configuration
# Provide your details and this will configure everything

param(
    [string]$Host = "",
    [string]$User = "root",
    [int]$Port = 22,
    [string]$KeyPath = "",
    [string]$Password = "",
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host "🔧 Configuring PuTTY SSH Access" -ForegroundColor Cyan
Write-Host ""

# Load existing config
if (Test-Path $ConfigFile) {
    try {
        $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
    } catch {
        $config = @{}
    }
} else {
    $config = @{}
}

# Get connection details
if ([string]::IsNullOrWhiteSpace($Host)) {
    $Host = Read-Host "SSH Host (e.g., medarion.africa or 66.29.131.252)"
}

if ([string]::IsNullOrWhiteSpace($User)) {
    $User = Read-Host "SSH Username (default: root)"
    if ([string]::IsNullOrWhiteSpace($User)) { $User = "root" }
}

if ($Port -eq 0) {
    $portInput = Read-Host "SSH Port (default: 22)"
    if ([string]::IsNullOrWhiteSpace($portInput)) { $Port = 22 } else { $Port = [int]$portInput }
}

# Determine authentication
if ([string]::IsNullOrWhiteSpace($KeyPath) -and [string]::IsNullOrWhiteSpace($Password)) {
    Write-Host ""
    Write-Host "Authentication method:" -ForegroundColor Yellow
    Write-Host "   1. PuTTY Key (.ppk file)" -ForegroundColor White
    Write-Host "   2. Password" -ForegroundColor White
    Write-Host ""
    $method = Read-Host "Choose (1 or 2)"
    
    if ($method -eq "1") {
        $KeyPath = Read-Host "Path to .ppk file"
        $Password = $null
    } else {
        $securePass = Read-Host "Password" -AsSecureString
        $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
        )
        $KeyPath = $null
    }
}

# Check for plink
$plinkPath = $null
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

$usePlink = $plinkPath -ne $null
$useKey = -not [string]::IsNullOrWhiteSpace($KeyPath)

# Update config
$config.ssh = @{
    host = $Host
    username = $User
    port = $Port
    usePlink = $usePlink
    plinkPath = $plinkPath
    useKey = $useKey
    keyPath = $KeyPath
    password = $Password
    description = "PuTTY SSH access - configured"
}

$config | ConvertTo-Json -Depth 10 | Out-File $ConfigFile -Encoding UTF8

Write-Host ""
Write-Host "✅ Configuration saved!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Host: $Host" -ForegroundColor Gray
Write-Host "   User: $User" -ForegroundColor Gray
Write-Host "   Port: $Port" -ForegroundColor Gray
Write-Host "   Auth: $(if ($useKey) { 'Key: ' + $KeyPath } else { 'Password' })" -ForegroundColor Gray
Write-Host "   Tool: $(if ($usePlink) { 'PuTTY plink' } else { 'Native SSH' })" -ForegroundColor Gray
Write-Host ""

# Test connection
Write-Host "🧪 Testing connection..." -ForegroundColor Yellow
Write-Host ""

$testResult = & ".\run_ssh_command.ps1" -Command "echo 'Connection test' && whoami && hostname"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Connection successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 You can now run commands:" -ForegroundColor Cyan
    Write-Host "   .\run_ssh_command.ps1 'your command'" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Connection test had issues" -ForegroundColor Yellow
    Write-Host "   Verify your credentials and try again" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""

