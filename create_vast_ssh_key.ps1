# Create SSH Key for Vast.ai
# Following official Vast.ai documentation: https://docs.vast.ai/documentation/instances/connect/ssh

Write-Host "`n🔑 Creating SSH Key for Vast.ai" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "`nFollowing: https://docs.vast.ai/documentation/instances/connect/ssh" -ForegroundColor Gray

# Check if .ssh directory exists
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
    Write-Host "`n📁 Creating .ssh directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
}

# Key file paths
$privateKey = "$sshDir\id_ed25519_vast"
$publicKey = "$sshDir\id_ed25519_vast.pub"

# Check if key already exists
if (Test-Path $privateKey) {
    Write-Host "`n⚠️  SSH key already exists: $privateKey" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "`n✅ Using existing key" -ForegroundColor Green
        $useExisting = $true
    } else {
        Write-Host "`n🗑️  Removing old key..." -ForegroundColor Yellow
        Remove-Item $privateKey -Force -ErrorAction SilentlyContinue
        Remove-Item $publicKey -Force -ErrorAction SilentlyContinue
        $useExisting = $false
    }
} else {
    $useExisting = $false
}

if (-not $useExisting) {
    # Get email for key comment
    Write-Host "`n📧 Enter your email (optional, for key identification):" -ForegroundColor Yellow
    $email = Read-Host "Email (or press Enter to skip)"
    
    if ([string]::IsNullOrWhiteSpace($email)) {
        $emailComment = ""
    } else {
        $emailComment = "-C `"$email`""
    }
    
    Write-Host "`n🔑 Generating SSH key pair..." -ForegroundColor Yellow
    Write-Host "   This will create:" -ForegroundColor Gray
    Write-Host "   • Private key: $privateKey" -ForegroundColor Gray
    Write-Host "   • Public key: $publicKey" -ForegroundColor Gray
    Write-Host "`n💡 You can press Enter when prompted for passphrase (optional)" -ForegroundColor Cyan
    
    # Generate the key
    $keygenCmd = "ssh-keygen -t ed25519 -f `"$privateKey`" $emailComment -N `"`""
    
    try {
        Invoke-Expression $keygenCmd
        Write-Host "`n✅ SSH key generated successfully!" -ForegroundColor Green
    } catch {
        Write-Host "`n❌ Error generating key: $_" -ForegroundColor Red
        exit 1
    }
}

# Display the public key
Write-Host "`n📋 Your Public Key (add this to Vast.ai):" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $publicKey) {
    $publicKeyContent = Get-Content $publicKey -Raw
    Write-Host $publicKeyContent.Trim() -ForegroundColor White
    Write-Host ""
    
    # Copy to clipboard
    try {
        $publicKeyContent.Trim() | Set-Clipboard
        Write-Host "✅ Public key copied to clipboard!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not copy to clipboard automatically" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Public key file not found!" -ForegroundColor Red
    exit 1
}

# Save public key to a text file for easy access
$publicKeyFile = "vast_ai_public_key.txt"
$publicKeyContent.Trim() | Out-File -FilePath $publicKeyFile -Encoding ASCII -NoNewline
Write-Host "📄 Public key also saved to: $publicKeyFile" -ForegroundColor Gray

# Instructions
Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "`n1️⃣  Add Public Key to Vast.ai Account:" -ForegroundColor Cyan
Write-Host "   • Go to: https://console.vast.ai/account/keys" -ForegroundColor White
Write-Host "   • Click 'Add SSH Key'" -ForegroundColor White
Write-Host "   • Paste the public key above" -ForegroundColor White
Write-Host "   • Save" -ForegroundColor White
Write-Host "`n   ⚠️  Note: New keys only apply to NEW instances" -ForegroundColor Yellow
Write-Host "      For existing instances, use instance-specific SSH interface" -ForegroundColor Gray

Write-Host "`n2️⃣  Add Key to Existing Instance (if needed):" -ForegroundColor Cyan
Write-Host "   • Go to your instance in Vast.ai console" -ForegroundColor White
Write-Host "   • Click the SSH icon" -ForegroundColor White
Write-Host "   • Use 'Instance-specific SSH interface' to add key" -ForegroundColor White

Write-Host "`n3️⃣  Use the Key for SSH:" -ForegroundColor Cyan
Write-Host "   ssh -i `"$privateKey`" -p <PORT> root@<HOST>" -ForegroundColor White
Write-Host "`n   Example:" -ForegroundColor Gray
Write-Host "   ssh -i `"$privateKey`" -p 31216 root@ssh1.vast.ai" -ForegroundColor White

Write-Host "`n4️⃣  Set Key Permissions (if needed):" -ForegroundColor Cyan
Write-Host "   icacls `"$privateKey`" /inheritance:r" -ForegroundColor White
Write-Host "   icacls `"$privateKey`" /grant:r `"$env:USERNAME`:R`"" -ForegroundColor White

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n📚 Reference: https://docs.vast.ai/documentation/instances/connect/ssh" -ForegroundColor Gray

