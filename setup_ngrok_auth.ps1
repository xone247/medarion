# PowerShell script to configure ngrok authentication
# ngrok uses an authtoken (not SSH key) for authentication

Write-Host "🔐 ngrok Authentication Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokInstalled) {
    Write-Host "❌ ngrok is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Please install ngrok first:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://ngrok.com/download" -ForegroundColor White
    Write-Host "   2. Extract and add to PATH" -ForegroundColor White
    exit 1
}

Write-Host "✅ ngrok is installed" -ForegroundColor Green
Write-Host ""

# Check if already authenticated
$ngrokConfig = "$env:USERPROFILE\.ngrok2\ngrok.yml"
if (Test-Path $ngrokConfig) {
    $configContent = Get-Content $ngrokConfig -Raw
    if ($configContent -match "authtoken:\s*[a-zA-Z0-9_]+") {
        Write-Host "✅ ngrok is already authenticated" -ForegroundColor Green
        Write-Host ""
        Write-Host "Current authtoken is configured." -ForegroundColor White
        Write-Host ""
        $update = Read-Host "Do you want to update it? (y/n)"
        if ($update -ne "y" -and $update -ne "Y") {
            Write-Host "✅ Keeping existing configuration" -ForegroundColor Green
            exit 0
        }
    }
}

Write-Host "📋 To get your ngrok authtoken:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Sign up/Login at: https://dashboard.ngrok.com/signup" -ForegroundColor White
Write-Host "   2. Go to: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
Write-Host "   3. Copy your authtoken" -ForegroundColor White
Write-Host ""

# Prompt for authtoken
$authtoken = Read-Host "Enter your ngrok authtoken"

if ([string]::IsNullOrWhiteSpace($authtoken)) {
    Write-Host "❌ Authtoken cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Configuring ngrok..." -ForegroundColor Cyan

# Configure ngrok with authtoken
try {
    $result = ngrok config add-authtoken $authtoken 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ngrok authentication configured successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 You can now use ngrok!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Start your servers: npm start" -ForegroundColor White
        Write-Host "   2. Run: .\start_ngrok_simple.ps1" -ForegroundColor White
    } else {
        Write-Host "❌ Failed to configure ngrok" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error configuring ngrok: $_" -ForegroundColor Red
    exit 1
}

