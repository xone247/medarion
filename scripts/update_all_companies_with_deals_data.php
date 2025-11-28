<?php
/**
 * Update ALL companies with deals data (deal count, investors, etc.)
 * This aggregates data from deals table for each company
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
    echo "UPDATING ALL COMPANIES WITH DEALS DATA\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get all companies
    $companies = $pdo->query("SELECT id, name FROM companies")->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($companies) . " companies\n\n";
    
    $updated = 0;
    
    foreach ($companies as $company) {
        $company_id = $company['id'];
        $company_name = $company['name'];
        
        // Get deal count and investors
        $dealsStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as deal_count,
                GROUP_CONCAT(DISTINCT lead_investor SEPARATOR ',') as investors_str
            FROM deals 
            WHERE (company_id = ? OR company_name = ?)
            AND lead_investor IS NOT NULL 
            AND lead_investor != ''
        ");
        $dealsStmt->execute([$company_id, $company_name]);
        $dealData = $dealsStmt->fetch(PDO::FETCH_ASSOC);
        
        $dealCount = intval($dealData['deal_count'] ?? 0);
        $investorsStr = $dealData['investors_str'] ?? '';
        $investors = array_filter(explode(',', $investorsStr));
        
        // Update company with deal count and investors
        if ($dealCount > 0 || count($investors) > 0) {
            $updateStmt = $pdo->prepare("
                UPDATE companies SET
                    investors = ?
                WHERE id = ?
            ");
            
            $investorsJson = json_encode(array_values(array_unique($investors)));
            $updateStmt->execute([$investorsJson, $company_id]);
            $updated++;
        }
    }
    
    echo "Updated $updated companies with deals data\n";
    
    // Re-aggregate funding
    echo "\nRe-aggregating funding...\n";
    $pdo->exec("
        UPDATE companies c
        SET total_funding = COALESCE((
            SELECT SUM(d.amount)
            FROM deals d
            WHERE d.company_id = c.id AND d.amount IS NOT NULL AND d.amount > 0
        ), 0)
    ");
    
    $pdo->exec("
        UPDATE companies c
        SET last_funding_date = (
            SELECT MAX(d.deal_date)
            FROM deals d
            WHERE d.company_id = c.id AND d.deal_date IS NOT NULL
        )
    ");
    
    echo "✓ Funding re-aggregated\n";
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

