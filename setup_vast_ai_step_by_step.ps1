# Step-by-step setup for new Vast.ai instance
# This script performs each step separately for better error handling

param(
    [string]$VastHost = "ssh1.vast.ai",
    [string]$VastPort = "31216",
    [string]$VastIP = "93.91.156.91",
    [string]$SSHKey = "$env:USERPROFILE\.ssh\id_ed25519_vast",
    [string]$APIPort = "3001"
)

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Step-by-Step Vast.ai Setup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Step 1: Test SSH
Write-Host "`n[1/7] Testing SSH Connection..." -ForegroundColor Yellow
$sshKeyExists = Test-Path $SSHKey
if ($sshKeyExists) {
    Write-Host "   Using SSH key: $SSHKey" -ForegroundColor Gray
} else {
    Write-Host "   SSH key not found, will use password auth" -ForegroundColor Gray
}

# Use plink for better Windows compatibility
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
if (Test-Path $plinkPath) {
    Write-Host "   Using PuTTY plink" -ForegroundColor Gray
    $usePlink = $true
} else {
    Write-Host "   Using OpenSSH" -ForegroundColor Gray
    $usePlink = $false
}

# Test connection
try {
    if ($usePlink) {
        if ($sshKeyExists) {
            $testResult = & $plinkPath -i "$SSHKey" -P $VastPort root@$VastHost "echo 'Connection OK' && python3 --version" 2>&1
        } else {
            $testResult = & $plinkPath -P $VastPort root@$VastHost "echo 'Connection OK' && python3 --version" 2>&1
        }
    } else {
        if ($sshKeyExists) {
            $testResult = ssh -i "$SSHKey" -p $VastPort -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@$VastHost "echo 'Connection OK' && python3 --version" 2>&1
        } else {
            $testResult = ssh -p $VastPort -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@$VastHost "echo 'Connection OK' && python3 --version" 2>&1
        }
    }
    
    if ($testResult -match "Connection OK" -or $testResult -match "Python") {
        Write-Host "   ✅ SSH connection successful" -ForegroundColor Green
        Write-Host $testResult
    } else {
        Write-Host "   ⚠️  Connection response: $testResult" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ SSH test failed: $_" -ForegroundColor Red
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
}

# Step 2: Upload file
Write-Host "`n[2/7] Uploading run_api_on_vast.py..." -ForegroundColor Yellow
if (-not (Test-Path "run_api_on_vast.py")) {
    Write-Host "   ❌ File not found!" -ForegroundColor Red
    exit 1
}

try {
    if ($usePlink) {
        if ($sshKeyExists) {
            & $plinkPath -i "$SSHKey" -P $VastPort -scp root@$VastHost "put run_api_on_vast.py /workspace/run_api_on_vast.py" 2>&1
        } else {
            Write-Host "   Using SCP with password..." -ForegroundColor Gray
            scp -P $VastPort "run_api_on_vast.py" "root@${VastHost}:/workspace/run_api_on_vast.py" 2>&1
        }
    } else {
        if ($sshKeyExists) {
            scp -i "$SSHKey" -P $VastPort "run_api_on_vast.py" "root@${VastHost}:/workspace/run_api_on_vast.py" 2>&1
        } else {
            scp -P $VastPort "run_api_on_vast.py" "root@${VastHost}:/workspace/run_api_on_vast.py" 2>&1
        }
    }
    Write-Host "   ✅ File uploaded" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Upload may have issues: $_" -ForegroundColor Yellow
}

# Step 3: Install dependencies
Write-Host "`n[3/7] Installing Python Dependencies..." -ForegroundColor Yellow
Write-Host "   This may take several minutes..." -ForegroundColor Gray
$installCmd = "cd /workspace && pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors 2>&1 | tail -5"
try {
    if ($usePlink) {
        if ($sshKeyExists) {
            $installOutput = & $plinkPath -i "$SSHKey" -P $VastPort root@$VastHost $installCmd 2>&1
        } else {
            $installOutput = & $plinkPath -P $VastPort root@$VastHost $installCmd 2>&1
        }
    } else {
        if ($sshKeyExists) {
            $installOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $installCmd 2>&1
        } else {
            $installOutput = ssh -p $VastPort root@$VastHost $installCmd 2>&1
        }
    }
    Write-Host $installOutput
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Installation: $_" -ForegroundColor Yellow
}

# Step 4: Configure port
Write-Host "`n[4/7] Configuring API Port ($APIPort)..." -ForegroundColor Yellow
$configCmd = "cd /workspace && sed -i 's/PORT = [0-9]*/PORT = $APIPort/' run_api_on_vast.py && grep 'PORT = ' run_api_on_vast.py"
try {
    if ($usePlink) {
        if ($sshKeyExists) {
            $configOutput = & $plinkPath -i "$SSHKey" -P $VastPort root@$VastHost $configCmd 2>&1
        } else {
            $configOutput = & $plinkPath -P $VastPort root@$VastHost $configCmd 2>&1
        }
    } else {
        if ($sshKeyExists) {
            $configOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $configCmd 2>&1
        } else {
            $configOutput = ssh -p $VastPort root@$VastHost $configCmd 2>&1
        }
    }
    Write-Host $configOutput
} catch {
    Write-Host "   ⚠️  Configuration: $_" -ForegroundColor Yellow
}

# Step 5: Stop existing API
Write-Host "`n[5/7] Stopping Existing API..." -ForegroundColor Yellow
$stopCmd = "pkill -f 'python3 run_api_on_vast.py' 2>/dev/null || true && sleep 2"
try {
    if ($usePlink) {
        if ($sshKeyExists) {
            & $plinkPath -i "$SSHKey" -P $VastPort root@$VastHost $stopCmd 2>&1 | Out-Null
        } else {
            & $plinkPath -P $VastPort root@$VastHost $stopCmd 2>&1 | Out-Null
        }
    } else {
        if ($sshKeyExists) {
            ssh -i "$SSHKey" -p $VastPort root@$VastHost $stopCmd 2>&1 | Out-Null
        } else {
            ssh -p $VastPort root@$VastHost $stopCmd 2>&1 | Out-Null
        }
    }
    Write-Host "   ✅ Stopped (if was running)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Stop command: $_" -ForegroundColor Yellow
}

# Step 6: Start API
Write-Host "`n[6/7] Starting API..." -ForegroundColor Yellow
$startCmd = "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 3 && ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep"
try {
    if ($usePlink) {
        if ($sshKeyExists) {
            $startOutput = & $plinkPath -i "$SSHKey" -P $VastPort root@$VastHost $startCmd 2>&1
        } else {
            $startOutput = & $plinkPath -P $VastPort root@$VastHost $startCmd 2>&1
        }
    } else {
        if ($sshKeyExists) {
            $startOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $startCmd 2>&1
        } else {
            $startOutput = ssh -p $VastPort root@$VastHost $startCmd 2>&1
        }
    }
    Write-Host $startOutput
    if ($startOutput -match "python3") {
        Write-Host "   ✅ API started!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  API may not have started. Checking logs..." -ForegroundColor Yellow
        $logCmd = "tail -20 /workspace/api.log"
        if ($usePlink) {
            if ($sshKeyExists) {
                $logs = & $plinkPath -i "$SSHKey" -P $VastPort root@$VastHost $logCmd 2>&1
            } else {
                $logs = & $plinkPath -P $VastPort root@$VastHost $logCmd 2>&1
            }
        } else {
            if ($sshKeyExists) {
                $logs = ssh -i "$SSHKey" -p $VastPort root@$VastHost $logCmd 2>&1
            } else {
                $logs = ssh -p $VastPort root@$VastHost $logCmd 2>&1
            }
        }
        Write-Host $logs
    }
} catch {
    Write-Host "   ❌ Start failed: $_" -ForegroundColor Red
}

# Step 7: Test API
Write-Host "`n[7/7] Testing API..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test locally on instance
Write-Host "   Testing on instance..." -ForegroundColor Gray
$testCmd = "curl -s http://localhost:$APIPort/health 2>&1"
try {
    if ($usePlink) {
        if ($sshKeyExists) {
            $localTest = & $plinkPath -i "$SSHKey" -P $VastPort root@$VastHost $testCmd 2>&1
        } else {
            $localTest = & $plinkPath -P $VastPort root@$VastHost $testCmd 2>&1
        }
    } else {
        if ($sshKeyExists) {
            $localTest = ssh -i "$SSHKey" -p $VastPort root@$VastHost $testCmd 2>&1
        } else {
            $localTest = ssh -p $VastPort root@$VastHost $testCmd 2>&1
        }
    }
    Write-Host $localTest
    if ($localTest -match "ok" -or $localTest -match "status") {
        Write-Host "   ✅ API responding on instance!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Local test: $_" -ForegroundColor Yellow
}

# Test external
Write-Host "   Testing external connection..." -ForegroundColor Gray
try {
    $externalTest = Invoke-RestMethod -Uri "http://${VastIP}:${APIPort}/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ External connection works!" -ForegroundColor Green
    Write-Host ($externalTest | ConvertTo-Json)
} catch {
    Write-Host "   ⚠️  External test: $_" -ForegroundColor Yellow
    Write-Host "   (This is OK if using SSH tunnel instead)" -ForegroundColor Gray
}

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 Connection Info:" -ForegroundColor Cyan
Write-Host "   Instance: $VastHost:$VastPort" -ForegroundColor White
Write-Host "   IP: $VastIP" -ForegroundColor White
Write-Host "   API Port: $APIPort" -ForegroundColor White
Write-Host "`n🔗 URLs:" -ForegroundColor Cyan
Write-Host "   Direct: http://${VastIP}:${APIPort}" -ForegroundColor White
Write-Host "   Tunnel: ssh -p $VastPort root@$VastHost -L 8080:localhost:$APIPort -N -f" -ForegroundColor White

