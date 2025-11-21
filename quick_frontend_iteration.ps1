# Quick Frontend Iteration Workflow
# Fastest way to see frontend changes on live site

param(
    [switch]$Watch,  # Watch mode - auto-deploy on changes
    [switch]$Build,  # Just build, don't deploy
    [switch]$Deploy  # Just deploy (assumes already built)
)

$ErrorActionPreference = "Continue"

Write-Host "`n⚡ Quick Frontend Iteration" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

if ($Watch) {
    Write-Host "`n👀 Starting watch mode..." -ForegroundColor Yellow
    Write-Host "   This will watch for changes and auto-deploy" -ForegroundColor Gray
    Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    & ".\watch_and_deploy.ps1"
    exit 0
}

if ($Build) {
    Write-Host "`n🔨 Building frontend..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build complete!" -ForegroundColor Green
        Write-Host "   💡 Run with -Deploy to upload, or -Watch for auto-deploy" -ForegroundColor Gray
    }
    exit 0
}

if ($Deploy) {
    Write-Host "`n📤 Deploying frontend..." -ForegroundColor Yellow
    & ".\deploy_frontend_fast.ps1"
    exit 0
}

# Default: Build and Deploy
Write-Host "`n🚀 Building and Deploying Frontend" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

& ".\deploy_frontend_fast.ps1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n💡 Tips for faster iteration:" -ForegroundColor Cyan
    Write-Host "   • Use -Watch for auto-deploy on changes" -ForegroundColor White
    Write-Host "   • Use -Build to just build locally" -ForegroundColor White
    Write-Host "   • Use -Deploy to deploy existing build" -ForegroundColor White
    Write-Host "`n📝 Example:" -ForegroundColor Cyan
    Write-Host "   .\quick_frontend_iteration.ps1 -Watch" -ForegroundColor Yellow
}

