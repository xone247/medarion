# Export and Deploy Final Database
$config = Get-Content cpanel-config.json | ConvertFrom-Json
$plink = $config.ssh.plinkPath
$pscp = $plink -replace "plink.exe", "pscp.exe"
$sshHost = $config.ssh.host
$user = $config.ssh.username
$port = $config.ssh.port
$key = $config.ssh.keyPath
$pass = $config.ssh.password

Write-Host "`n📦 Exporting database..." -ForegroundColor Cyan
C:\xampp\php\php.exe scripts/export_local_database.php

if (Test-Path "database_export_for_cpanel.sql") {
    Write-Host "✅ Database exported successfully" -ForegroundColor Green
    
    Write-Host "`n📤 Uploading database to server..." -ForegroundColor Cyan
    echo $pass | & $pscp -P $port -pw $pass -i $key "database_export_for_cpanel.sql" "${user}@${sshHost}:/home/medasnnc/api.medarion.africa/database_export_for_cpanel.sql"
    
    Write-Host "`n🔄 Importing database on server..." -ForegroundColor Cyan
    $importCmd = "echo $pass | & `"$plink`" -P $port -pw $pass -i `"$key`" -batch `${user}@${sshHost} `"cd /home/medasnnc/api.medarion.africa; mysql -u medasnnc_medarion -p'$($config.database.password)' medasnnc_medarion < database_export_for_cpanel.sql 2>&1`""
    $result = Invoke-Expression $importCmd | Out-String
    Write-Host $result -ForegroundColor Gray
    
    Write-Host "`n✅ Database deployment complete!" -ForegroundColor Green
} else {
    Write-Host "❌ Database export failed!" -ForegroundColor Red
}

