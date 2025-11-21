# Test Vast.ai SSH Connections and Endpoints
# This script tests different SSH connection methods and verifies endpoints

param(
    [Parameter(Mandatory=$false)]
    [string[]]$SshCommands = @()
)

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     VAST.AI SSH CONNECTION & ENDPOINT TESTER              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check for SSH key
$sshKeyPath = "$env:USERPROFILE\.ssh\vast_ai_key"
$hasKey = Test-Path $sshKeyPath

# Default SSH commands to test (if none provided)
if ($SshCommands.Count -eq 0) {
    $SshCommands = @(
        "ssh -p 31731 root@ssh7.vast.ai -L 8080:localhost:8080",
        "ssh -p 37792 root@194.228.55.129 -L 8080:localhost:8080",
        "ssh -p 31731 root@ssh7.vast.ai -L 8081:localhost:8080",
        "ssh -p 37792 root@194.228.55.129 -L 8081:localhost:8080"
    )
}

$results = @()

foreach ($sshCmd in $SshCommands) {
    Write-Host "`n=== Testing SSH Command ===" -ForegroundColor Yellow
    Write-Host "Command: $sshCmd" -ForegroundColor Cyan
    
    # Extract local port from command
    $localPort = if ($sshCmd -match "-L\s+(\d+):") { $matches[1] } else { "8080" }
    $remotePort = if ($sshCmd -match "-L\s+\d+:localhost:(\d+)") { $matches[1] } else { "8080" }
    
    Write-Host "Local Port: $localPort" -ForegroundColor Gray
    Write-Host "Remote Port: $remotePort" -ForegroundColor Gray
    
    # Stop any existing tunnel on this port
    $existing = Get-NetTCPConnection -LocalPort $localPort -ErrorAction SilentlyContinue
    if ($existing) {
        foreach ($conn in $existing) {
            try {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            } catch { }
        }
        Start-Sleep -Seconds 2
    }
    
    # Add SSH key if available
    $finalCmd = $sshCmd
    if ($hasKey -and $sshCmd -notmatch "-i") {
        $finalCmd = $sshCmd -replace "ssh ", "ssh -i `"$sshKeyPath`" "
    }
    
    # Add -N flag if not present (no command execution)
    if ($finalCmd -notmatch "-N\b") {
        $finalCmd = "$finalCmd -N"
    }
    
    Write-Host "Final Command: $finalCmd" -ForegroundColor Gray
    
    # Start SSH tunnel in background
    Write-Host "Starting tunnel..." -ForegroundColor Yellow
    try {
        # Split command properly
        $cmdParts = ($finalCmd -replace "^ssh\s+", "").Split(" ") | Where-Object { $_ -ne "" }
        $process = Start-Process -FilePath "ssh" -ArgumentList $cmdParts -PassThru -WindowStyle Hidden -ErrorAction Stop
        Write-Host "[OK] Tunnel process started (PID: $($process.Id))" -ForegroundColor Green
        
        # Wait longer and check if process is still running
        Write-Host "Waiting for tunnel to establish (15 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Check if process is still running
        $stillRunning = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
        if (-not $stillRunning) {
            Write-Host "[WARNING] Tunnel process exited - may need authentication" -ForegroundColor Yellow
            Write-Host "   Try running manually to see errors:" -ForegroundColor Gray
            Write-Host "   $finalCmd" -ForegroundColor Gray
        }
        
        Start-Sleep -Seconds 5
    } catch {
        Write-Host "[ERROR] Failed to start tunnel: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    
    # Test endpoints
    $endpointResults = @{}
    $baseUrl = "http://localhost:$localPort"
    
    Write-Host "`nTesting endpoints on $baseUrl..." -ForegroundColor Yellow
    
    # Check if port is listening first
    $portListening = Get-NetTCPConnection -LocalPort $localPort -State Listen -ErrorAction SilentlyContinue
    if (-not $portListening) {
        Write-Host "  [WARNING] Port $localPort is not listening - tunnel may not be connected" -ForegroundColor Yellow
        Write-Host "  Check if SSH authentication is required" -ForegroundColor Gray
    }
    
    # Test /health
    Write-Host "  1. Testing /health..." -ForegroundColor Cyan
    try {
        $health = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        $healthData = $health.Content | ConvertFrom-Json
        $endpointResults["/health"] = @{
            Status = "OK"
            Code = $health.StatusCode
            Data = $healthData
        }
        Write-Host "      [OK] /health works" -ForegroundColor Green
        Write-Host "         Status: $($healthData.status)" -ForegroundColor Gray
        if ($healthData.gpu) { Write-Host "         GPU: $($healthData.gpu)" -ForegroundColor Gray }
    } catch {
        $endpointResults["/health"] = @{
            Status = "FAIL"
            Error = $_.Exception.Message
        }
        $errorMsg = $_.Exception.Message
        if ($errorMsg -like "*timeout*") {
            Write-Host "      [FAIL] /health: Timeout - tunnel may not be connected" -ForegroundColor Red
        } else {
            Write-Host "      [FAIL] /health: $errorMsg" -ForegroundColor Red
        }
    }
    
    # Test /ping
    Write-Host "  2. Testing /ping..." -ForegroundColor Cyan
    try {
        $ping = Invoke-WebRequest -Uri "$baseUrl/ping" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $endpointResults["/ping"] = @{
            Status = "OK"
            Code = $ping.StatusCode
            Data = $ping.Content
        }
        Write-Host "      [OK] /ping works" -ForegroundColor Green
    } catch {
        $endpointResults["/ping"] = @{
            Status = "FAIL"
            Error = $_.Exception.Message
        }
        Write-Host "      [FAIL] /ping: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test /chat
    Write-Host "  3. Testing /chat..." -ForegroundColor Cyan
    try {
        $chatBody = @{
            messages = @(
                @{ role = "user"; content = "Hello, test" }
            )
            temperature = 0.7
            max_tokens = 50
        } | ConvertTo-Json -Depth 10
        
        $chat = Invoke-WebRequest -Uri "$baseUrl/chat" -Method POST -Body $chatBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        $chatData = $chat.Content | ConvertFrom-Json
        $endpointResults["/chat"] = @{
            Status = "OK"
            Code = $chat.StatusCode
            HasChoices = ($chatData.choices -ne $null)
            ResponseLength = if ($chatData.choices) { $chatData.choices[0].message.content.Length } else { 0 }
        }
        Write-Host "      [OK] /chat works" -ForegroundColor Green
        Write-Host "         Response length: $($endpointResults["/chat"].ResponseLength) chars" -ForegroundColor Gray
    } catch {
        $endpointResults["/chat"] = @{
            Status = "FAIL"
            Error = $_.Exception.Message
        }
        Write-Host "      [FAIL] /chat: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test /generate
    Write-Host "  4. Testing /generate..." -ForegroundColor Cyan
    try {
        $genBody = @{
            prompt = "Test prompt"
            max_tokens = 50
        } | ConvertTo-Json
        
        $gen = Invoke-WebRequest -Uri "$baseUrl/generate" -Method POST -Body $genBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        $endpointResults["/generate"] = @{
            Status = "OK"
            Code = $gen.StatusCode
        }
        Write-Host "      [OK] /generate works" -ForegroundColor Green
    } catch {
        $endpointResults["/generate"] = @{
            Status = "FAIL"
            Error = $_.Exception.Message
        }
        Write-Host "      [FAIL] /generate: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Calculate success rate
    $successCount = ($endpointResults.Values | Where-Object { $_.Status -eq "OK" }).Count
    $totalCount = $endpointResults.Count
    $successRate = if ($totalCount -gt 0) { ($successCount / $totalCount) * 100 } else { 0 }
    
    $results += @{
        Command = $sshCmd
        LocalPort = $localPort
        RemotePort = $remotePort
        ProcessId = $process.Id
        Endpoints = $endpointResults
        SuccessRate = $successRate
        Working = ($successRate -ge 75) # At least 75% endpoints working
    }
    
    Write-Host "`n  Success Rate: $([math]::Round($successRate, 1))%" -ForegroundColor $(if ($successRate -ge 75) { "Green" } else { "Yellow" })
    
    # Stop this tunnel before testing next
    try {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    } catch { }
}

# Summary
Write-Host "`n`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    TEST RESULTS SUMMARY                    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

$workingConnections = $results | Where-Object { $_.Working }
if ($workingConnections) {
    Write-Host "✅ WORKING CONNECTIONS:" -ForegroundColor Green
    foreach ($result in $workingConnections) {
        Write-Host "`n  Command: $($result.Command)" -ForegroundColor Cyan
        Write-Host "  Local Port: $($result.LocalPort)" -ForegroundColor Gray
        Write-Host "  Success Rate: $([math]::Round($result.SuccessRate, 1))%" -ForegroundColor Green
        Write-Host "  Endpoints:" -ForegroundColor Yellow
        foreach ($endpoint in $result.Endpoints.GetEnumerator()) {
            $status = if ($endpoint.Value.Status -eq "OK") { "✅" } else { "❌" }
            Write-Host "    $status $($endpoint.Key): $($endpoint.Value.Status)" -ForegroundColor $(if ($endpoint.Value.Status -eq "OK") { "Green" } else { "Red" })
        }
    }
    
    # Pick the best one
    $best = $workingConnections | Sort-Object -Property SuccessRate -Descending | Select-Object -First 1
    Write-Host "`n🎯 BEST CONNECTION:" -ForegroundColor Green
    Write-Host "  Command: $($best.Command)" -ForegroundColor Cyan
    Write-Host "  Local Port: $($best.LocalPort)" -ForegroundColor Cyan
    Write-Host "  Success Rate: $([math]::Round($best.SuccessRate, 1))%" -ForegroundColor Green
    
    Write-Host "`n📝 Configuration for application:" -ForegroundColor Yellow
    Write-Host "  VAST_AI_URL=http://localhost:$($best.LocalPort)" -ForegroundColor White
    Write-Host "  SSH Command: $($best.Command) -N" -ForegroundColor White
} else {
    Write-Host "❌ NO WORKING CONNECTIONS FOUND" -ForegroundColor Red
    Write-Host "`nAll tested connections failed. Please check:" -ForegroundColor Yellow
    Write-Host "  • SSH credentials" -ForegroundColor White
    Write-Host "  • Network connectivity" -ForegroundColor White
    Write-Host "  • Vast.ai instance status" -ForegroundColor White
}

Write-Host ""

