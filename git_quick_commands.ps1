# Quick Git Commands for Faster Development
# Source this file or add functions to your PowerShell profile

# Quick status check
function git-status { git status --short }

# Quick add all and commit
function git-save {
    param([string]$message = "Update")
    git add .
    git commit -m $message
    Write-Host "✅ Changes committed: $message" -ForegroundColor Green
}

# Quick add, commit, and push
function git-push {
    param([string]$message = "Update")
    git add .
    git commit -m $message
    git push
    Write-Host "✅ Changes pushed to GitHub: $message" -ForegroundColor Green
}

# Quick branch operations
function git-branch-new {
    param([string]$name)
    git checkout -b $name
    Write-Host "✅ Created and switched to branch: $name" -ForegroundColor Green
}

function git-branch-switch {
    param([string]$name)
    git checkout $name
    Write-Host "✅ Switched to branch: $name" -ForegroundColor Green
}

# Quick diff
function git-diff { git diff --stat }

# Quick log
function git-log { git log --oneline -10 }

# Quick stash
function git-stash-save {
    param([string]$message = "WIP")
    git stash push -m $message
    Write-Host "✅ Stashed changes: $message" -ForegroundColor Green
}

function git-stash-pop {
    git stash pop
    Write-Host "✅ Applied stash" -ForegroundColor Green
}

# Quick pull
function git-pull {
    git pull origin master
    Write-Host "✅ Pulled latest changes" -ForegroundColor Green
}

# Show current branch
function git-branch { git branch --show-current }

Write-Host "✅ Git quick commands loaded!" -ForegroundColor Green
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  git-status          - Quick status check" -ForegroundColor White
Write-Host "  git-save 'message'  - Add, commit with message" -ForegroundColor White
Write-Host "  git-push 'message'  - Add, commit, and push" -ForegroundColor White
Write-Host "  git-branch-new 'name' - Create and switch to new branch" -ForegroundColor White
Write-Host "  git-branch-switch 'name' - Switch to branch" -ForegroundColor White
Write-Host "  git-diff            - Show file changes" -ForegroundColor White
Write-Host "  git-log             - Show recent commits" -ForegroundColor White
Write-Host "  git-stash-save 'msg' - Save changes to stash" -ForegroundColor White
Write-Host "  git-stash-pop       - Apply stashed changes" -ForegroundColor White
Write-Host "  git-pull            - Pull latest from GitHub" -ForegroundColor White
Write-Host "  git-branch          - Show current branch" -ForegroundColor White

