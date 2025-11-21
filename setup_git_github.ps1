# Git and GitHub Setup Script for Medarion Project
# This script helps you set up Git repository and connect to GitHub

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Git & GitHub Setup for Medarion Project" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# ============================================================
# Step 1: Check Git Installation
# ============================================================
Write-Host "`n[Step 1/6] Checking Git Installation" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Git is installed: $gitVersion" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Git is not installed or not in PATH" -ForegroundColor Red
        Write-Host "   📥 Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
        Write-Host "   After installation, restart this script." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ❌ Git is not installed" -ForegroundColor Red
    Write-Host "   📥 Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# Step 2: Check GitHub CLI (Optional but Recommended)
# ============================================================
Write-Host "`n[Step 2/6] Checking GitHub CLI (Optional)" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$ghInstalled = $false
try {
    $ghVersion = gh --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ GitHub CLI is installed: $ghVersion" -ForegroundColor Green
        $ghInstalled = $true
    } else {
        Write-Host "   ⚠️  GitHub CLI not found (optional)" -ForegroundColor Yellow
        Write-Host "   💡 Install it for easier authentication: winget install GitHub.cli" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  GitHub CLI not found (optional)" -ForegroundColor Yellow
    Write-Host "   💡 Install it for easier authentication: winget install GitHub.cli" -ForegroundColor Gray
}

# ============================================================
# Step 3: Initialize Git Repository
# ============================================================
Write-Host "`n[Step 3/6] Initializing Git Repository" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

if (Test-Path ".git") {
    Write-Host "   ℹ️  Git repository already exists" -ForegroundColor Cyan
    Write-Host "   📋 Current status:" -ForegroundColor Gray
    git status --short
} else {
    Write-Host "   🔧 Initializing new Git repository..." -ForegroundColor Cyan
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Git repository initialized" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to initialize Git repository" -ForegroundColor Red
        exit 1
    }
}

# ============================================================
# Step 4: Configure Git User (if not already set)
# ============================================================
Write-Host "`n[Step 4/6] Configuring Git User" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$currentName = git config --global user.name 2>&1
$currentEmail = git config --global user.email 2>&1

if ($currentName -and $currentName -notmatch "error") {
    Write-Host "   ✅ Git user name: $currentName" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Git user name not configured" -ForegroundColor Yellow
    $userName = Read-Host "   Enter your name for Git commits"
    if ($userName) {
        git config --global user.name $userName
        Write-Host "   ✅ Git user name set to: $userName" -ForegroundColor Green
    }
}

if ($currentEmail -and $currentEmail -notmatch "error") {
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
# Step 5: GitHub Authentication Options
# ============================================================
Write-Host "`n[Step 5/6] GitHub Authentication Setup" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n   Choose authentication method:" -ForegroundColor Cyan
Write-Host "   1. GitHub CLI (Recommended - Easiest)" -ForegroundColor White
Write-Host "   2. Personal Access Token (PAT)" -ForegroundColor White
Write-Host "   3. SSH Key (Most Secure)" -ForegroundColor White
Write-Host "   4. Skip for now (Set up later)" -ForegroundColor White

$authChoice = Read-Host "`n   Enter your choice (1-4)"

switch ($authChoice) {
    "1" {
        if ($ghInstalled) {
            Write-Host "`n   🔐 Authenticating with GitHub CLI..." -ForegroundColor Cyan
            Write-Host "   This will open your browser for authentication." -ForegroundColor Gray
            gh auth login
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ GitHub CLI authentication successful!" -ForegroundColor Green
                $ghAuthSuccess = $true
            } else {
                Write-Host "   ❌ GitHub CLI authentication failed" -ForegroundColor Red
                $ghAuthSuccess = $false
            }
        } else {
            Write-Host "   ❌ GitHub CLI not installed" -ForegroundColor Red
            Write-Host "   Install it first: winget install GitHub.cli" -ForegroundColor Yellow
            Write-Host "   Then run: gh auth login" -ForegroundColor Yellow
        }
    }
    "2" {
        Write-Host "`n   📝 Personal Access Token (PAT) Setup" -ForegroundColor Cyan
        Write-Host "   1. Go to: https://github.com/settings/tokens" -ForegroundColor White
        Write-Host "   2. Click 'Generate new token' → 'Generate new token (classic)'" -ForegroundColor White
        Write-Host "   3. Give it a name (e.g., 'Medarion Project')" -ForegroundColor White
        Write-Host "   4. Select scopes: repo (full control)" -ForegroundColor White
        Write-Host "   5. Click 'Generate token'" -ForegroundColor White
        Write-Host "   6. Copy the token (you won't see it again!)" -ForegroundColor Yellow
        Write-Host "`n   After creating the token, you'll use it when pushing to GitHub." -ForegroundColor Gray
        Write-Host "   Git will prompt for your username and password (use token as password)." -ForegroundColor Gray
    }
    "3" {
        Write-Host "`n   🔑 SSH Key Setup" -ForegroundColor Cyan
        Write-Host "   1. Check if you have an SSH key:" -ForegroundColor White
        Write-Host "      Test-Path ~/.ssh/id_rsa.pub" -ForegroundColor Gray
        
        if (Test-Path "$env:USERPROFILE\.ssh\id_rsa.pub") {
            Write-Host "   ✅ SSH key found at: $env:USERPROFILE\.ssh\id_rsa.pub" -ForegroundColor Green
            Write-Host "`n   Copy your public key:" -ForegroundColor Cyan
            Get-Content "$env:USERPROFILE\.ssh\id_rsa.pub" | Write-Host -ForegroundColor Yellow
            Write-Host "`n   2. Add this key to GitHub:" -ForegroundColor White
            Write-Host "      Go to: https://github.com/settings/keys" -ForegroundColor Gray
            Write-Host "      Click 'New SSH key' and paste the key above" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  No SSH key found. Generating one..." -ForegroundColor Yellow
            Write-Host "   This will create a new SSH key pair." -ForegroundColor Gray
            $confirm = Read-Host "   Continue? (y/n)"
            if ($confirm -eq "y") {
                $email = git config --global user.email
                if (-not $email) {
                    $email = Read-Host "   Enter your email for SSH key"
                }
                ssh-keygen -t ed25519 -C $email -f "$env:USERPROFILE\.ssh\id_ed25519" -N '""'
                Write-Host "   ✅ SSH key generated!" -ForegroundColor Green
                Write-Host "`n   Copy your public key:" -ForegroundColor Cyan
                Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | Write-Host -ForegroundColor Yellow
                Write-Host "`n   Add this key to GitHub:" -ForegroundColor White
                Write-Host "      Go to: https://github.com/settings/keys" -ForegroundColor Gray
                Write-Host "      Click 'New SSH key' and paste the key above" -ForegroundColor Gray
            }
        }
    }
    "4" {
        Write-Host "   ⏭️  Skipping authentication setup" -ForegroundColor Yellow
        Write-Host "   You can set this up later when you're ready to push to GitHub." -ForegroundColor Gray
    }
    default {
        Write-Host "   ⚠️  Invalid choice. Skipping authentication setup." -ForegroundColor Yellow
    }
}

# ============================================================
# Step 6: Create GitHub Repository (Optional)
# ============================================================
Write-Host "`n[Step 6/6] GitHub Repository Setup" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n   Would you like to create a GitHub repository now?" -ForegroundColor Cyan
Write-Host "   1. Yes, create a new repository (requires GitHub CLI or manual setup)" -ForegroundColor White
Write-Host "   2. No, I'll create it manually on GitHub.com" -ForegroundColor White
Write-Host "   3. I already have a repository URL" -ForegroundColor White

$repoChoice = Read-Host "`n   Enter your choice (1-3)"

switch ($repoChoice) {
    "1" {
        if ($ghInstalled -and $ghAuthSuccess) {
            $repoName = Read-Host "   Enter repository name (e.g., medarion)"
            $repoDescription = Read-Host "   Enter repository description (optional)"
            $isPrivate = Read-Host "   Make it private? (y/n)"
            
            $privateFlag = if ($isPrivate -eq "y") { "--private" } else { "--public" }
            $descFlag = if ($repoDescription) { "--description `"$repoDescription`"" } else { "" }
            
            Write-Host "`n   🚀 Creating GitHub repository..." -ForegroundColor Cyan
            gh repo create $repoName $privateFlag $descFlag --source=. --remote=origin --push=false
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Repository created successfully!" -ForegroundColor Green
                Write-Host "   📋 Repository URL: https://github.com/$(gh api user --jq .login)/$repoName" -ForegroundColor Cyan
            } else {
                Write-Host "   ❌ Failed to create repository" -ForegroundColor Red
            }
        } else {
            Write-Host "   ⚠️  GitHub CLI not authenticated" -ForegroundColor Yellow
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
# Summary and Next Steps
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Git & GitHub Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review and stage files: git add ." -ForegroundColor White
Write-Host "   2. Make your first commit: git commit -m 'Initial commit'" -ForegroundColor White
Write-Host "   3. Push to GitHub: git push -u origin main" -ForegroundColor White
Write-Host "      (or 'master' if your default branch is master)" -ForegroundColor Gray
Write-Host "`n💡 Tips:" -ForegroundColor Cyan
Write-Host "   • Use 'git status' to see what files are staged" -ForegroundColor Gray
Write-Host "   • Use 'git log' to see commit history" -ForegroundColor Gray
Write-Host "   • Sensitive files are already in .gitignore" -ForegroundColor Gray
Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • See PROJECT_KNOWLEDGE_BASE.md for all project information" -ForegroundColor Gray
Write-Host "   • See README.md for project overview" -ForegroundColor Gray

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray

