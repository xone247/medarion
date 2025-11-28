<?php
/**
 * Check Company Data and Logos
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
    echo "CHECKING COMPANY DATA\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Total companies
    $total = $pdo->query('SELECT COUNT(*) FROM companies')->fetchColumn();
    echo "Total companies in database: {$total}\n\n";
    
    // Companies with logos
    $withLogos = $pdo->query('SELECT COUNT(*) FROM companies WHERE logo_url IS NOT NULL AND logo_url != ""')->fetchColumn();
    echo "Companies with logo_url: {$withLogos}\n";
    
    // Companies with data
    $withData = $pdo->query('SELECT COUNT(*) FROM companies WHERE (description IS NOT NULL AND description != "") OR (total_funding > 0) OR (website IS NOT NULL AND website != "")')->fetchColumn();
    echo "Companies with data (description, funding, or website): {$withData}\n\n";
    
    // Sample companies with logos
    echo "Sample companies with logos:\n";
    $companies = $pdo->query('SELECT id, name, logo_url FROM companies WHERE logo_url IS NOT NULL AND logo_url != "" LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($companies as $company) {
        echo "  - {$company['name']}: {$company['logo_url']}\n";
    }
    echo "\n";
    
    // Check logo URL formats
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN logo_url LIKE '/uploads/%' THEN 1 END) as relative_path,
            COUNT(CASE WHEN logo_url LIKE 'http%' THEN 1 END) as absolute_url,
            COUNT(CASE WHEN logo_url LIKE 'https://api.medarion.africa%' THEN 1 END) as api_url
        FROM companies 
        WHERE logo_url IS NOT NULL AND logo_url != ''
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Logo URL formats:\n";
    echo "  Total with logos: {$result['total']}\n";
    echo "  Relative paths (/uploads/...): {$result['relative_path']}\n";
    echo "  Absolute URLs (http...): {$result['absolute_url']}\n";
    echo "  API URLs (https://api.medarion.africa...): {$result['api_url']}\n\n";
    
    // Check local logo files
    $logoDir = __DIR__ . '/../public/uploads/company/';
    if (is_dir($logoDir)) {
        $logoFiles = glob($logoDir . '*.{png,jpg,jpeg,svg}', GLOB_BRACE);
        echo "Local logo files found: " . count($logoFiles) . "\n";
        echo "Sample files:\n";
        foreach (array_slice($logoFiles, 0, 5) as $file) {
            echo "  - " . basename($file) . "\n";
        }
    } else {
        echo "Logo directory not found: {$logoDir}\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

