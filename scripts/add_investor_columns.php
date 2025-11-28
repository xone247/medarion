<?php
/**
 * Add missing columns to investors table for comprehensive data
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
    echo "ADDING INVESTOR COLUMNS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    $alterStatements = [
        "ALTER TABLE investors ADD COLUMN IF NOT EXISTS total_invested DECIMAL(20,2) DEFAULT 0",
        "ALTER TABLE investors ADD COLUMN IF NOT EXISTS deal_count INT DEFAULT 0",
        "ALTER TABLE investors ADD COLUMN IF NOT EXISTS avg_deal_size DECIMAL(20,2) DEFAULT 0",
        "ALTER TABLE investors ADD COLUMN IF NOT EXISTS sectors JSON DEFAULT NULL",
        "ALTER TABLE investors ADD COLUMN IF NOT EXISTS geographic_focus JSON DEFAULT NULL",
    ];
    
    foreach ($alterStatements as $sql) {
        try {
            // MySQL doesn't support IF NOT EXISTS for ADD COLUMN, so we check first
            $columnName = '';
            if (strpos($sql, 'total_invested') !== false) $columnName = 'total_invested';
            elseif (strpos($sql, 'deal_count') !== false) $columnName = 'deal_count';
            elseif (strpos($sql, 'avg_deal_size') !== false) $columnName = 'avg_deal_size';
            elseif (strpos($sql, 'sectors') !== false) $columnName = 'sectors';
            elseif (strpos($sql, 'geographic_focus') !== false) $columnName = 'geographic_focus';
            
            if ($columnName) {
                $checkStmt = $pdo->query("SHOW COLUMNS FROM investors LIKE '$columnName'");
                if ($checkStmt->rowCount() == 0) {
                    $pdo->exec(str_replace(' IF NOT EXISTS', '', $sql));
                    echo "  ✓ Added column: $columnName\n";
                } else {
                    echo "  ⊙ Column already exists: $columnName\n";
                }
            }
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column') === false) {
                echo "  ✗ Error: " . $e->getMessage() . "\n";
            } else {
                echo "  ⊙ Column already exists\n";
            }
        }
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "COLUMNS ADDED\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

