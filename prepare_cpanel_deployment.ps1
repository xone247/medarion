# Prepare Clean Application for cPanel Deployment
# Excludes unnecessary files and creates deployment package

$ErrorActionPreference = "Continue"

Write-Host "`n📦 Preparing Clean Application for cPanel..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$rootPath = Get-Location
$deployPath = Join-Path $rootPath "cpanel-deploy"
$excludePatterns = @(
    "node_modules",
    ".git",
    ".gitignore",
    ".env.local",
    ".env.development",
    "*.log",
    "*.md",
    "dist",
    "build",
    ".next",
    ".vscode",
    ".idea",
    "deploy",
    "docs",
    "test_*.ps1",
    "*.ppk",
    "*.pem",
    "*.key",
    "cpanel-config.json",
    "config.json",
    "*.ps1",
    "*.sh",
    "__pycache__",
    "*.pyc",
    ".DS_Store",
    "Thumbs.db",
    "run_api_on_vast.py",
    "test_*.py",
    "diagnose_*.py",
    "download_*.py",
    "port_forward.py",
    "setup_*.sh",
    "*.tar.gz",
    "backups",
    "temp",
    "tmp"
)

# Directories to always include (even if they match exclude patterns)
$alwaysInclude = @(
    "server",
    "public",
    "package.json",
    "package-lock.json"
)

Write-Host "`n📋 Files/Directories to Exclude:" -ForegroundColor Yellow
$excludePatterns | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }

# Remove old deployment directory
if (Test-Path $deployPath) {
    Write-Host "`n🧹 Cleaning old deployment directory..." -ForegroundColor Yellow
    Remove-Item -Path $deployPath -Recurse -Force
}

# Create deployment directory
New-Item -ItemType Directory -Path $deployPath -Force | Out-Null
Write-Host "`n📁 Created deployment directory: $deployPath" -ForegroundColor Green

# Copy files
Write-Host "`n📤 Copying files..." -ForegroundColor Cyan

$filesCopied = 0
$filesSkipped = 0

Get-ChildItem -Path $rootPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($rootPath.Length + 1)
    $shouldExclude = $false
    
    # Check if file matches exclude patterns
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -like "*$pattern*") {
            $shouldExclude = $true
            break
        }
    }
    
    # Check if file is in always include list
    $shouldInclude = $false
    foreach ($include in $alwaysInclude) {
        if ($relativePath -like "*$include*") {
            $shouldInclude = $true
            break
        }
    }
    
    if ($shouldInclude -or -not $shouldExclude) {
        $destPath = Join-Path $deployPath $relativePath
        $destDir = Split-Path $destPath -Parent
        
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item -Path $_.FullName -Destination $destPath -Force
        $filesCopied++
    } else {
        $filesSkipped++
    }
}

# Copy directories that should be included
$includeDirs = @("server", "public", "routes", "services", "middleware", "config", "utils")
foreach ($dir in $includeDirs) {
    $sourceDir = Join-Path $rootPath $dir
    if (Test-Path $sourceDir) {
        $destDir = Join-Path $deployPath $dir
        Write-Host "   Copying directory: $dir" -ForegroundColor Gray
        Copy-Item -Path $sourceDir -Destination $destDir -Recurse -Force -Exclude $excludePatterns
    }
}

# Ensure package.json is included
if (Test-Path "package.json") {
    Copy-Item -Path "package.json" -Destination (Join-Path $deployPath "package.json") -Force
    Write-Host "   ✅ package.json included" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Copy-Item -Path "package-lock.json" -Destination (Join-Path $deployPath "package-lock.json") -Force
    Write-Host "   ✅ package-lock.json included" -ForegroundColor Green
}

# Create .gitignore for deployment
$gitignoreContent = @"
node_modules/
.env.local
*.log
.DS_Store
Thumbs.db
"@
$gitignoreContent | Out-File -FilePath (Join-Path $deployPath ".gitignore") -Encoding UTF8

Write-Host "`n✅ Deployment Package Created!" -ForegroundColor Green
Write-Host "   Location: $deployPath" -ForegroundColor Gray
Write-Host "   Files copied: $filesCopied" -ForegroundColor Gray
Write-Host "   Files skipped: $filesSkipped" -ForegroundColor Gray

# Show directory structure
Write-Host "`n📁 Deployment Structure:" -ForegroundColor Cyan
Get-ChildItem -Path $deployPath -Directory | ForEach-Object {
    Write-Host "   📂 $($_.Name)" -ForegroundColor White
}
Get-ChildItem -Path $deployPath -File | Select-Object -First 10 | ForEach-Object {
    Write-Host "   📄 $($_.Name)" -ForegroundColor Gray
}

Write-Host "`n💡 Next: Use sync-to-cpanel.ps1 to deploy this clean package" -ForegroundColor Yellow

