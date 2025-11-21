# Check server logs and database queries
Write-Host ""
Write-Host ("=" * 70)
Write-Host "CHECKING SERVER LOGS AND DATABASE CONNECTIONS"
Write-Host ("=" * 70)
Write-Host ""

# Test database connection directly
Write-Host "1. Testing Database Connection..." -ForegroundColor Cyan
try {
    $mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
    $result = & $mysqlPath -u root medarion_platform -e "SELECT COUNT(*) as count FROM companies;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Database connection successful" -ForegroundColor Green
        Write-Host "   Companies in database: $($result | Select-String -Pattern '\d+' | ForEach-Object { $_.Matches.Value })" -ForegroundColor Cyan
    } else {
        Write-Host "   [ERROR] Database connection failed" -ForegroundColor Red
        Write-Host "   $result" -ForegroundColor Red
    }
} catch {
    Write-Host "   [ERROR] $_" -ForegroundColor Red
}

# Test API endpoints that require auth
Write-Host ""
Write-Host "2. Testing API Endpoints..." -ForegroundColor Cyan

# Test without auth (should fail)
Write-Host "   Testing /api/admin/companies (no auth)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/companies?page=1&limit=5" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [WARNING] Endpoint returned status $($response.StatusCode) without auth" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   [OK] Endpoint correctly requires authentication (401)" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Unexpected error: $_" -ForegroundColor Red
    }
}

# Test public endpoint
Write-Host "   Testing /api/companies (public)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/companies?page=1&limit=5" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    if ($json.companies.Count -gt 0) {
        Write-Host "   [OK] Public endpoint returns $($json.companies.Count) companies" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Public endpoint returns empty array" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
}

# Check if there are any log files
Write-Host ""
Write-Host "3. Checking for log files..." -ForegroundColor Cyan
$logFiles = @(
    "server\app.log",
    "server\error.log",
    "server\*.log"
)

$foundLogs = $false
foreach ($pattern in $logFiles) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    if ($files) {
        $foundLogs = $true
        foreach ($file in $files) {
            Write-Host "   Found: $($file.Name) ($([math]::Round($file.Length/1KB, 2)) KB)" -ForegroundColor Cyan
            # Show last 5 lines
            $lastLines = Get-Content $file.FullName -Tail 5 -ErrorAction SilentlyContinue
            if ($lastLines) {
                Write-Host "   Last 5 lines:" -ForegroundColor Yellow
                $lastLines | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
            }
        }
    }
}

if (-not $foundLogs) {
    Write-Host "   [INFO] No log files found in server directory" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ("=" * 70)
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70)
Write-Host ""
Write-Host "The issue is likely:" -ForegroundColor Yellow
Write-Host "  - Admin endpoints require authentication (JWT token)" -ForegroundColor White
Write-Host "  - Frontend may not be sending auth token properly" -ForegroundColor White
Write-Host "  - Check browser console for 401 errors" -ForegroundColor White
Write-Host ""

