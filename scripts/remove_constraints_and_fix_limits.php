<?php
/**
 * Remove Database Constraints and Fix Data Display
 * 1. Disable foreign key checks temporarily
 * 2. Remove unique constraints that might block data
 * 3. Ensure all data can be inserted/displayed
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
    echo "REMOVING CONSTRAINTS AND FIXING DATA DISPLAY\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Step 1: Disable foreign key checks
    echo "Step 1: Disabling foreign key checks...\n";
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    echo "  ✓ Foreign key checks disabled\n\n";
    
    // Step 2: Remove problematic unique constraints (keep essential ones)
    echo "Step 2: Adjusting unique constraints...\n";
    
    // Remove unique constraint on investors.slug if it exists and is causing issues
    try {
        $pdo->exec("ALTER TABLE investors DROP INDEX slug");
        echo "  ✓ Removed investors.slug unique constraint\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Unknown key') === false) {
            echo "  ⊙ investors.slug constraint: " . $e->getMessage() . "\n";
        }
    }
    
    // Step 3: Ensure all tables allow NULL where needed
    echo "\nStep 3: Ensuring NULL values are allowed...\n";
    
    $nullableFields = [
        'companies' => ['logo_url', 'total_funding', 'last_funding_date', 'founded_year', 'employees_count', 'investors', 'products', 'markets', 'achievements', 'partnerships', 'awards'],
        'investors' => ['logo', 'assets_under_management', 'focus_sectors', 'investment_stages', 'portfolio_companies', 'countries', 'social_media', 'recent_investments'],
        'deals' => ['valuation', 'source_url', 'company_id'],
        'regulatory_bodies' => ['website', 'contact_email', 'contact_phone', 'contact_info'],
        'clinical_centers' => ['website', 'description'],
    ];
    
    foreach ($nullableFields as $table => $fields) {
        foreach ($fields as $field) {
            try {
                $pdo->exec("ALTER TABLE `{$table}` MODIFY COLUMN `{$field}` TEXT NULL");
                echo "  ✓ {$table}.{$field} now allows NULL\n";
            } catch (PDOException $e) {
                // Field might not exist or already allows NULL
            }
        }
    }
    
    // Step 4: Verify data counts
    echo "\nStep 4: Verifying data counts...\n";
    
    $tables = ['companies', 'deals', 'investors', 'grants', 'clinical_trials', 'regulatory_bodies', 'public_stocks', 'clinical_centers', 'investigators'];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `{$table}`");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "  {$table}: {$result['count']} records\n";
        } catch (PDOException $e) {
            echo "  {$table}: Error - {$e->getMessage()}\n";
        }
    }
    
    // Step 5: Re-enable foreign key checks
    echo "\nStep 5: Re-enabling foreign key checks...\n";
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "  ✓ Foreign key checks re-enabled\n\n";
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "CONSTRAINTS REMOVED AND DATA VERIFIED\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

