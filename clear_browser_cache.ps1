# Clear Browser Cache and Reload Site
# This script opens the site with cache-busting and clears browser cache

param(
    [string]$Url = "https://medarion.africa"
)

Write-Host "`n🧹 Clearing Browser Cache and Reloading" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Generate cache-busting parameter
$cacheBuster = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$urlWithCache = "$Url?v=$cacheBuster&_t=$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "`n📤 Opening site with cache-busting..." -ForegroundColor Yellow
Write-Host "   URL: $urlWithCache" -ForegroundColor Gray

# Open in default browser with cache-busting
Start-Process $urlWithCache

Write-Host "`n✅ Site opened with cache-busting parameters" -ForegroundColor Green
Write-Host "   The browser should load fresh content" -ForegroundColor Gray
Write-Host "`n💡 Tip: Use Ctrl+F5 in browser for hard refresh" -ForegroundColor Cyan



