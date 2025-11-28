<?php
/**
 * Check Companies API Response
 * This script checks what the API actually returns
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
    echo "CHECKING COMPANIES API RESPONSE\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Simulate what the API does
    $query = 'SELECT * FROM companies ORDER BY created_at DESC';
    $companies = $pdo->query($query)->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Total companies in database: " . count($companies) . "\n\n";
    
    // Check companies with logos
    $withLogos = 0;
    $logoUrls = [];
    foreach ($companies as $company) {
        if (!empty($company['logo_url'])) {
            $withLogos++;
            $logoUrls[] = $company['logo_url'];
        }
    }
    
    echo "Companies with logo_url: {$withLogos}\n";
    echo "Sample logo URLs:\n";
    foreach (array_slice($logoUrls, 0, 5) as $url) {
        echo "  - {$url}\n";
    }
    echo "\n";
    
    // Check logo file accessibility
    echo "Checking logo file paths:\n";
    $logoDir = __DIR__ . '/../public/uploads/company/';
    if (is_dir($logoDir)) {
        $logoFiles = glob($logoDir . '*.{png,jpg,jpeg,svg}', GLOB_BRACE);
        echo "  Local logo files: " . count($logoFiles) . "\n";
        
        // Check if logo URLs match local files
        $matched = 0;
        foreach ($logoUrls as $url) {
            // Extract filename from URL
            $filename = basename($url);
            $localPath = $logoDir . $filename;
            if (file_exists($localPath)) {
                $matched++;
            }
        }
        echo "  Logo URLs matching local files: {$matched} / {$withLogos}\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

