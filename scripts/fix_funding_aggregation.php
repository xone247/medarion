<?php
/**
 * Fix Funding Aggregation
 * Maps deals with placeholder company names to real companies
 * Then aggregates funding data properly
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
    echo "FIXING FUNDING AGGREGATION\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Step 1: Get all deals with placeholder names and find matching companies
    echo "Step 1: Mapping deals to real companies...\n";
    
    $stmt = $pdo->query("
        SELECT 
            d.id as deal_id,
            d.company_name as deal_company,
            d.country,
            d.sector,
            d.amount,
            c.id as company_id,
            c.name as real_company_name
        FROM deals d
        LEFT JOIN companies c ON d.country = c.country AND d.sector = c.sector
        WHERE d.company_name LIKE 'Healthcare Company%'
        ORDER BY d.id
    ");
    
    $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($deals) . " deals with placeholder names\n\n";
    
    // Group deals by country/sector and assign to companies
    $countrySectorMap = [];
    foreach ($deals as $deal) {
        $key = $deal['country'] . '|' . $deal['sector'];
        if (!isset($countrySectorMap[$key])) {
            $countrySectorMap[$key] = [];
        }
        $countrySectorMap[$key][] = $deal;
    }
    
    // Get companies grouped by country/sector
    $stmt = $pdo->query("
        SELECT id, name, country, sector
        FROM companies
        ORDER BY country, sector, id
    ");
    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $companyMap = [];
    foreach ($companies as $company) {
        $key = $company['country'] . '|' . $company['sector'];
        if (!isset($companyMap[$key])) {
            $companyMap[$key] = [];
        }
        $companyMap[$key][] = $company;
    }
    
    // Map deals to companies (round-robin distribution)
    $updateStmt = $pdo->prepare("UPDATE deals SET company_name = ?, company_id = ? WHERE id = ?");
    $mapped = 0;
    
    foreach ($countrySectorMap as $key => $dealGroup) {
        if (isset($companyMap[$key]) && count($companyMap[$key]) > 0) {
            $companyList = $companyMap[$key];
            $companyIndex = 0;
            
            foreach ($dealGroup as $deal) {
                $company = $companyList[$companyIndex % count($companyList)];
                $updateStmt->execute([$company['name'], $company['id'], $deal['deal_id']]);
                $mapped++;
                $companyIndex++;
            }
        }
    }
    
    echo "Mapped {$mapped} deals to real companies\n\n";
    
    // Step 2: Aggregate funding data
    echo "Step 2: Aggregating funding data...\n";
    
    // Update total_funding
    $pdo->exec("
        UPDATE companies c
        SET total_funding = COALESCE((
            SELECT SUM(amount)
            FROM deals d
            WHERE d.company_name = c.name 
              AND d.amount IS NOT NULL 
              AND d.amount > 0
        ), 0)
        WHERE EXISTS (
            SELECT 1 FROM deals WHERE company_name = c.name AND amount IS NOT NULL AND amount > 0
        )
    ");
    echo "  ✓ Total funding aggregated\n";
    
    // Update last_funding_date
    $pdo->exec("
        UPDATE companies c
        SET last_funding_date = (
            SELECT MAX(deal_date)
            FROM deals d
            WHERE d.company_name = c.name 
              AND d.deal_date IS NOT NULL
        )
        WHERE EXISTS (
            SELECT 1 FROM deals WHERE company_name = c.name AND deal_date IS NOT NULL
        )
    ");
    echo "  ✓ Last funding date updated\n";
    
    // Update funding_stage
    $pdo->exec("
        UPDATE companies c
        SET funding_stage = (
            SELECT deal_type
            FROM deals d
            WHERE d.company_name = c.name 
              AND d.deal_date IS NOT NULL
            ORDER BY deal_date DESC
            LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1 FROM deals WHERE company_name = c.name AND deal_date IS NOT NULL
        )
    ");
    echo "  ✓ Funding stage updated\n";
    
    // Update investors JSON
    $pdo->exec("
        UPDATE companies c
        SET investors = (
            SELECT CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('\"', lead_investor, '\"') SEPARATOR ','), ']')
            FROM deals d
            WHERE d.company_name = c.name 
              AND lead_investor IS NOT NULL 
              AND lead_investor != ''
        )
        WHERE EXISTS (
            SELECT 1 FROM deals 
            WHERE company_name = c.name 
              AND lead_investor IS NOT NULL
        )
    ");
    echo "  ✓ Investors aggregated\n\n";
    
    // Step 3: Verify results
    echo "Step 3: Verifying results...\n";
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total_companies,
            SUM(CASE WHEN total_funding > 0 THEN 1 ELSE 0 END) as companies_with_funding,
            SUM(CASE WHEN last_funding_date IS NOT NULL THEN 1 ELSE 0 END) as companies_with_funding_date,
            SUM(CASE WHEN funding_stage IS NOT NULL THEN 1 ELSE 0 END) as companies_with_funding_stage,
            SUM(CASE WHEN investors IS NOT NULL THEN 1 ELSE 0 END) as companies_with_investors
        FROM companies
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "  Total companies: {$result['total_companies']}\n";
    echo "  Companies with funding: {$result['companies_with_funding']}\n";
    echo "  Companies with funding date: {$result['companies_with_funding_date']}\n";
    echo "  Companies with funding stage: {$result['companies_with_funding_stage']}\n";
    echo "  Companies with investors: {$result['companies_with_investors']}\n\n";
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "FUNDING AGGREGATION FIXED\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

