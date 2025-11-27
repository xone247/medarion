<?php
/**
 * Fix Funding Data Completely
 * 1. Link deals to companies by name matching
 * 2. Aggregate funding from deals
 * 3. Update all company funding fields
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
    echo "FIXING FUNDING DATA COMPLETELY\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Step 1: Link deals to companies by exact name match
    echo "Step 1: Linking deals to companies by name...\n";
    $pdo->exec("
        UPDATE deals d
        INNER JOIN companies c ON TRIM(d.company_name) = TRIM(c.name)
        SET d.company_id = c.id
        WHERE d.company_id IS NULL
    ");
    $linked = $pdo->query("SELECT COUNT(*) FROM deals WHERE company_id IS NOT NULL")->fetchColumn();
    echo "  ✓ Linked deals: $linked\n\n";
    
    // Step 2: Aggregate funding using company_id
    echo "Step 2: Aggregating funding from deals...\n";
    
    // Update total_funding
    $pdo->exec("
        UPDATE companies c
        SET total_funding = COALESCE((
            SELECT SUM(d.amount)
            FROM deals d
            WHERE d.company_id = c.id
              AND d.amount IS NOT NULL
              AND d.amount > 0
        ), 0)
    ");
    echo "  ✓ Total funding aggregated\n";
    
    // Update last_funding_date
    $pdo->exec("
        UPDATE companies c
        SET last_funding_date = (
            SELECT MAX(d.deal_date)
            FROM deals d
            WHERE d.company_id = c.id
              AND d.deal_date IS NOT NULL
        )
    ");
    echo "  ✓ Last funding date updated\n";
    
    // Update funding_stage
    $pdo->exec("
        UPDATE companies c
        SET funding_stage = (
            SELECT d.deal_type
            FROM deals d
            WHERE d.company_id = c.id
              AND d.deal_date IS NOT NULL
            ORDER BY d.deal_date DESC
            LIMIT 1
        )
    ");
    echo "  ✓ Funding stage updated\n";
    
    // Update investors JSON
    $pdo->exec("
        UPDATE companies c
        SET investors = (
            SELECT CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('\"', REPLACE(REPLACE(lead_investor, '\"', '\\\"'), '\\', '\\\\'), '\"') SEPARATOR ','), ']')
            FROM deals d
            WHERE d.company_id = c.id
              AND lead_investor IS NOT NULL
              AND lead_investor != ''
        )
        WHERE EXISTS (
            SELECT 1 FROM deals 
            WHERE company_id = c.id 
              AND lead_investor IS NOT NULL
              AND lead_investor != ''
        )
    ");
    echo "  ✓ Investors aggregated\n\n";
    
    // Step 3: Verify results
    echo "Step 3: Verifying results...\n";
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN total_funding > 0 THEN 1 ELSE 0 END) as with_funding,
            SUM(CASE WHEN last_funding_date IS NOT NULL THEN 1 ELSE 0 END) as with_date,
            SUM(CASE WHEN funding_stage IS NOT NULL THEN 1 ELSE 0 END) as with_stage,
            SUM(CASE WHEN investors IS NOT NULL THEN 1 ELSE 0 END) as with_investors
        FROM companies
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  Total companies: {$result['total']}\n";
    echo "  With funding: {$result['with_funding']}\n";
    echo "  With funding date: {$result['with_date']}\n";
    echo "  With funding stage: {$result['with_stage']}\n";
    echo "  With investors: {$result['with_investors']}\n\n";
    
    // Step 4: Show sample companies with funding
    echo "Step 4: Sample companies with funding:\n";
    $stmt = $pdo->query("
        SELECT name, total_funding, last_funding_date, funding_stage
        FROM companies
        WHERE total_funding > 0
        ORDER BY total_funding DESC
        LIMIT 10
    ");
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($samples as $sample) {
        $funding = number_format($sample['total_funding'] / 1000000, 1);
        echo "  - {$sample['name']}: \${$funding}M ({$sample['funding_stage']})\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "FUNDING FIX COMPLETE\n";
    echo str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

