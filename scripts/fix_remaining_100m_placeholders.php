<?php
/**
 * Fix Remaining $100M Placeholders
 * Sets companies without deals to $0 instead of $100M placeholder
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
    echo "FIXING REMAINING $100M PLACEHOLDERS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Find companies with $100M placeholder
    $companies = $pdo->query("
        SELECT id, name, total_funding 
        FROM companies 
        WHERE total_funding = 100000000
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($companies) . " companies with $100M placeholder:\n";
    foreach ($companies as $company) {
        echo "  - {$company['name']} (ID: {$company['id']})\n";
    }
    echo "\n";
    
    // Check if they have deals
    foreach ($companies as $company) {
        $dealCount = $pdo->prepare("SELECT COUNT(*) FROM deals WHERE company_id = ? AND amount > 0");
        $dealCount->execute([$company['id']]);
        $count = $dealCount->fetchColumn();
        
        if ($count == 0) {
            // No deals, set to $0
            $update = $pdo->prepare("UPDATE companies SET total_funding = 0 WHERE id = ?");
            $update->execute([$company['id']]);
            echo "  ✓ {$company['name']}: Set to $0 (no deals found)\n";
        } else {
            echo "  ⚠️  {$company['name']}: Has {$count} deals but still shows $100M - checking...\n";
        }
    }
    
    // Re-aggregate one more time
    echo "\nRe-aggregating funding from deals...\n";
    $pdo->exec("
        UPDATE companies c
        LEFT JOIN (
            SELECT 
                company_id,
                COALESCE(SUM(amount), 0) as total_funding,
                MAX(COALESCE(deal_date, created_at, updated_at)) as last_funding_date
            FROM deals
            WHERE company_id IS NOT NULL AND amount > 0
            GROUP BY company_id
        ) d ON c.id = d.company_id
        SET 
            c.total_funding = COALESCE(d.total_funding, 0),
            c.last_funding_date = d.last_funding_date
        WHERE c.total_funding = 100000000
    ");
    
    // Final check
    $finalCheck = $pdo->query("SELECT COUNT(*) FROM companies WHERE total_funding = 100000000")->fetchColumn();
    echo "\n✓ Remaining $100M placeholders: {$finalCheck}\n";
    
    if ($finalCheck > 0) {
        echo "\nSetting remaining to $0...\n";
        $pdo->exec("UPDATE companies SET total_funding = 0 WHERE total_funding = 100000000");
        echo "✓ All $100M placeholders removed\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "PLACEHOLDER FIX COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

