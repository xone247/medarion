# Test All Data Modules - Verify Data is Displaying Correctly
# This script tests all API endpoints to verify data is accessible

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "TESTING ALL DATA MODULES" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Login first
Write-Host "[1/13] Logging in..." -ForegroundColor Yellow
$body = @{
    email = 'superadmin@medarion.com'
    password = 'admin123'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'https://api.medarion.africa/api/auth' -Method Post -Body $body -ContentType 'application/json'
    $token = $loginResponse.token
    Write-Host "   [OK] Login successful" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.full_name) ($($loginResponse.user.email))" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   [ERROR] Login failed: $_" -ForegroundColor Red
    exit 1
}

# Headers for authenticated requests
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

# Test endpoints - using admin endpoints for authenticated access
$endpoints = @(
    @{ Name = "Companies"; Url = "https://api.medarion.africa/api/admin/companies?page=1`&limit=1"; Expected = 286 },
    @{ Name = "Deals"; Url = "https://api.medarion.africa/api/admin/deals?page=1`&limit=1"; Expected = 367 },
    @{ Name = "Investors"; Url = "https://api.medarion.africa/api/admin/investors?page=1`&limit=1"; Expected = 1 },
    @{ Name = "Grants"; Url = "https://api.medarion.africa/api/admin/grants?page=1`&limit=1"; Expected = 95 },
    @{ Name = "Clinical Trials"; Url = "https://api.medarion.africa/api/admin/clinical-trials?page=1`&limit=1"; Expected = 195 },
    @{ Name = "Regulatory Bodies"; Url = "https://api.medarion.africa/api/admin/regulatory-bodies?page=1`&limit=1"; Expected = 54 },
    @{ Name = "Public Stocks"; Url = "https://api.medarion.africa/api/admin/public-markets?page=1`&limit=1"; Expected = 45 },
    @{ Name = "Clinical Centers"; Url = "https://api.medarion.africa/api/admin/clinical-centers?page=1`&limit=1"; Expected = 95 },
    @{ Name = "Investigators"; Url = "https://api.medarion.africa/api/admin/investigators?page=1`&limit=1"; Expected = 97 },
    @{ Name = "Nation Pulse Data"; Url = "https://api.medarion.africa/api/admin/nation-pulse?page=1`&limit=1"; Expected = 756 },
    @{ Name = "Glossary Terms"; Url = "https://api.medarion.africa/api/admin/glossary?page=1`&limit=1"; Expected = 1059 },
    @{ Name = "Africa Countries"; Url = "https://api.medarion.africa/api/admin/africa-countries"; Expected = 54 }
)

$results = @()

foreach ($endpoint in $endpoints) {
    $index = $endpoints.IndexOf($endpoint) + 2
    Write-Host "[$index/13] Testing $($endpoint.Name)..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method Get -Headers $headers -ErrorAction Stop
        
        # Extract count from response (varies by endpoint structure)
        $count = 0
        if ($response.pagination -and $response.pagination.total) {
            $count = $response.pagination.total
        } elseif ($response.total) {
            $count = $response.total
        } elseif ($response.count) {
            $count = $response.count
        } elseif ($response.data -and $response.data.Count) {
            $count = $response.data.Count
        } elseif ($response.Count) {
            $count = $response.Count
        } elseif ($response -is [Array]) {
            $count = $response.Count
        }
        
        $status = if ($count -gt 0) { "[OK]" } else { "[EMPTY]" }
        $color = if ($count -ge $endpoint.Expected * 0.9) { "Green" } elseif ($count -gt 0) { "Yellow" } else { "Red" }
        
        Write-Host "   $status Found: $count records (Expected: ~$($endpoint.Expected))" -ForegroundColor $color
        
        $results += @{
            Module = $endpoint.Name
            Count = $count
            Expected = $endpoint.Expected
            Status = if ($count -gt 0) { "OK" } else { "EMPTY" }
            Url = $endpoint.Url
        }
        
    } catch {
        Write-Host "   [ERROR] $_" -ForegroundColor Red
        $results += @{
            Module = $endpoint.Name
            Count = 0
            Expected = $endpoint.Expected
            Status = "ERROR"
            Url = $endpoint.Url
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ""
}

# Summary
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

$totalRecords = ($results | Measure-Object -Property Count -Sum).Sum
$totalExpected = ($results | Measure-Object -Property Expected -Sum).Sum
$successCount = ($results | Where-Object { $_.Status -eq "OK" }).Count

Write-Host "Total Records Found: $totalRecords" -ForegroundColor $(if ($totalRecords -gt 0) { "Green" } else { "Red" })
Write-Host "Total Expected: ~$totalExpected" -ForegroundColor Gray
Write-Host "Modules Working: $successCount / $($results.Count)" -ForegroundColor $(if ($successCount -eq $results.Count) { "Green" } else { "Yellow" })
Write-Host ""

# Detailed results table
Write-Host "Detailed Results:" -ForegroundColor Cyan
Write-Host ("{0,-25} {1,-10} {2,-10} {3,-10}" -f "Module", "Count", "Expected", "Status")
Write-Host ("-" * 55) -ForegroundColor Gray
foreach ($result in $results) {
    $statusColor = switch ($result.Status) {
        "OK" { "Green" }
        "EMPTY" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    Write-Host ("{0,-25} {1,-10} {2,-10} {3,-10}" -f $result.Module, $result.Count, $result.Expected, $result.Status) -ForegroundColor $statusColor
}

Write-Host ""
Write-Host "[OK] Data verification complete!" -ForegroundColor Green
Write-Host ""

# Export results to JSON
$results | ConvertTo-Json -Depth 3 | Out-File -FilePath "data_verification_results.json" -Encoding UTF8
Write-Host "Results saved to: data_verification_results.json" -ForegroundColor Gray

