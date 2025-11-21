# One-Command Node.js Installation Guide
# This provides the exact commands to run

Write-Host "🚀 Node.js Installation via SSH" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   COPY AND RUN THESE COMMANDS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Connect to Server" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ssh root@medarion.africa" -ForegroundColor Cyan
Write-Host "   Password: Neorage94" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 2: Install Node.js (Copy all lines below)" -ForegroundColor Yellow
Write-Host ""

$installCmd = @"
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && yum install -y nodejs && node --version && npm --version
"@

Write-Host $installCmd -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Verify for cPanel User" -ForegroundColor Yellow
Write-Host ""
Write-Host "   su - medasnnc" -ForegroundColor Cyan
Write-Host "   node --version" -ForegroundColor Cyan
Write-Host "   exit" -ForegroundColor Cyan
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 After installation, run:" -ForegroundColor Cyan
Write-Host "   .\setup_nodejs_complete.ps1" -ForegroundColor White
Write-Host ""

# Copy command to clipboard if possible
try {
    $installCmd | Set-Clipboard
    Write-Host "✅ Installation command copied to clipboard!" -ForegroundColor Green
    Write-Host "   Just paste it in your SSH session" -ForegroundColor Gray
} catch {
    Write-Host "   (Manually copy the command above)" -ForegroundColor Gray
}

Write-Host ""

