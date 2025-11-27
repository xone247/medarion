<?php
/**
 * Fix africa_countries table to allow NULLs for missing data
 */
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// Modify table to allow NULLs for fields that might be missing
$alterations = [
    "ALTER TABLE africa_countries MODIFY capital VARCHAR(100) NULL",
    "ALTER TABLE africa_countries MODIFY currency VARCHAR(100) NULL",
    "ALTER TABLE africa_countries MODIFY currency_code VARCHAR(10) NULL",
    "ALTER TABLE africa_countries MODIFY flag VARCHAR(10) NULL",
];

foreach ($alterations as $sql) {
    try {
        $pdo->exec($sql);
        echo "✅ " . substr($sql, 0, 60) . "...\n";
    } catch (PDOException $e) {
        echo "⚠️  " . $e->getMessage() . "\n";
    }
}

echo "\n✅ Table structure updated\n";

