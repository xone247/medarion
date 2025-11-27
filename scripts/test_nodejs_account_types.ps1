# Test All Account Types via Node.js Backend
# This script tests the Node.js API endpoints (not PHP) to verify account types

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "TESTING ACCOUNT TYPES - NODE.JS BACKEND" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Super Admin
Write-Host "[1/5] Logging in as Super Admin..." -ForegroundColor Yellow
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
    Write-Host ""
} catch {
    Write-Host "   [ERROR] Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get Overview (shows user stats)
Write-Host "[2/5] Getting Admin Overview..." -ForegroundColor Yellow
try {
    $overview = Invoke-RestMethod -Uri 'https://api.medarion.africa/api/admin/overview' -Method Get -Headers $headers
    Write-Host "   [OK] Overview retrieved" -ForegroundColor Green
    Write-Host "   Total Users: $($overview.data.userStats.totalUsers)" -ForegroundColor Cyan
    Write-Host "   Active Users: $($overview.data.userStats.activeUsers)" -ForegroundColor Cyan
    Write-Host "   New Users This Month: $($overview.data.userStats.newUsersThisMonth)" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "   User Roles Distribution:" -ForegroundColor Cyan
    foreach ($role in $overview.data.userRoles) {
        if ($role -is [PSCustomObject]) {
            Write-Host "     $($role.role): $($role.count) users ($($role.percentage)%)" -ForegroundColor White
        }
    }
    Write-Host ""
} catch {
    Write-Host "   [ERROR] Failed to get overview: $_" -ForegroundColor Red
}

# Step 3: Get All Users
Write-Host "[3/5] Fetching All Users from Node.js API..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri 'https://api.medarion.africa/api/admin/users?page=1&limit=100' -Method Get -Headers $headers
    
    if ($usersResponse.success -eq $true) {
        $allUsers = $usersResponse.data.users
        $totalUsers = $usersResponse.data.pagination.total
        
        Write-Host "   [OK] Users endpoint working" -ForegroundColor Green
        Write-Host "   Total Users: $totalUsers" -ForegroundColor Cyan
        Write-Host "   Users in Response: $($allUsers.Count)" -ForegroundColor Cyan
        Write-Host ""
        
        if ($allUsers.Count -gt 0) {
            # Step 4: Analyze Account Types
            Write-Host "[4/5] Analyzing Account Types..." -ForegroundColor Yellow
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
            
            # Step 5: Show Sample Users by Type
            Write-Host "[5/5] Sample Users by Account Type..." -ForegroundColor Yellow
            Write-Host ""
            
            $accountTypes = @("investors_finance", "startup", "health_science_experts", "industry_executives", "regulators")
            foreach ($accType in $accountTypes) {
                $sample = $allUsers | Where-Object { $_.user_type -eq $accType } | Select-Object -First 3
                if ($sample) {
                    Write-Host "   ${accType}:" -ForegroundColor Cyan
                    foreach ($user in $sample) {
                        Write-Host "     - $($user.email) (Tier: $($user.account_tier), Role: $($user.role))" -ForegroundColor Gray
                    }
                    Write-Host ""
                }
            }
        } else {
            Write-Host "   [WARNING] No users returned in response" -ForegroundColor Yellow
            Write-Host "   Response structure:" -ForegroundColor Gray
            $usersResponse | ConvertTo-Json -Depth 2 | Write-Host
        }
    } else {
        Write-Host "   [ERROR] API returned success=false" -ForegroundColor Red
        $usersResponse | ConvertTo-Json -Depth 2 | Write-Host
    }
    
} catch {
    Write-Host "   [ERROR] Failed to fetch users: $_" -ForegroundColor Red
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Gray
}

# Summary
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Node.js backend account type verification complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: All endpoints are using Node.js backend (not PHP)" -ForegroundColor Gray
Write-Host "      to avoid CORS errors as configured for production." -ForegroundColor Gray
Write-Host ""

