# Run SSH Command via PuTTY or Native SSH
# This script executes commands on the remote server

param(
    [Parameter(Mandatory=$true)]
    [string]$Command,
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host "🚀 Executing SSH Command" -ForegroundColor Cyan
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

# Check if SSH is configured
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

Write-Host "📋 Connection:" -ForegroundColor Cyan
Write-Host "   Host: $sshHost" -ForegroundColor Gray
Write-Host "   User: $sshUser" -ForegroundColor Gray
Write-Host "   Command: $Command" -ForegroundColor Gray
Write-Host ""

# Execute command
try {
    if ($usePlink -and $plinkPath) {
        # Use PuTTY plink
        if ($useKey -and $keyPath) {
            # With key file (may prompt for passphrase)
            # Try with password first, then fallback to key
            if ($password) {
                # Use password if available (faster, no passphrase prompt)
                $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Command 2>&1
            } else {
                # Use key (will prompt for passphrase if needed)
                $result = & $plinkPath -i $keyPath -P $sshPort "$sshUser@${sshHost}" $Command 2>&1
            }
        } else {
            # With password
            $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Command 2>&1
        }
    } else {
        # Use native SSH
        if ($useKey -and $keyPath) {
            # With key file
            if ($password) {
                # Try password first
                $result = sshpass -p $password ssh -p $sshPort "$sshUser@${sshHost}" $Command 2>&1
                if ($LASTEXITCODE -ne 0) {
                    # Fallback to key
                    $result = ssh -i $keyPath -p $sshPort "$sshUser@${sshHost}" $Command 2>&1
                }
            } else {
                $result = ssh -i $keyPath -p $sshPort "$sshUser@${sshHost}" $Command 2>&1
            }
        } else {
            # With password (will prompt)
            Write-Host "   ⚠️  Will prompt for password" -ForegroundColor Yellow
            $result = ssh -p $sshPort "$sshUser@${sshHost}" $Command 2>&1
        }
    }
    
    Write-Host "📤 Command Output:" -ForegroundColor Cyan
    Write-Host ""
    $result | ForEach-Object { Write-Host $_ -ForegroundColor White }
    Write-Host ""
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Command executed successfully" -ForegroundColor Green
        return $result
    } else {
        Write-Host "⚠️  Command exited with code: $LASTEXITCODE" -ForegroundColor Yellow
        return $result
    }
} catch {
    Write-Host "❌ Error executing command: $_" -ForegroundColor Red
    exit 1
}

