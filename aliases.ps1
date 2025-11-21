# Medarion Development Aliases
# Source this file: . .\aliases.ps1

# Git shortcuts
Set-Alias -Name gs -Value git-status -ErrorAction SilentlyContinue
Set-Alias -Name gsave -Value git-save -ErrorAction SilentlyContinue
Set-Alias -Name gpush -Value git-push -ErrorAction SilentlyContinue
Set-Alias -Name gpull -Value git-pull -ErrorAction SilentlyContinue
Set-Alias -Name gbranch -Value git-branch -ErrorAction SilentlyContinue

# Deployment shortcuts
function Deploy { .\qd.ps1 -Message $args[0] -Deploy }
function QuickDeploy { .\deploy_from_git.ps1 }
function Build { npm run build }
function Dev { npm start }

Write-Host "✅ Aliases loaded!" -ForegroundColor Green
Write-Host "Available shortcuts:" -ForegroundColor Cyan
Write-Host "  gs            - git status" -ForegroundColor White
Write-Host "  gsave 'msg'   - git save" -ForegroundColor White
Write-Host "  gpush 'msg'   - git push" -ForegroundColor White
Write-Host "  gpull         - git pull" -ForegroundColor White
Write-Host "  Deploy 'msg'  - Quick deploy" -ForegroundColor White
Write-Host "  Build         - Build frontend" -ForegroundColor White
Write-Host "  Dev           - Start dev servers" -ForegroundColor White
