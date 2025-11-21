# Complete Git Setup - After GitHub Authentication
# This script completes the repository setup and first commit

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Completing Git & GitHub Setup" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# ============================================================
# Step 1: Verify GitHub Authentication
# ============================================================
Write-Host "`n[Step 1/5] Verifying GitHub Authentication" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$ghAuthenticated = $false
try {
    $ghUser = gh api user --jq .login 2>&1
    if ($LASTEXITCODE -eq 0 -and $ghUser -and $ghUser -notmatch "error" -and $ghUser -notmatch "auth login") {
        Write-Host "   ✅ GitHub CLI authenticated as: $ghUser" -ForegroundColor Green
        $ghAuthenticated = $true
    } else {
        Write-Host "   ⚠️  GitHub CLI authentication not detected" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  GitHub CLI authentication not detected" -ForegroundColor Yellow
}

if (-not $ghAuthenticated) {
    Write-Host "`n   🔐 GitHub authentication required" -ForegroundColor Yellow
    Write-Host "   Please complete authentication, then run this script again." -ForegroundColor White
    Write-Host "   Or we can proceed with manual repository setup." -ForegroundColor White
    Write-Host "`n   Choose:" -ForegroundColor Cyan
    Write-Host "   1. Try authentication again" -ForegroundColor White
    Write-Host "   2. Proceed with manual repository setup (you'll create repo on GitHub.com)" -ForegroundColor White
    $choice = Read-Host "`n   Enter choice (1-2)"
    
    if ($choice -eq "1") {
        Write-Host "`n   Starting GitHub authentication..." -ForegroundColor Cyan
        gh auth login --web
        Start-Sleep -Seconds 3
        $ghUser = gh api user --jq .login 2>&1
        if ($LASTEXITCODE -eq 0 -and $ghUser -and $ghUser -notmatch "error") {
            Write-Host "   ✅ Authenticated as: $ghUser" -ForegroundColor Green
            $ghAuthenticated = $true
        }
    }
}

# ============================================================
# Step 2: Create/Connect GitHub Repository
# ============================================================
Write-Host "`n[Step 2/5] Setting Up GitHub Repository" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$repoUrl = $null
$remoteExists = git remote get-url origin 2>&1

if ($LASTEXITCODE -eq 0 -and $remoteExists -and $remoteExists -notmatch "error") {
    Write-Host "   ✅ Remote repository already configured: $remoteExists" -ForegroundColor Green
    $repoUrl = $remoteExists
} else {
    Write-Host "   📦 Setting up GitHub repository..." -ForegroundColor Cyan
    
    if ($ghAuthenticated) {
        $repoName = Read-Host "   Enter repository name (default: medarion)"
        if (-not $repoName) { $repoName = "medarion" }
        
        $repoDescription = Read-Host "   Enter repository description (optional)"
        $isPrivate = Read-Host "   Make it private? (y/n, default: n)"
        
        $privateFlag = if ($isPrivate -eq "y") { "--private" } else { "--public" }
        $descFlag = if ($repoDescription) { "--description `"$repoDescription`"" } else { "" }
        
        Write-Host "`n   🚀 Creating GitHub repository..." -ForegroundColor Cyan
        $createCmd = "gh repo create $repoName $privateFlag $descFlag --source=. --remote=origin --push=false"
        Invoke-Expression $createCmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Repository created successfully!" -ForegroundColor Green
            try {
                $ghUser = gh api user --jq .login 2>&1
                if ($ghUser -and $ghUser -notmatch "error") {
                    $repoUrl = "https://github.com/$ghUser/$repoName.git"
                    Write-Host "   📋 Repository URL: $repoUrl" -ForegroundColor Cyan
                }
            } catch {
                Write-Host "   📋 Repository created! Check GitHub for the URL." -ForegroundColor Cyan
            }
        } else {
            Write-Host "   ⚠️  Could not create repository automatically" -ForegroundColor Yellow
            Write-Host "   Please create it manually on GitHub.com" -ForegroundColor White
        }
    }
    
    if (-not $repoUrl) {
        Write-Host "`n   📝 Manual Repository Setup:" -ForegroundColor Cyan
        Write-Host "   1. Go to: https://github.com/new" -ForegroundColor White
        Write-Host "   2. Enter repository name (e.g., medarion)" -ForegroundColor White
        Write-Host "   3. Choose public or private" -ForegroundColor White
        Write-Host "   4. DO NOT initialize with README, .gitignore, or license" -ForegroundColor Yellow
        Write-Host "   5. Click 'Create repository'" -ForegroundColor White
        Write-Host "   6. Copy the repository URL" -ForegroundColor White
        
        $repoUrl = Read-Host "`n   Enter your GitHub repository URL (or press Enter to skip)"
        if ($repoUrl) {
            git remote remove origin 2>$null
            git remote add origin $repoUrl
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Remote repository added!" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Failed to add remote repository" -ForegroundColor Red
            }
        }
    }
}

# ============================================================
# Step 3: Stage Files
# ============================================================
Write-Host "`n[Step 3/5] Staging Files" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   📋 Checking files to stage..." -ForegroundColor Cyan
$untracked = git status --porcelain | Measure-Object -Line
if ($untracked.Lines -gt 0) {
    Write-Host "   📦 Staging all files..." -ForegroundColor Cyan
    git add .
    if ($LASTEXITCODE -eq 0) {
        $staged = git status --short | Where-Object { $_ -match '^[AM]' } | Measure-Object -Line
        Write-Host "   ✅ Staged $($staged.Lines) files" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to stage files" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ℹ️  No new files to stage" -ForegroundColor Cyan
}

# ============================================================
# Step 4: Make Initial Commit
# ============================================================
Write-Host "`n[Step 4/5] Making Initial Commit" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$commitMessage = "Initial commit - Medarion Healthcare Platform"
Write-Host "   💾 Committing changes..." -ForegroundColor Cyan
Write-Host "   Message: $commitMessage" -ForegroundColor Gray

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Initial commit created successfully!" -ForegroundColor Green
    $commitHash = git rev-parse --short HEAD
    Write-Host "   📝 Commit hash: $commitHash" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Failed to create commit" -ForegroundColor Red
    Write-Host "   Check git status for issues" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# Step 5: Push to GitHub
# ============================================================
Write-Host "`n[Step 5/5] Pushing to GitHub" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Check current branch
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    # If no branch, create main
    git branch -M main
    $currentBranch = "main"
}

Write-Host "   📤 Pushing to GitHub (branch: $currentBranch)..." -ForegroundColor Cyan
Write-Host "   This may take a moment..." -ForegroundColor Gray

git push -u origin $currentBranch
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Successfully pushed to GitHub!" -ForegroundColor Green
    if ($repoUrl) {
        Write-Host "   🌐 Repository: $repoUrl" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⚠️  Push failed. This might be normal if:" -ForegroundColor Yellow
    Write-Host "   - Repository doesn't exist yet" -ForegroundColor Gray
    Write-Host "   - Authentication needs to be completed" -ForegroundColor Gray
    Write-Host "   - You need to create the repository on GitHub.com first" -ForegroundColor Gray
    Write-Host "`n   You can push manually later with: git push -u origin $currentBranch" -ForegroundColor Cyan
}

# ============================================================
# Summary
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Git Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   • Git user configured" -ForegroundColor White
Write-Host "   • Files staged and committed" -ForegroundColor White
if ($repoUrl) {
    Write-Host "   • Repository: $repoUrl" -ForegroundColor White
}
Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   • View repository on GitHub" -ForegroundColor White
Write-Host "   • Continue development with normal Git workflow:" -ForegroundColor White
Write-Host "     - git add ." -ForegroundColor Gray
Write-Host "     - git commit -m 'Description'" -ForegroundColor Gray
Write-Host "     - git push" -ForegroundColor Gray
Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • See PROJECT_KNOWLEDGE_BASE.md for complete project info" -ForegroundColor Gray
Write-Host "   • See GIT_SETUP_GUIDE.md for Git commands" -ForegroundColor Gray

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray

