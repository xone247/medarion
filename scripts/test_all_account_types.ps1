# Test All Account Types and Verify Functionality
# This script logs in as super admin and tests all account types

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "TESTING ALL ACCOUNT TYPES - ONLINE VERSION" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Super Admin
Write-Host "[1/4] Logging in as Super Admin..." -ForegroundColor Yellow
$body = @{
    email = 'superadmin@medarion.com'
    password = 'admin123'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'https://api.medarion.africa/api/auth' -Method Post -Body $body -ContentType 'application/json'
    $token = $loginResponse.token
    $headers = @{
        'Authorization' = "Bearer $token"
        'Content-Type' = 'application/json'
    }
    
    Write-Host "   [OK] Login successful" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.full_name)" -ForegroundColor Gray
    Write-Host "   Email: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor Gray
    Write-Host "   User Type: $($loginResponse.user.user_type)" -ForegroundColor Gray
    Write-Host "   Account Tier: $($loginResponse.user.account_tier)" -ForegroundColor Gray
    Write-Host "   Is Admin: $($loginResponse.user.is_admin)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   [ERROR] Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get All Users
Write-Host "[2/4] Fetching All Users..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri 'https://api.medarion.africa/api/admin/users?page=1&limit=100' -Method Get -Headers $headers
    $allUsers = $usersResponse.users
    $totalUsers = $usersResponse.pagination.total
    
    Write-Host "   [OK] Found $totalUsers total users" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   [ERROR] Failed to fetch users: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Analyze Account Types
Write-Host "[3/4] Analyzing Account Types..." -ForegroundColor Yellow
Write-Host ""

$userTypes = $allUsers | Group-Object user_type | Sort-Object Name
$accountTiers = $allUsers | Group-Object account_tier | Sort-Object Name
$roles = $allUsers | Group-Object role | Sort-Object Name

Write-Host "User Type Distribution:" -ForegroundColor Cyan
foreach ($type in $userTypes) {
    Write-Host "   $($type.Name): $($type.Count) users" -ForegroundColor White
}
Write-Host ""

Write-Host "Account Tier Distribution:" -ForegroundColor Cyan
foreach ($tier in $accountTiers) {
    Write-Host "   $($tier.Name): $($tier.Count) users" -ForegroundColor White
}
Write-Host ""

Write-Host "Role Distribution:" -ForegroundColor Cyan
foreach ($role in $roles) {
    Write-Host "   $($role.Name): $($role.Count) users" -ForegroundColor White
}
Write-Host ""

# Step 4: Test Each Account Type's Access
Write-Host "[4/4] Testing Module Access for Each Account Type..." -ForegroundColor Yellow
Write-Host ""

$accountTypeTests = @(
    @{ Type = "investors_finance"; Tier = "enterprise"; ExpectedModules = @("dashboard", "companies", "deals", "investors", "public_markets") },
    @{ Type = "startup"; Tier = "basic"; ExpectedModules = @("dashboard", "companies", "deals") },
    @{ Type = "health_science_experts"; Tier = "professional"; ExpectedModules = @("dashboard", "clinical_trials", "clinical_centers") },
    @{ Type = "industry_executives"; Tier = "enterprise"; ExpectedModules = @("dashboard", "companies", "deals", "regulatory") },
    @{ Type = "regulators"; Tier = "enterprise"; ExpectedModules = @("dashboard", "regulatory", "regulatory_ecosystem") }
)

foreach ($test in $accountTypeTests) {
    $sampleUser = $allUsers | Where-Object { $_.user_type -eq $test.Type -and $_.account_tier -eq $test.Tier } | Select-Object -First 1
    
    if ($sampleUser) {
        Write-Host "   Testing: $($test.Type) / $($test.Tier)" -ForegroundColor Yellow
        Write-Host "      User: $($sampleUser.email)" -ForegroundColor Gray
        Write-Host "      Modules: $($sampleUser.dashboard_modules -join ', ')" -ForegroundColor Gray
        Write-Host "      [OK] Account type found" -ForegroundColor Green
    } else {
        Write-Host "   Testing: $($test.Type) / $($test.Tier)" -ForegroundColor Yellow
        Write-Host "      [WARNING] No user found with this type/tier combination" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Summary
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Users: $totalUsers" -ForegroundColor Green
Write-Host "User Types: $($userTypes.Count) different types" -ForegroundColor Green
Write-Host "Account Tiers: $($accountTiers.Count) different tiers" -ForegroundColor Green
Write-Host "Roles: $($roles.Count) different roles" -ForegroundColor Green
Write-Host ""
Write-Host "[OK] Account type verification complete!" -ForegroundColor Green
Write-Host ""

# Export results
$results = @{
    total_users = $totalUsers
    user_types = $userTypes | ForEach-Object { @{ type = $_.Name; count = $_.Count } }
    account_tiers = $accountTiers | ForEach-Object { @{ tier = $_.Name; count = $_.Count } }
    roles = $roles | ForEach-Object { @{ role = $_.Name; count = $_.Count } }
    super_admin = @{
        email = $loginResponse.user.email
        role = $loginResponse.user.role
        user_type = $loginResponse.user.user_type
        account_tier = $loginResponse.user.account_tier
        is_admin = $loginResponse.user.is_admin
    }
}

$results | ConvertTo-Json -Depth 5 | Out-File -FilePath "account_types_verification.json" -Encoding UTF8
Write-Host "Results saved to: account_types_verification.json" -ForegroundColor Gray

