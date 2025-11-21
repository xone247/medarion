# Continue Git & GitHub Setup - Streamlined Version
# This script continues from where we left off

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Continuing Git & GitHub Setup" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# ============================================================
# Step 1: Configure Git User
# ============================================================
Write-Host "`n[Step 1/4] Configuring Git User" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$currentName = git config --global user.name 2>&1
$currentEmail = git config --global user.email 2>&1

if ($currentName -and $currentName -notmatch "error" -and $currentName.Trim() -ne "") {
    Write-Host "   ✅ Git user name: $currentName" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Git user name not configured" -ForegroundColor Yellow
    $userName = Read-Host "   Enter your name for Git commits"
    if ($userName) {
        git config --global user.name $userName
        Write-Host "   ✅ Git user name set to: $userName" -ForegroundColor Green
    }
}

if ($currentEmail -and $currentEmail -notmatch "error" -and $currentEmail.Trim() -ne "") {
    Write-Host "   ✅ Git user email: $currentEmail" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Git user email not configured" -ForegroundColor Yellow
    $userEmail = Read-Host "   Enter your email for Git commits"
    if ($userEmail) {
        git config --global user.email $userEmail
        Write-Host "   ✅ Git user email set to: $userEmail" -ForegroundColor Green
    }
}

# ============================================================
# Step 2: Install GitHub CLI (Recommended)
# ============================================================
Write-Host "`n[Step 2/4] Setting Up GitHub Authentication" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$ghInstalled = $false
try {
    $ghVersion = gh --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ GitHub CLI is already installed" -ForegroundColor Green
        $ghInstalled = $true
    }
} catch {
    # GitHub CLI not installed
}

if (-not $ghInstalled) {
    Write-Host "`n   📥 GitHub CLI is not installed" -ForegroundColor Yellow
    Write-Host "   GitHub CLI makes authentication much easier!" -ForegroundColor Cyan
    Write-Host "`n   Would you like to install GitHub CLI now?" -ForegroundColor White
    Write-Host "   1. Yes, install GitHub CLI (Recommended - Easiest)" -ForegroundColor Green
    Write-Host "   2. No, I'll use Personal Access Token instead" -ForegroundColor White
    Write-Host "   3. I already have GitHub CLI installed" -ForegroundColor White
    
    $installChoice = Read-Host "`n   Enter your choice (1-3)"
    
    if ($installChoice -eq "1") {
        Write-Host "`n   📥 Installing GitHub CLI..." -ForegroundColor Cyan
        Write-Host "   This may take a minute..." -ForegroundColor Gray
        
        try {
            winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements
            Write-Host "   ✅ GitHub CLI installed successfully!" -ForegroundColor Green
            Write-Host "   ⚠️  You may need to restart your terminal for 'gh' command to work" -ForegroundColor Yellow
            Write-Host "   After restart, run: gh auth login" -ForegroundColor Gray
            
            # Try to refresh PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            # Check if it's available now
            Start-Sleep -Seconds 2
            try {
                $ghVersion = gh --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $ghInstalled = $true
                    Write-Host "   ✅ GitHub CLI is now available!" -ForegroundColor Green
                }
            } catch {
                Write-Host "   ⚠️  GitHub CLI installed but may need terminal restart" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   ❌ Failed to install GitHub CLI automatically" -ForegroundColor Red
            Write-Host "   Please install manually from: https://cli.github.com/" -ForegroundColor Yellow
            Write-Host "   Or use Personal Access Token method (option 2)" -ForegroundColor Yellow
        }
    }
}

# ============================================================
# Step 3: Authenticate with GitHub
# ============================================================
Write-Host "`n[Step 3/4] GitHub Authentication" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

if ($ghInstalled) {
    Write-Host "`n   🔐 Authenticating with GitHub CLI..." -ForegroundColor Cyan
    Write-Host "   This will open your browser for authentication." -ForegroundColor Gray
    Write-Host "   Please complete the authentication in your browser." -ForegroundColor Yellow
    Write-Host "`n   Press Enter when you're ready to start authentication..." -ForegroundColor White
    Read-Host
    
    gh auth login
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n   ✅ GitHub CLI authentication successful!" -ForegroundColor Green
        
        # Get GitHub username
        try {
            $ghUser = gh api user --jq .login 2>&1
            if ($ghUser -and $ghUser -notmatch "error") {
                Write-Host "   👤 Logged in as: $ghUser" -ForegroundColor Cyan
            }
        } catch {
            # Ignore if we can't get username
        }
    } else {
        Write-Host "`n   ❌ GitHub CLI authentication failed" -ForegroundColor Red
        Write-Host "   You can try again later with: gh auth login" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n   📝 Personal Access Token (PAT) Setup" -ForegroundColor Cyan
    Write-Host "`n   Follow these steps:" -ForegroundColor White
    Write-Host "   1. Go to: https://github.com/settings/tokens" -ForegroundColor Gray
    Write-Host "   2. Click 'Generate new token' → 'Generate new token (classic)'" -ForegroundColor Gray
    Write-Host "   3. Give it a name (e.g., 'Medarion Project')" -ForegroundColor Gray
    Write-Host "   4. Select scope: repo (full control)" -ForegroundColor Gray
    Write-Host "   5. Click 'Generate token'" -ForegroundColor Gray
    Write-Host "   6. Copy the token (you won't see it again!)" -ForegroundColor Yellow
    Write-Host "`n   After creating the token, you'll use it when pushing to GitHub." -ForegroundColor Gray
    Write-Host "   Git will prompt for your username and password (use token as password)." -ForegroundColor Gray
    Write-Host "`n   Press Enter when you've created your token..." -ForegroundColor White
    Read-Host
}

# ============================================================
# Step 4: Create/Connect GitHub Repository
# ============================================================
Write-Host "`n[Step 4/4] GitHub Repository Setup" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n   Would you like to create a GitHub repository now?" -ForegroundColor Cyan
Write-Host "   1. Yes, create a new repository (requires GitHub CLI or manual setup)" -ForegroundColor White
Write-Host "   2. No, I'll create it manually on GitHub.com" -ForegroundColor White
Write-Host "   3. I already have a repository URL" -ForegroundColor White

$repoChoice = Read-Host "`n   Enter your choice (1-3)"

switch ($repoChoice) {
    "1" {
        if ($ghInstalled) {
            $repoName = Read-Host "   Enter repository name (e.g., medarion)"
            if (-not $repoName) { $repoName = "medarion" }
            
            $repoDescription = Read-Host "   Enter repository description (optional)"
            $isPrivate = Read-Host "   Make it private? (y/n)"
            
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
                        Write-Host "   📋 Repository URL: https://github.com/$ghUser/$repoName" -ForegroundColor Cyan
                    }
                } catch {
                    Write-Host "   📋 Repository created! Check GitHub for the URL." -ForegroundColor Cyan
                }
            } else {
                Write-Host "   ❌ Failed to create repository" -ForegroundColor Red
                Write-Host "   You can create it manually on GitHub.com" -ForegroundColor Yellow
            }
        } else {
            Write-Host "`n   ⚠️  GitHub CLI not available" -ForegroundColor Yellow
            Write-Host "   Please create the repository manually:" -ForegroundColor White
            Write-Host "   1. Go to: https://github.com/new" -ForegroundColor Gray
            Write-Host "   2. Create a new repository" -ForegroundColor Gray
            Write-Host "   3. Don't initialize with README, .gitignore, or license" -ForegroundColor Gray
            Write-Host "   4. Copy the repository URL" -ForegroundColor Gray
            Write-Host "   5. Run: git remote add origin <repository-url>" -ForegroundColor Gray
        }
    }
    "2" {
        Write-Host "`n   📝 Manual Repository Creation Steps:" -ForegroundColor Cyan
        Write-Host "   1. Go to: https://github.com/new" -ForegroundColor White
        Write-Host "   2. Enter repository name (e.g., medarion)" -ForegroundColor White
        Write-Host "   3. Choose public or private" -ForegroundColor White
        Write-Host "   4. DO NOT initialize with README, .gitignore, or license" -ForegroundColor Yellow
        Write-Host "   5. Click 'Create repository'" -ForegroundColor White
        Write-Host "   6. Copy the repository URL" -ForegroundColor White
        Write-Host "   7. Run this command:" -ForegroundColor Cyan
        Write-Host "      git remote add origin <your-repository-url>" -ForegroundColor Yellow
    }
    "3" {
        $repoUrl = Read-Host "   Enter your GitHub repository URL"
        if ($repoUrl) {
            Write-Host "   🔗 Adding remote repository..." -ForegroundColor Cyan
            git remote remove origin 2>$null
            git remote add origin $repoUrl
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Remote repository added!" -ForegroundColor Green
                Write-Host "   📋 Remote URL: $repoUrl" -ForegroundColor Cyan
            } else {
                Write-Host "   ❌ Failed to add remote repository" -ForegroundColor Red
            }
        }
    }
}

# ============================================================
# Summary
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Stage files: git add ." -ForegroundColor White
Write-Host "   2. Make first commit: git commit -m 'Initial commit'" -ForegroundColor White
Write-Host "   3. Push to GitHub: git push -u origin main" -ForegroundColor White
Write-Host "      (or 'master' if your default branch is master)" -ForegroundColor Gray
Write-Host "`n💡 Tips:" -ForegroundColor Cyan
Write-Host "   • Use 'git status' to see what files are staged" -ForegroundColor Gray
Write-Host "   • Sensitive files are already in .gitignore" -ForegroundColor Gray

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray

