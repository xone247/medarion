<?php
/**
 * Fix Company Logo URLs
 * Converts relative paths to full API URLs for proper display
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
    echo "FIXING COMPANY LOGO URLS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Base URL for logos
    $baseUrl = 'https://api.medarion.africa';
    
    // Get companies with relative logo paths
    $companies = $pdo->query("
        SELECT id, name, logo_url 
        FROM companies 
        WHERE logo_url IS NOT NULL 
        AND logo_url != '' 
        AND logo_url NOT LIKE 'http%'
        AND logo_url LIKE '/uploads/%'
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($companies) . " companies with relative logo paths\n\n";
    
    $updateStmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE id = ?");
    $updated = 0;
    
    foreach ($companies as $company) {
        // Convert relative path to full URL
        $newUrl = $baseUrl . $company['logo_url'];
        $updateStmt->execute([$newUrl, $company['id']]);
        $updated++;
        echo "  ✓ {$company['name']}: {$company['logo_url']} -> {$newUrl}\n";
    }
    
    echo "\n✓ Updated {$updated} company logo URLs\n\n";
    
    // Verify
    $verifyStmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN logo_url LIKE 'http%' THEN 1 END) as absolute_urls,
            COUNT(CASE WHEN logo_url LIKE '/uploads/%' THEN 1 END) as relative_paths
        FROM companies 
        WHERE logo_url IS NOT NULL AND logo_url != ''
    ");
    $verify = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Final state:\n";
    echo "  Total with logos: {$verify['total']}\n";
    echo "  Absolute URLs: {$verify['absolute_urls']}\n";
    echo "  Relative paths: {$verify['relative_paths']}\n";
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "LOGO URL FIX COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

