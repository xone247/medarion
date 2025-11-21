# Test API Endpoints
Write-Host ""
Write-Host ("=" * 70)
Write-Host "TESTING API ENDPOINTS"
Write-Host ("=" * 70)
Write-Host ""

$errors = @()
$success = @()

# Test Backend Health
Write-Host "1. Testing Backend Health..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Backend health check passed" -ForegroundColor Green
        $success += "Backend health"
    } else {
        Write-Host "   [ERROR] Backend returned status: $($response.StatusCode)" -ForegroundColor Red
        $errors += "Backend health check failed"
    }
} catch {
    Write-Host "   [ERROR] Backend not responding: $_" -ForegroundColor Red
    $errors += "Backend not accessible"
}

# Test Frontend
Write-Host ""
Write-Host "2. Testing Frontend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Frontend is accessible" -ForegroundColor Green
        $success += "Frontend"
    } else {
        Write-Host "   [ERROR] Frontend returned status: $($response.StatusCode)" -ForegroundColor Red
        $errors += "Frontend check failed"
    }
} catch {
    Write-Host "   [ERROR] Frontend not responding: $_" -ForegroundColor Red
    $errors += "Frontend not accessible"
}

# Test API Endpoints
Write-Host ""
Write-Host "3. Testing API Endpoints..." -ForegroundColor Cyan

$endpoints = @(
    "/api/admin/modules",
    "/api/countries/investment",
    "/api/blog/get_posts?limit=3"
)

foreach ($endpoint in $endpoints) {
    try {
        $url = "http://localhost:3001$endpoint"
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "   [OK] $endpoint" -ForegroundColor Green
            $success += $endpoint
        } else {
            Write-Host "   [ERROR] $endpoint returned status: $($response.StatusCode)" -ForegroundColor Red
            $errors += "$endpoint failed"
        }
    } catch {
        Write-Host "   [ERROR] $endpoint - $_" -ForegroundColor Red
        $errors += "$endpoint error"
    }
}

# Summary
Write-Host ""
Write-Host ("=" * 70)
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70)

if ($errors.Count -eq 0) {
    Write-Host "[OK] All tests passed!" -ForegroundColor Green
    Write-Host "   Successful: $($success.Count) tests" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Found $($errors.Count) error(s):" -ForegroundColor Red
    foreach ($e in $errors) {
        Write-Host "   - $e" -ForegroundColor Red
    }
    if ($success.Count -gt 0) {
        Write-Host ""
        Write-Host "[OK] Successful: $($success.Count) tests" -ForegroundColor Green
    }
}

Write-Host ""

