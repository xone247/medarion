# Open Site Fresh (No Cache)
# Opens the site in a way that bypasses cache

param(
    [string]$Url = "https://medarion.africa"
)

$cacheBuster = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$freshUrl = "${Url}?v=$cacheBuster&nocache=1&_t=$timestamp"

Write-Host "🌐 Opening fresh: $freshUrl" -ForegroundColor Cyan
Start-Process $freshUrl

