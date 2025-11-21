# Comprehensive Local Environment Test Script
# This script checks and tests the entire local environment

Write-Host ""
Write-Host ("=" * 70)
Write-Host "TESTING LOCAL MEDARION ENVIRONMENT"
Write-Host ("=" * 70)
Write-Host ""

$errors = @()
$warnings = @()

# 1. Check XAMPP MySQL
Write-Host "1. Checking XAMPP MySQL..." -ForegroundColor Cyan
$mysqlRunning = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($mysqlRunning) {
    Write-Host "   [OK] MySQL is running" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] MySQL is NOT running. Please start XAMPP MySQL!" -ForegroundColor Red
    $errors += "MySQL not running"
}

# Test MySQL connection
Write-Host "   Testing MySQL connection..."
try {
    $mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
    if (Test-Path $mysqlPath) {
        $result = & $mysqlPath -u root -e "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] MySQL connection successful" -ForegroundColor Green
        } else {
            Write-Host "   [ERROR] MySQL connection failed" -ForegroundColor Red
            $errors += "MySQL connection failed"
        }
    } else {
        Write-Host "   [WARNING] MySQL binary not found at $mysqlPath" -ForegroundColor Yellow
        $warnings += "MySQL binary not found"
    }
} catch {
    Write-Host "   [ERROR] Error testing MySQL: $_" -ForegroundColor Red
    $errors += "MySQL test error: $_"
}

# 2. Check database exists
Write-Host ""
Write-Host "2. Checking database..." -ForegroundColor Cyan
try {
    $mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
    if (Test-Path $mysqlPath) {
        $dbCheck = & $mysqlPath -u root -e "SHOW DATABASES LIKE 'medarion_platform';" 2>&1
        if ($dbCheck -match "medarion_platform") {
            Write-Host "   [OK] Database 'medarion_platform' exists" -ForegroundColor Green
            
            # Check tables
            $tables = & $mysqlPath -u root medarion_platform -e "SHOW TABLES;" 2>&1
            $tableCount = ($tables | Where-Object { $_ -match "^\|" } | Measure-Object).Count
            Write-Host "   Found $tableCount tables" -ForegroundColor Cyan
        } else {
            Write-Host "   [ERROR] Database 'medarion_platform' does not exist" -ForegroundColor Red
            $errors += "Database not found"
        }
    }
} catch {
    Write-Host "   [ERROR] Error checking database: $_" -ForegroundColor Red
    $errors += "Database check error: $_"
}

# 3. Check ports
Write-Host ""
Write-Host "3. Checking ports..." -ForegroundColor Cyan
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port3001) {
    Write-Host "   [WARNING] Port 3001 is in use (backend may already be running)" -ForegroundColor Yellow
    $warnings += "Port 3001 in use"
} else {
    Write-Host "   [OK] Port 3001 is available" -ForegroundColor Green
}

if ($port5173) {
    Write-Host "   [WARNING] Port 5173 is in use (frontend may already be running)" -ForegroundColor Yellow
    $warnings += "Port 5173 in use"
} else {
    Write-Host "   [OK] Port 5173 is available" -ForegroundColor Green
}

# 4. Check .env file
Write-Host ""
Write-Host "4. Checking configuration files..." -ForegroundColor Cyan
if (Test-Path "server\.env") {
    Write-Host "   [OK] server/.env exists" -ForegroundColor Green
    $envContent = Get-Content "server\.env" -Raw
    if ($envContent -match "DB_HOST") {
        Write-Host "   [OK] Database configuration found" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Database configuration missing in .env" -ForegroundColor Yellow
        $warnings += "DB config missing"
    }
} else {
    Write-Host "   [ERROR] server/.env not found" -ForegroundColor Red
    $errors += "server/.env missing"
}

# 5. Check node_modules
Write-Host ""
Write-Host "5. Checking dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "   [OK] Frontend node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Frontend node_modules missing. Run: npm install" -ForegroundColor Red
    $errors += "Frontend dependencies missing"
}

if (Test-Path "server\node_modules") {
    Write-Host "   [OK] Backend node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Backend node_modules missing. Run: cd server && npm install" -ForegroundColor Red
    $errors += "Backend dependencies missing"
}

# Summary
Write-Host ""
Write-Host ("=" * 70)
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70)

if ($errors.Count -eq 0) {
    Write-Host "[OK] All critical checks passed!" -ForegroundColor Green
    if ($warnings.Count -gt 0) {
        Write-Host "[WARNING] Warnings: $($warnings.Count)" -ForegroundColor Yellow
        foreach ($w in $warnings) {
            Write-Host "   - $w" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Host "Ready to start servers!" -ForegroundColor Green
    Write-Host "   Run: npm start" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Found $($errors.Count) error(s):" -ForegroundColor Red
    foreach ($e in $errors) {
        Write-Host "   - $e" -ForegroundColor Red
    }
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "[WARNING] Warnings: $($warnings.Count)" -ForegroundColor Yellow
        foreach ($w in $warnings) {
            Write-Host "   - $w" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Host "Please fix the errors before starting servers." -ForegroundColor Red
}

Write-Host ""

