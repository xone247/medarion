<?php
/**
 * Comprehensive Company Data Enrichment Script
 * 1. Downloads company logos
 * 2. Aggregates funding from deals
 * 3. Updates database with enriched data
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
    echo "COMPREHENSIVE COMPANY DATA ENRICHMENT\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Step 1: First, update deals to link to real companies
    echo "Step 1: Linking deals to real companies...\n";
    try {
        // Update deals with real company names based on country/sector matching
        $updateDeals = "
            UPDATE deals d
            INNER JOIN (
                SELECT 
                    d.id as deal_id,
                    c.name as company_name,
                    c.id as company_id,
                    ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY c.id) as rn
                FROM deals d
                INNER JOIN companies c ON d.country = c.country AND d.sector = c.sector
                WHERE d.company_name LIKE 'Healthcare Company%'
            ) mapping ON d.id = mapping.deal_id AND mapping.rn = 1
            SET d.company_name = mapping.company_name,
                d.company_id = mapping.company_id
            WHERE d.company_name LIKE 'Healthcare Company%'
        ";
        $pdo->exec($updateDeals);
        echo "  ✓ Deals linked to companies\n\n";
    } catch (PDOException $e) {
        echo "  ⚠️  Warning: " . $e->getMessage() . "\n\n";
    }
    
    // Step 2: Aggregate funding from deals
    echo "Step 2: Aggregating funding data from deals...\n";
    
    // Update total_funding
    $updateFunding = "
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
    ";
    $pdo->exec($updateFunding);
    echo "  ✓ Total funding aggregated\n";
    
    // Update last_funding_date
    $updateDate = "
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
    ";
    $pdo->exec($updateDate);
    echo "  ✓ Last funding date updated\n";
    
    // Update funding_stage
    $updateStage = "
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
    ";
    $pdo->exec($updateStage);
    echo "  ✓ Funding stage updated\n";
    
    // Update investors JSON (using GROUP_CONCAT for MariaDB compatibility)
    $updateInvestors = "
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
    ";
    $pdo->exec($updateInvestors);
    echo "  ✓ Investors aggregated\n\n";
    
    // Step 3: Verify funding aggregation
    echo "Step 3: Verifying funding aggregation...\n";
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
    
    // Step 4: Download logos (using existing logo download infrastructure)
    echo "Step 4: Logo download will be handled separately via Python script\n";
    echo "  (Run: python scripts/download_all_company_logos_from_db.py)\n\n";
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "FUNDING AGGREGATION COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

