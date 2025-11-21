# Setup Fast Development Workflow
# Run this once to set up all shortcuts and optimizations

$ErrorActionPreference = "Continue"

Write-Host "`n⚡ Setting Up Fast Development Workflow" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# ============================================================
# Step 1: Add Git Quick Commands to PowerShell Profile
# ============================================================
Write-Host "`n[Step 1/4] Setting Up Git Quick Commands" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path $profilePath -Parent

if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

$gitCommandsPath = Join-Path $PWD "git_quick_commands.ps1"
$profileContent = @"

# Medarion Git Quick Commands
if (Test-Path "$gitCommandsPath") {
    . "$gitCommandsPath"
}
"@

if (Test-Path $profilePath) {
    $existing = Get-Content $profilePath -Raw
    if ($existing -notmatch "Medarion Git Quick Commands") {
        Add-Content -Path $profilePath -Value $profileContent
        Write-Host "   ✅ Added to PowerShell profile" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Already in PowerShell profile" -ForegroundColor Cyan
    }
} else {
    Set-Content -Path $profilePath -Value $profileContent
    Write-Host "   ✅ Created PowerShell profile with Git commands" -ForegroundColor Green
}

# ============================================================
# Step 2: Create Desktop Shortcuts
# ============================================================
Write-Host "`n[Step 2/4] Creating Shortcuts" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$desktop = [Environment]::GetFolderPath("Desktop")
$shortcuts = @(
    @{
        Name = "Medarion - Quick Deploy"
        Target = "powershell.exe"
        Arguments = "-NoExit -Command `"cd '$PWD'; .\qd.ps1 -Deploy`""
    },
    @{
        Name = "Medarion - Quick Dev"
        Target = "powershell.exe"
        Arguments = "-NoExit -Command `"cd '$PWD'; .\quick_dev.ps1`""
    }
)

foreach ($shortcut in $shortcuts) {
    $wshShell = New-Object -ComObject WScript.Shell
    $shortcutPath = Join-Path $desktop "$($shortcut.Name).lnk"
    $link = $wshShell.CreateShortcut($shortcutPath)
    $link.TargetPath = $shortcut.Target
    $link.Arguments = $shortcut.Arguments
    $link.WorkingDirectory = $PWD
    $link.Description = "Medarion Development Shortcut"
    $link.Save()
    Write-Host "   ✅ Created: $($shortcut.Name)" -ForegroundColor Green
}

# ============================================================
# Step 3: Verify Git Hooks
# ============================================================
Write-Host "`n[Step 3/4] Setting Up Git Hooks" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

if (Test-Path ".git\hooks\pre-commit") {
    Write-Host "   ✅ Pre-commit hook installed" -ForegroundColor Green
    Write-Host "   This will check for secrets before each commit" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Pre-commit hook not found" -ForegroundColor Yellow
}

# ============================================================
# Step 4: Create Aliases File
# ============================================================
Write-Host "`n[Step 4/4] Creating Command Aliases" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$aliasesFile = "aliases.ps1"
$aliasesContent = @"
# Medarion Development Aliases
# Source this file: . .\aliases.ps1

# Git shortcuts
Set-Alias -Name gs -Value git-status -ErrorAction SilentlyContinue
Set-Alias -Name gsave -Value git-save -ErrorAction SilentlyContinue
Set-Alias -Name gpush -Value git-push -ErrorAction SilentlyContinue
Set-Alias -Name gpull -Value git-pull -ErrorAction SilentlyContinue
Set-Alias -Name gbranch -Value git-branch -ErrorAction SilentlyContinue

# Deployment shortcuts
function Deploy { .\qd.ps1 -Message `$args[0] -Deploy }
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
"@

Set-Content -Path $aliasesFile -Value $aliasesContent
Write-Host "   ✅ Created aliases.ps1" -ForegroundColor Green
Write-Host "   Source it with: . .\aliases.ps1" -ForegroundColor Gray

# ============================================================
# Summary
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Fast Workflow Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 What's Been Set Up:" -ForegroundColor Cyan
Write-Host "   • Git quick commands (loaded in PowerShell profile)" -ForegroundColor White
Write-Host "   • Desktop shortcuts for quick access" -ForegroundColor White
Write-Host "   • Git pre-commit hooks (security checks)" -ForegroundColor White
Write-Host "   • Command aliases (aliases.ps1)" -ForegroundColor White
Write-Host "`n🚀 Quick Start:" -ForegroundColor Cyan
Write-Host "   1. Restart PowerShell or run: . .\git_quick_commands.ps1" -ForegroundColor White
Write-Host "   2. Use: .\qd.ps1 -Message 'Update' -Deploy" -ForegroundColor White
Write-Host "   3. Or use aliases: . .\aliases.ps1" -ForegroundColor White
Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • See DEVELOPMENT_WORKFLOW.md for complete guide" -ForegroundColor Gray

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray

