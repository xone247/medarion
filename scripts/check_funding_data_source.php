<?php
/**
 * Check if funding data is real or generated
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
    echo "CHECKING FUNDING DATA SOURCE\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Check deals
    echo "Sample deals from database:\n";
    $stmt = $pdo->query("SELECT company_name, amount, deal_date, deal_type, description FROM deals WHERE company_id IS NOT NULL AND amount > 0 ORDER BY amount DESC LIMIT 10");
    $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($deals as $deal) {
        echo "Company: {$deal['company_name']}\n";
        echo "  Amount: $" . number_format($deal['amount'], 2) . "\n";
        echo "  Date: {$deal['deal_date']}\n";
        echo "  Type: {$deal['deal_type']}\n";
        echo "  Description: " . substr($deal['description'], 0, 60) . "...\n";
        echo "\n";
    }
    
    // Check companies with funding
    echo "\nSample companies with aggregated funding:\n";
    $stmt = $pdo->query("SELECT name, total_funding, last_funding_date, funding_stage FROM companies WHERE total_funding > 0 ORDER BY total_funding DESC LIMIT 10");
    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($companies as $company) {
        echo "Company: {$company['name']}\n";
        echo "  Total Funding: $" . number_format($company['total_funding'], 2) . "\n";
        echo "  Last Funding: {$company['last_funding_date']}\n";
        echo "  Stage: {$company['funding_stage']}\n";
        echo "\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

