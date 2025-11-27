<?php
/**
 * Fix investors table structure to match seed file
 */
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "Fixing investors table structure...\n\n";

// Add missing columns or modify existing ones
$alterations = [
    // Add founded_year if it doesn't exist (rename from founded)
    "ALTER TABLE investors ADD COLUMN founded_year INT NULL AFTER headquarters",
    // Add is_active if it doesn't exist
    "ALTER TABLE investors ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER portfolio_exits",
    // Modify type enum to match seed file
    "ALTER TABLE investors MODIFY type ENUM('VC', 'PE', 'Angel', 'Corporate', 'Government', 'Foundation', 'Accelerator') DEFAULT 'VC'",
];

foreach ($alterations as $sql) {
    try {
        $pdo->exec($sql);
        echo "✅ " . substr($sql, 0, 80) . "...\n";
    } catch (PDOException $e) {
        // Check if error is because column already exists or enum already correct
        if (strpos($e->getMessage(), "Duplicate column") !== false || 
            strpos($e->getMessage(), "already exists") !== false) {
            echo "⚠️  Column/constraint already exists, skipping...\n";
        } else {
            echo "⚠️  " . $e->getMessage() . "\n";
        }
    }
}

echo "\n✅ Investors table structure updated\n";

