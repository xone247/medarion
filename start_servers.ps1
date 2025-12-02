# Start Local Development Servers
# Starts both backend and frontend servers

Write-Host "🚀 Starting Medarion Development Servers" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "server\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    cd server
    npm install
    cd ..
}

# Check if .env exists
if (-not (Test-Path "server\.env")) {
    Write-Host "⚠️  Warning: server\.env not found. Backend may not start correctly." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting servers..." -ForegroundColor Cyan
Write-Host "   Backend: http://localhost:3001" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start both servers using concurrently (from package.json)
npm start

