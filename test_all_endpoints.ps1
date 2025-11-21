# Comprehensive test of all endpoints
Write-Host ""
Write-Host ("=" * 70)
Write-Host "TESTING ALL ADMIN ENDPOINTS"
Write-Host ("=" * 70)
Write-Host ""

# First, login to get token
Write-Host "1. Logging in..." -ForegroundColor Cyan
try {
    $loginBody = @{
        email = "superadmin@medarion.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signin" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = if ($loginData.token) { $loginData.token } else { $loginData.session_token }
    
    if ($token) {
        Write-Host "   [OK] Login successful" -ForegroundColor Green
        $headers = @{ "Authorization" = "Bearer $token" }
    } else {
        Write-Host "   [ERROR] No token received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   [ERROR] Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test all endpoints
$endpoints = @(
    @{ path = "/api/admin/modules"; name = "Modules" },
    @{ path = "/api/admin/blog-posts"; name = "Blog Posts" },
    @{ path = "/api/admin/companies?page=1&limit=10"; name = "Companies" },
    @{ path = "/api/admin/deals?page=1&limit=10"; name = "Deals" },
    @{ path = "/api/admin/grants?page=1&limit=10"; name = "Grants" },
    @{ path = "/api/admin/investors?page=1&limit=10"; name = "Investors" },
    @{ path = "/api/admin/clinical-trials?page=1&limit=10"; name = "Clinical Trials" },
    @{ path = "/api/admin/regulatory?page=1&limit=10"; name = "Regulatory" },
    @{ path = "/api/admin/regulatory-bodies?page=1&limit=10"; name = "Regulatory Bodies" },
    @{ path = "/api/admin/public-markets?page=1&limit=10"; name = "Public Markets" },
    @{ path = "/api/admin/clinical-centers?page=1&limit=10"; name = "Clinical Centers" },
    @{ path = "/api/admin/investigators?page=1&limit=10"; name = "Investigators" },
    @{ path = "/api/blog/get_posts?limit=10"; name = "Blog Posts (Public)" },
    @{ path = "/api/companies?page=1&limit=10"; name = "Companies (Public)" }
)

$results = @()
Write-Host ""
Write-Host "2. Testing Endpoints..." -ForegroundColor Cyan
foreach ($endpoint in $endpoints) {
    $url = "http://localhost:3001$($endpoint.path)"
    Write-Host "   Testing: $($endpoint.name)..." -ForegroundColor Yellow -NoNewline
    
    try {
        if ($endpoint.path -match "admin") {
            $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -ErrorAction Stop
        }
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success -or $data.companies -or $data.posts) {
            $count = 0
            if ($data.data) { $count = $data.data.Count }
            elseif ($data.companies) { $count = $data.companies.Count }
            elseif ($data.posts) { $count = $data.posts.Count }
            elseif ($data.pagination) { $count = $data.pagination.total }
            
            Write-Host " [OK] - Found $count items" -ForegroundColor Green
            $results += @{ name = $endpoint.name; status = "OK"; count = $count }
        } else {
            Write-Host " [WARNING] - No data structure" -ForegroundColor Yellow
            $results += @{ name = $endpoint.name; status = "WARNING"; count = 0 }
        }
    } catch {
        Write-Host " [ERROR] - $($_.Exception.Message)" -ForegroundColor Red
        $results += @{ name = $endpoint.name; status = "ERROR"; count = 0 }
    }
}

# Summary
Write-Host ""
Write-Host ("=" * 70)
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70)
$ok = ($results | Where-Object { $_.status -eq "OK" }).Count
$error = ($results | Where-Object { $_.status -eq "ERROR" }).Count
$warning = ($results | Where-Object { $_.status -eq "WARNING" }).Count

Write-Host "Total Endpoints: $($results.Count)" -ForegroundColor Cyan
Write-Host "  [OK]: $ok" -ForegroundColor Green
Write-Host "  [WARNING]: $warning" -ForegroundColor Yellow
Write-Host "  [ERROR]: $error" -ForegroundColor Red

if ($error -gt 0) {
    Write-Host ""
    Write-Host "Failed Endpoints:" -ForegroundColor Red
    $results | Where-Object { $_.status -eq "ERROR" } | ForEach-Object {
        Write-Host "  - $($_.name)" -ForegroundColor Red
    }
}

Write-Host ""

