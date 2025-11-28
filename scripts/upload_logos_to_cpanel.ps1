# Upload Logos to cPanel
# Uploads all logo files to cPanel public folder

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$ssh = $config.ssh

Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue
Write-Host "UPLOADING LOGOS TO CPANEL" -ForegroundColor Blue
Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue
Write-Host ""

$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
if (-not (Test-Path $pscpPath)) {
    Write-Host "❌ PSCP not found at: $pscpPath" -ForegroundColor Red
    exit 1
}

$remotePath = "/home/medasnnc/public_html/public/uploads"

# Ensure directories exist
Write-Host "Ensuring logo directories exist..." -ForegroundColor Yellow
$plinkPath = $ssh.plinkPath
$createDirsCmd = "mkdir -p $remotePath/company $remotePath/investor $remotePath/regulatory && chmod -R 755 $remotePath"
if ($ssh.useKey -and $ssh.keyPath) {
    $sshCmd = "& `"$plinkPath`" -P $($ssh.port) -i `"$($ssh.keyPath)`" $($ssh.username)@$($ssh.host) `"$createDirsCmd`""
} else {
    $sshCmd = "echo $($ssh.password) | & `"$plinkPath`" -P $($ssh.port) -pw `"$($ssh.password)`" $($ssh.username)@$($ssh.host) `"$createDirsCmd`""
}
Invoke-Expression $sshCmd | Out-Null
Write-Host ""

# Upload company logos
Write-Host "Uploading company logos..." -ForegroundColor Yellow
$companyLogoDir = "public\uploads\company"
if (Test-Path $companyLogoDir) {
    $companyLogos = Get-ChildItem -Path $companyLogoDir -Filter "*.png"
    Write-Host "  Found $($companyLogos.Count) company logos" -ForegroundColor Cyan
    
    foreach ($logo in $companyLogos) {
        $remoteFile = "$remotePath/company/$($logo.Name)"
        if ($ssh.useKey -and $ssh.keyPath) {
            $scpCmd = "& `"$pscpPath`" -P $($ssh.port) -i `"$($ssh.keyPath)`" `"$($logo.FullName)`" $($ssh.username)@$($ssh.host):$remoteFile"
        } else {
            $scpCmd = "echo $($ssh.password) | & `"$pscpPath`" -P $($ssh.port) -pw `"$($ssh.password)`" `"$($logo.FullName)`" $($ssh.username)@$($ssh.host):$remoteFile"
        }
        Invoke-Expression $scpCmd | Out-Null
    }
    Write-Host "  ✅ Company logos uploaded" -ForegroundColor Green
}

# Upload investor logos
Write-Host "Uploading investor logos..." -ForegroundColor Yellow
$investorLogoDir = "public\uploads\investor"
if (Test-Path $investorLogoDir) {
    $investorLogos = Get-ChildItem -Path $investorLogoDir -Filter "*.png"
    Write-Host "  Found $($investorLogos.Count) investor logos" -ForegroundColor Cyan
    
    foreach ($logo in $investorLogos) {
        $remoteFile = "$remotePath/investor/$($logo.Name)"
        if ($ssh.useKey -and $ssh.keyPath) {
            $scpCmd = "& `"$pscpPath`" -P $($ssh.port) -i `"$($ssh.keyPath)`" `"$($logo.FullName)`" $($ssh.username)@$($ssh.host):$remoteFile"
        } else {
            $scpCmd = "echo $($ssh.password) | & `"$pscpPath`" -P $($ssh.port) -pw `"$($ssh.password)`" `"$($logo.FullName)`" $($ssh.username)@$($ssh.host):$remoteFile"
        }
        Invoke-Expression $scpCmd | Out-Null
    }
    Write-Host "  ✅ Investor logos uploaded" -ForegroundColor Green
}

# Upload regulatory body logos
Write-Host "Uploading regulatory body logos..." -ForegroundColor Yellow
$regulatoryLogoDir = "public\uploads\regulatory"
if (Test-Path $regulatoryLogoDir) {
    $regulatoryLogos = Get-ChildItem -Path $regulatoryLogoDir -Filter "*.png"
    Write-Host "  Found $($regulatoryLogos.Count) regulatory body logos" -ForegroundColor Cyan
    
    foreach ($logo in $regulatoryLogos) {
        $remoteFile = "$remotePath/regulatory/$($logo.Name)"
        if ($ssh.useKey -and $ssh.keyPath) {
            $scpCmd = "& `"$pscpPath`" -P $($ssh.port) -i `"$($ssh.keyPath)`" `"$($logo.FullName)`" $($ssh.username)@$($ssh.host):$remoteFile"
        } else {
            $scpCmd = "echo $($ssh.password) | & `"$pscpPath`" -P $($ssh.port) -pw `"$($ssh.password)`" `"$($logo.FullName)`" $($ssh.username)@$($ssh.host):$remoteFile"
        }
        Invoke-Expression $scpCmd | Out-Null
    }
    Write-Host "  ✅ Regulatory body logos uploaded" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue
Write-Host "✅ LOGO UPLOAD COMPLETE!" -ForegroundColor Green
Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue

