<?php
/**
 * Check Company Logos
 * Verifies logo URLs and fixes them if needed
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
    echo "CHECKING COMPANY LOGOS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Check logo URLs
    $companies = $pdo->query("SELECT id, name, logo_url FROM companies WHERE logo_url IS NOT NULL AND logo_url != '' LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Sample companies with logo_url:\n";
    foreach ($companies as $company) {
        echo "  - {$company['name']}: {$company['logo_url']}\n";
    }
    echo "\n";
    
    // Check if logo files exist
    $logoDir = __DIR__ . '/../public/uploads/company/';
    $logoFiles = glob($logoDir . '*.png');
    echo "Logo files found: " . count($logoFiles) . "\n";
    echo "Sample files:\n";
    foreach (array_slice($logoFiles, 0, 5) as $file) {
        echo "  - " . basename($file) . "\n";
    }
    echo "\n";
    
    // Check logo URL format
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN logo_url LIKE '/uploads/%' THEN 1 END) as relative_path, COUNT(CASE WHEN logo_url LIKE 'http%' THEN 1 END) as absolute_url FROM companies WHERE logo_url IS NOT NULL AND logo_url != ''");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Logo URL formats:\n";
    echo "  Total with logos: {$result['total']}\n";
    echo "  Relative paths (/uploads/...): {$result['relative_path']}\n";
    echo "  Absolute URLs (http...): {$result['absolute_url']}\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

