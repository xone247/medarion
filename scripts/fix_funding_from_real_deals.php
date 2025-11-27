<?php
/**
 * Fix Funding by Linking Real Deals to Real Companies
 * The issue is that deals have placeholder names that don't match real companies
 * We need to link deals to companies based on actual matching criteria
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
    echo "FIXING FUNDING FROM REAL DEALS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Step 1: Check what deals we have
    echo "Step 1: Analyzing deals...\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total, SUM(CASE WHEN company_name LIKE 'Healthcare Company%' THEN 1 ELSE 0 END) as placeholders, SUM(CASE WHEN company_name NOT LIKE 'Healthcare Company%' AND company_name IS NOT NULL AND company_name != '' THEN 1 ELSE 0 END) as real_names FROM deals");
    $dealStats = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  Total deals: {$dealStats['total']}\n";
    echo "  Placeholder names: {$dealStats['placeholders']}\n";
    echo "  Real company names: {$dealStats['real_names']}\n\n";
    
    // Step 2: Link deals with real company names
    echo "Step 2: Linking deals with real company names...\n";
    $pdo->exec("
        UPDATE deals d
        INNER JOIN companies c ON TRIM(d.company_name) = TRIM(c.name)
        SET d.company_id = c.id
        WHERE d.company_id IS NULL
          AND d.company_name IS NOT NULL
          AND d.company_name != ''
          AND d.company_name NOT LIKE 'Healthcare Company%'
    ");
    $linked = $pdo->query("SELECT COUNT(*) FROM deals WHERE company_id IS NOT NULL")->fetchColumn();
    echo "  ✓ Linked deals: $linked\n\n";
    
    // Step 3: For placeholder deals, try to match by country and sector
    echo "Step 3: Matching placeholder deals to companies by country/sector...\n";
    $pdo->exec("
        UPDATE deals d
        INNER JOIN (
            SELECT 
                d.id as deal_id,
                c.id as company_id,
                ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY c.id) as rn
            FROM deals d
            INNER JOIN companies c ON d.country = c.country AND d.sector = c.sector
            WHERE d.company_id IS NULL
              AND d.company_name LIKE 'Healthcare Company%'
        ) mapping ON d.id = mapping.deal_id AND mapping.rn = 1
        SET d.company_id = mapping.company_id
        WHERE d.company_id IS NULL
    ");
    $linked2 = $pdo->query("SELECT COUNT(*) FROM deals WHERE company_id IS NOT NULL")->fetchColumn();
    echo "  ✓ Total linked deals: $linked2\n\n";
    
    // Step 4: Aggregate funding
    echo "Step 4: Aggregating funding from deals...\n";
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
    echo "  ✓ Funding stage updated\n\n";
    
    // Step 5: Verify
    echo "Step 5: Verifying results...\n";
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN total_funding > 0 THEN 1 ELSE 0 END) as with_funding,
            SUM(CASE WHEN last_funding_date IS NOT NULL THEN 1 ELSE 0 END) as with_date,
            SUM(CASE WHEN funding_stage IS NOT NULL THEN 1 ELSE 0 END) as with_stage
        FROM companies
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  Total companies: {$result['total']}\n";
    echo "  With funding: {$result['with_funding']}\n";
    echo "  With funding date: {$result['with_date']}\n";
    echo "  With funding stage: {$result['with_stage']}\n\n";
    
    // Step 6: Show sample
    if ($result['with_funding'] > 0) {
        echo "Step 6: Sample companies with funding:\n";
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
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "FUNDING FIX COMPLETE\n";
    echo str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

