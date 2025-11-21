# Test database queries directly to see if data loads
Write-Host ""
Write-Host ("=" * 70)
Write-Host "TESTING DATABASE QUERIES"
Write-Host ("=" * 70)
Write-Host ""

# Test companies query
Write-Host "1. Testing Companies Query..." -ForegroundColor Cyan
$query = "SELECT COUNT(*) as count, GROUP_CONCAT(name) as names FROM companies LIMIT 5;"
$result = & C:\xampp\mysql\bin\mysql.exe -u root medarion_platform -e $query 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Query successful" -ForegroundColor Green
    Write-Host "   Result: $result" -ForegroundColor Cyan
} else {
    Write-Host "   [ERROR] Query failed: $result" -ForegroundColor Red
}

# Test deals query
Write-Host ""
Write-Host "2. Testing Deals Query..." -ForegroundColor Cyan
$query = "SELECT COUNT(*) as count FROM deals;"
$result = & C:\xampp\mysql\bin\mysql.exe -u root medarion_platform -e $query 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Query successful" -ForegroundColor Green
    Write-Host "   Result: $result" -ForegroundColor Cyan
} else {
    Write-Host "   [ERROR] Query failed: $result" -ForegroundColor Red
}

# Test grants query
Write-Host ""
Write-Host "3. Testing Grants Query..." -ForegroundColor Cyan
$query = "SELECT COUNT(*) as count FROM grants;"
$result = & C:\xampp\mysql\bin\mysql.exe -u root medarion_platform -e $query 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Query successful" -ForegroundColor Green
    Write-Host "   Result: $result" -ForegroundColor Cyan
} else {
    Write-Host "   [ERROR] Query failed: $result" -ForegroundColor Red
}

# Test with authentication token
Write-Host ""
Write-Host "4. Testing API with Authentication..." -ForegroundColor Cyan
Write-Host "   First, let's try to login and get a token..." -ForegroundColor Yellow

# Try to login
try {
    $loginBody = @{
        email = "superadmin@medarion.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signin" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.token -or $loginData.session_token) {
        $token = if ($loginData.token) { $loginData.token } else { $loginData.session_token }
        Write-Host "   [OK] Login successful, got token" -ForegroundColor Green
        
        # Now test admin endpoint with token
        Write-Host ""
        Write-Host "   Testing /api/admin/companies with token..." -ForegroundColor Yellow
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $adminResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/companies?page=1&limit=5" -Method GET -Headers $headers -ErrorAction Stop
        $adminData = $adminResponse.Content | ConvertFrom-Json
        
        if ($adminData.success -and $adminData.data.Count -gt 0) {
            Write-Host "   [OK] Admin endpoint returns $($adminData.data.Count) companies" -ForegroundColor Green
        } else {
            Write-Host "   [WARNING] Admin endpoint returned success but no data" -ForegroundColor Yellow
            Write-Host "   Response: $($adminResponse.Content)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   [ERROR] Login failed - no token received" -ForegroundColor Red
        Write-Host "   Response: $($loginResponse.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [ERROR] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host ("=" * 70)

