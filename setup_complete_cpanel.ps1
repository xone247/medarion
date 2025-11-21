# Complete cPanel Setup Script for Medarion
# This master script automates the entire cPanel setup process

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipNodeJS = $false,
    [switch]$DryRun = $false
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Medarion Complete cPanel Setup & Deployment         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$configFile = "cpanel-config.json"

# Step 1: Check/Create Configuration
Write-Host "📋 Step 1: Checking Configuration..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $configFile)) {
    Write-Host "⚠️  Configuration file not found" -ForegroundColor Yellow
    Write-Host "   Creating from template..." -ForegroundColor Gray
    
    Copy-Item "cpanel-config.json.example" $configFile -ErrorAction SilentlyContinue
    
    if (-not (Test-Path $configFile)) {
        Write-Host "❌ Could not create config file. Please create cpanel-config.json manually." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Created $configFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit $configFile with your cPanel credentials!" -ForegroundColor Yellow
    Write-Host "   Press any key after you've updated the configuration..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host ""
}

# Load and validate config
try {
    $config = Get-Content $configFile -Raw | ConvertFrom-Json
    if ($config.ftp.host -eq "ftp.yourdomain.com") {
        Write-Host "❌ Please configure your FTP settings in $configFile" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Configuration loaded" -ForegroundColor Green
} catch {
    Write-Host "❌ Error reading configuration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Build Frontend
if (-not $SkipBuild) {
    Write-Host "📦 Step 2: Building Frontend..." -ForegroundColor Yellow
    Write-Host ""
    
    if (-not (Test-Path "package.json")) {
        Write-Host "❌ package.json not found. Are you in the project root?" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   Running: npm run build" -ForegroundColor Gray
    $buildResult = npm run build 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        Write-Host $buildResult
        exit 1
    }
    
    Write-Host "✅ Frontend built successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Step 2: Skipping frontend build" -ForegroundColor Gray
    Write-Host ""
}

# Step 3: Prepare Node.js App
if (-not $SkipNodeJS) {
    Write-Host "🔧 Step 3: Preparing Node.js Application..." -ForegroundColor Yellow
    Write-Host ""
    
    & ".\setup_cpanel_nodejs.ps1" -ConfigFile $configFile -GenerateOnly
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Node.js app preparation failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Node.js app prepared" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Step 3: Skipping Node.js preparation" -ForegroundColor Gray
    Write-Host ""
}

# Step 4: Summary and Next Steps
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    Setup Complete!                       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📁 Files Ready for Deployment:" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipBuild) {
    Write-Host "   ✅ Frontend: medarion-dist/" -ForegroundColor Green
    Write-Host "      → Upload to: public_html/" -ForegroundColor Gray
}

if (-not $SkipNodeJS) {
    Write-Host "   ✅ Node.js App: cpanel-nodejs-app/" -ForegroundColor Green
    Write-Host "      → Upload to: [Your Node.js App Root from cPanel]" -ForegroundColor Gray
}

Write-Host "   ✅ PHP API: api/" -ForegroundColor Green
Write-Host "      → Upload to: public_html/api/" -ForegroundColor Gray

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""

if (-not $SkipNodeJS) {
    Write-Host "   1. Set up Node.js in cPanel:" -ForegroundColor White
    Write-Host "      a. Go to: Software → Node.js Selector" -ForegroundColor Gray
    Write-Host "      b. Create Application (see CPANEL_NODEJS_SETUP_GUIDE.md)" -ForegroundColor Gray
    Write-Host "      c. Note the Application Root path" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Deploy Node.js app:" -ForegroundColor White
    Write-Host "      .\deploy_nodejs_to_cpanel.ps1" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "   3. Deploy frontend and PHP:" -ForegroundColor White
Write-Host "      .\deploy_to_cpanel.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "   4. Configure database:" -ForegroundColor White
Write-Host "      - Update config/database.php with production credentials" -ForegroundColor Gray
Write-Host "      - Upload to public_html/config/" -ForegroundColor Gray
Write-Host ""

Write-Host "   5. Set environment variables in cPanel Node.js Selector" -ForegroundColor White
Write-Host ""

Write-Host "   6. Start Node.js application in cPanel" -ForegroundColor White
Write-Host ""

Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   - CPANEL_NODEJS_SETUP_GUIDE.md (Node.js setup)" -ForegroundColor Gray
Write-Host "   - CPANEL_DEPLOYMENT_GUIDE.md (General deployment)" -ForegroundColor Gray
Write-Host "   - README_CPANEL.md (Quick reference)" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No files were actually deployed" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "💡 Tip: You can run individual scripts:" -ForegroundColor Cyan
Write-Host "   - setup_cpanel_nodejs.ps1 (prepare Node.js app)" -ForegroundColor Gray
Write-Host "   - deploy_nodejs_to_cpanel.ps1 (upload Node.js app)" -ForegroundColor Gray
Write-Host "   - deploy_to_cpanel.ps1 (upload frontend & PHP)" -ForegroundColor Gray
Write-Host ""

