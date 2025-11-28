<?php
/**
 * Fix Company Funding Data
 * Re-aggregates funding from deals table to replace placeholder $100M values
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
    echo "FIXING COMPANY FUNDING DATA FROM DEALS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Check current state
    $checkStmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN total_funding = 100000000 THEN 1 END) as placeholder_100m FROM companies");
    $check = $checkStmt->fetch(PDO::FETCH_ASSOC);
    echo "Current state:\n";
    echo "  Total companies: {$check['total']}\n";
    echo "  Companies with $100M placeholder: {$check['placeholder_100m']}\n\n";
    
    // Re-aggregate funding from deals for ALL companies
    echo "Re-aggregating funding from deals table...\n";
    
    $updateStmt = $pdo->prepare("
        UPDATE companies c
        LEFT JOIN (
            SELECT 
                company_id,
                COALESCE(SUM(amount), 0) as total_funding,
                MAX(COALESCE(deal_date, created_at, updated_at)) as last_funding_date,
                GROUP_CONCAT(DISTINCT deal_type ORDER BY deal_type SEPARATOR ', ') as funding_stages
            FROM deals
            WHERE company_id IS NOT NULL AND amount > 0
            GROUP BY company_id
        ) d ON c.id = d.company_id
        SET 
            c.total_funding = COALESCE(d.total_funding, 0),
            c.last_funding_date = d.last_funding_date,
            c.funding_stage = d.funding_stages
        WHERE c.id > 0
    ");
    
    $updateStmt->execute();
    $updated = $updateStmt->rowCount();
    
    echo "✓ Updated {$updated} companies with real funding data\n\n";
    
    // Verify results
    $verifyStmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN total_funding = 100000000 THEN 1 END) as placeholder_100m,
            COUNT(CASE WHEN total_funding > 0 AND total_funding != 100000000 THEN 1 END) as real_funding,
            COUNT(CASE WHEN total_funding = 0 THEN 1 END) as no_funding
        FROM companies
    ");
    $verify = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Final state:\n";
    echo "  Total companies: {$verify['total']}\n";
    echo "  Companies with $100M placeholder: {$verify['placeholder_100m']}\n";
    echo "  Companies with real funding: {$verify['real_funding']}\n";
    echo "  Companies with no funding: {$verify['no_funding']}\n\n";
    
    // Show sample of companies with real funding
    echo "Sample companies with real funding:\n";
    $sampleStmt = $pdo->query("
        SELECT name, total_funding, last_funding_date 
        FROM companies 
        WHERE total_funding > 0 AND total_funding != 100000000 
        ORDER BY total_funding DESC 
        LIMIT 10
    ");
    foreach ($sampleStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $funding = $row['total_funding'] > 0 ? '$' . number_format($row['total_funding'], 0) : 'N/A';
        $date = $row['last_funding_date'] ?: 'N/A';
        echo "  - {$row['name']}: {$funding} (Last: {$date})\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "FUNDING DATA FIX COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

