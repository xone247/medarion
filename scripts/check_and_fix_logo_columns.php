<?php
/**
 * Check and Fix Logo Columns
 * Ensures all tables have logo columns and updates existing logos
 */

require_once __DIR__ . '/../config/database.php';

$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
if (!empty($config['port'])) {
    $dsn .= ";port={$config['port']}";
}

try {
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "CHECKING AND FIXING LOGO COLUMNS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Check companies table
    echo "1. COMPANIES TABLE\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM companies LIKE 'logo%'");
    $logoCols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "   Logo columns: " . implode(', ', $logoCols) . "\n";
    
    if (!in_array('logo_url', $logoCols) && !in_array('logo', $logoCols)) {
        try {
            $pdo->exec("ALTER TABLE companies ADD COLUMN logo_url VARCHAR(500) NULL");
            echo "   ✓ Added logo_url column\n";
        } catch (PDOException $e) {
            echo "   ⚠️  " . $e->getMessage() . "\n";
        }
    }
    
    // Sync logo to logo_url if needed
    if (in_array('logo', $logoCols) && !in_array('logo_url', $logoCols)) {
        try {
            $pdo->exec("ALTER TABLE companies ADD COLUMN logo_url VARCHAR(500) NULL");
            $pdo->exec("UPDATE companies SET logo_url = logo WHERE logo IS NOT NULL AND logo != '' AND (logo_url IS NULL OR logo_url = '')");
            echo "   ✓ Synced logo to logo_url\n";
        } catch (PDOException $e) {
            echo "   ⚠️  " . $e->getMessage() . "\n";
        }
    }
    echo "\n";
    
    // Check investors table
    echo "2. INVESTORS TABLE\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM investors LIKE 'logo%'");
    $logoCols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "   Logo columns: " . implode(', ', $logoCols) . "\n";
    
    if (!in_array('logo_url', $logoCols) && !in_array('logo', $logoCols)) {
        try {
            $pdo->exec("ALTER TABLE investors ADD COLUMN logo_url VARCHAR(500) NULL");
            echo "   ✓ Added logo_url column\n";
        } catch (PDOException $e) {
            echo "   ⚠️  " . $e->getMessage() . "\n";
        }
    }
    
    // Sync logo to logo_url if needed
    if (in_array('logo', $logoCols) && !in_array('logo_url', $logoCols)) {
        try {
            $pdo->exec("ALTER TABLE investors ADD COLUMN logo_url VARCHAR(500) NULL");
            $pdo->exec("UPDATE investors SET logo_url = logo WHERE logo IS NOT NULL AND logo != '' AND (logo_url IS NULL OR logo_url = '')");
            echo "   ✓ Synced logo to logo_url\n";
        } catch (PDOException $e) {
            echo "   ⚠️  " . $e->getMessage() . "\n";
        }
    }
    echo "\n";
    
    // Check regulatory_bodies table
    echo "3. REGULATORY BODIES TABLE\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM regulatory_bodies LIKE 'logo%'");
    $logoCols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "   Logo columns: " . implode(', ', $logoCols) . "\n";
    
    if (!in_array('logo_url', $logoCols) && !in_array('logo', $logoCols)) {
        try {
            $pdo->exec("ALTER TABLE regulatory_bodies ADD COLUMN logo_url VARCHAR(500) NULL");
            echo "   ✓ Added logo_url column\n";
        } catch (PDOException $e) {
            echo "   ⚠️  " . $e->getMessage() . "\n";
        }
    }
    
    // Sync logo to logo_url if needed
    if (in_array('logo', $logoCols) && !in_array('logo_url', $logoCols)) {
        try {
            $pdo->exec("ALTER TABLE regulatory_bodies ADD COLUMN logo_url VARCHAR(500) NULL");
            $pdo->exec("UPDATE regulatory_bodies SET logo_url = logo WHERE logo IS NOT NULL AND logo != '' AND (logo_url IS NULL OR logo_url = '')");
            echo "   ✓ Synced logo to logo_url\n";
        } catch (PDOException $e) {
            echo "   ⚠️  " . $e->getMessage() . "\n";
        }
    }
    echo "\n";
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "LOGO COLUMNS CHECK COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

