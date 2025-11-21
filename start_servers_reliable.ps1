# Reliable Server Startup Script for Medarion Platform
# This script ensures both servers start properly

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "🚀 MEDARION PLATFORM - RELIABLE SERVER STARTUP" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location $PSScriptRoot

# Stop any existing processes
Write-Host "🛑 Stopping existing servers..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ Existing processes stopped" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm not found!" -ForegroundColor Red
    exit 1
}

# Check server .env
$envFile = "server\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "`n⚠️  Creating server/.env file..." -ForegroundColor Yellow
    @"
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medarion_platform
DB_USER=root
DB_PASSWORD=
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
AI_MODE=vast
VAST_AI_URL=http://localhost:8081
"@ | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "   ✅ Created server/.env" -ForegroundColor Green
} else {
    Write-Host "   ✅ Found server/.env" -ForegroundColor Green
}

# Check for syntax errors
Write-Host "`n🔍 Checking for syntax errors..." -ForegroundColor Cyan
Set-Location server
$syntaxErrors = $false
$files = @("server.js", "routes/blog.js", "routes/ai.js", "services/vastAiService.js")
foreach ($file in $files) {
    node -c $file 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Syntax error in $file" -ForegroundColor Red
        $syntaxErrors = $true
    }
}
Set-Location ..

if ($syntaxErrors) {
    Write-Host "`n❌ Please fix syntax errors before starting servers!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "   ✅ No syntax errors" -ForegroundColor Green
}

# Check ports
Write-Host "`n🔍 Checking ports..." -ForegroundColor Cyan
$port3001 = netstat -ano | findstr ":3001" | findstr "LISTENING"
$port5173 = netstat -ano | findstr ":5173" | findstr "LISTENING"

if ($port3001) {
    Write-Host "   ⚠️  Port 3001 is in use - will try to stop it" -ForegroundColor Yellow
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}
if ($port5173) {
    Write-Host "   ⚠️  Port 5173 is in use - will try to stop it" -ForegroundColor Yellow
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "🚀 STARTING SERVERS" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Start Backend Server
Write-Host "1️⃣ Starting Backend Server (Node.js - Port 3001)..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-Command", "cd '$backendPath'; Write-Host '🚀 Backend Server (Node.js) - Port 3001' -ForegroundColor Green; Write-Host 'Starting...' -ForegroundColor Yellow; Write-Host ''; `$env:NODE_ENV='development'; node server.js" -WindowStyle Normal
Write-Host "   ✅ Backend server window opened" -ForegroundColor Green
Start-Sleep -Seconds 5

# Wait for backend to start
Write-Host "`n⏳ Waiting for backend to start..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 1; $i -le 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   ✅ Backend is running! (took $i seconds)" -ForegroundColor Green
        $backendReady = $true
        break
    } catch {
        Write-Host "   ⏳ Waiting... ($i/15)" -ForegroundColor Gray -NoNewline
        Write-Host "`r" -NoNewline
    }
}
Write-Host ""

if (-not $backendReady) {
    Write-Host "   ⚠️  Backend may still be starting - check the backend window" -ForegroundColor Yellow
}

# Test categories endpoint
Write-Host "`n🧪 Testing categories endpoint..." -ForegroundColor Cyan
try {
    $categories = Invoke-RestMethod -Uri "http://localhost:3001/api/blog/categories" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Categories endpoint working! Found $($categories.categories.Count) categories" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Categories endpoint not ready yet: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Start Frontend Server
Write-Host "`n2️⃣ Starting Frontend Server (Vite - Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-Command", "cd '$PSScriptRoot'; Write-Host '🚀 Frontend Server (Vite) - Port 5173' -ForegroundColor Green; Write-Host 'Starting...' -ForegroundColor Yellow; Write-Host ''; npm run dev" -WindowStyle Normal
Write-Host "   ✅ Frontend server window opened" -ForegroundColor Green
Start-Sleep -Seconds 8

# Wait for frontend to start
Write-Host "`n⏳ Waiting for frontend to start..." -ForegroundColor Yellow
$frontendReady = $false
for ($i = 1; $i -le 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   ✅ Frontend is running! (took $i seconds)" -ForegroundColor Green
        $frontendReady = $true
        break
    } catch {
        Write-Host "   ⏳ Waiting... ($i/20)" -ForegroundColor Gray -NoNewline
        Write-Host "`r" -NoNewline
    }
}
Write-Host ""

if (-not $frontendReady) {
    Write-Host "   ⚠️  Frontend may still be starting - check the frontend window" -ForegroundColor Yellow
}

# Start Vast.ai SSH Tunnel (for AI functionality)
Write-Host "`n3️⃣ Starting Vast.ai SSH Tunnel (Port 8081)..." -ForegroundColor Cyan
$tunnelScript = Join-Path $PSScriptRoot "start_vast_tunnel_auto.ps1"
if (Test-Path $tunnelScript) {
    # Check if tunnel is already running
    $existingTunnel = netstat -ano | findstr ":8081" | findstr "LISTENING"
    if ($existingTunnel) {
        Write-Host "   ✅ Vast.ai tunnel is already running" -ForegroundColor Green
    } else {
        Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-Command", "cd '$PSScriptRoot'; Write-Host '🚀 Vast.ai SSH Tunnel - Port 8081' -ForegroundColor Green; Write-Host 'Starting...' -ForegroundColor Yellow; Write-Host ''; Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; .\start_vast_tunnel_auto.ps1" -WindowStyle Normal
        Write-Host "   ✅ Vast.ai tunnel window opened" -ForegroundColor Green
        Write-Host "   ⚠️  Note: Tunnel may require SSH authentication - check the tunnel window" -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host "   ⚠️  Vast.ai tunnel script not found: $tunnelScript" -ForegroundColor Yellow
}

# Final Summary
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "✅ SERVER STARTUP COMPLETE" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Server Status:" -ForegroundColor Cyan
Write-Host "   • Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   • Blog:     http://localhost:5173/arion" -ForegroundColor White
Write-Host "   • Vast.ai Tunnel: localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test Endpoints:" -ForegroundColor Cyan
Write-Host "   • Health:   http://localhost:3001/health" -ForegroundColor White
Write-Host "   • Categories: http://localhost:3001/api/blog/categories" -ForegroundColor White
Write-Host "   • Vast.ai Health: http://localhost:8081/health" -ForegroundColor White
Write-Host ""
Write-Host "💡 Check the PowerShell windows for server output" -ForegroundColor Yellow
Write-Host "   Note: Vast.ai tunnel may require SSH password authentication" -ForegroundColor Yellow
Write-Host ""

