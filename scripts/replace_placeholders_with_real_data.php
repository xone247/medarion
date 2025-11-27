<?php
/**
 * Replace placeholder companies with real companies
 * Match logos to real company names
 * Update deals with real funding data
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
    echo "REPLACING PLACEHOLDERS WITH REAL DATA\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Step 1: Load real deals from Excel and research
    echo "Step 1: Loading real deals data...\n";
    $realDeals = [];
    
    if (file_exists(__DIR__ . '/../real_deals_from_excel.json')) {
        $excelDeals = json_decode(file_get_contents(__DIR__ . '/../real_deals_from_excel.json'), true);
        $realDeals = array_merge($realDeals, $excelDeals);
        echo "  ✓ Loaded " . count($excelDeals) . " deals from Excel\n";
    }
    
    if (file_exists(__DIR__ . '/../researched_funding_data.json')) {
        $researchedDeals = json_decode(file_get_contents(__DIR__ . '/../researched_funding_data.json'), true);
        $realDeals = array_merge($realDeals, $researchedDeals);
        echo "  ✓ Loaded " . count($researchedDeals) . " researched deals\n";
    }
    
    echo "  Total real deals: " . count($realDeals) . "\n\n";
    
    // Step 2: Get list of real companies (not placeholders)
    echo "Step 2: Identifying real companies...\n";
    $realCompanyNames = [];
    foreach ($realDeals as $deal) {
        if (!empty($deal['company_name']) && 
            stripos($deal['company_name'], 'Healthcare Company') === false &&
            stripos($deal['company_name'], 'Placeholder') === false &&
            stripos($deal['company_name'], 'Tech') === false &&
            stripos($deal['company_name'], 'Health') === false &&
            stripos($deal['company_name'], 'Pharma') === false &&
            stripos($deal['company_name'], 'Med') === false &&
            stripos($deal['company_name'], 'Care') === false &&
            stripos($deal['company_name'], 'Bio') === false &&
            stripos($deal['company_name'], 'Elite') === false &&
            stripos($deal['company_name'], 'Well') === false &&
            stripos($deal['company_name'], 'Vita') === false &&
            stripos($deal['company_name'], 'Smart') === false &&
            stripos($deal['company_name'], 'Digital') === false &&
            stripos($deal['company_name'], 'Apex') === false &&
            stripos($deal['company_name'], 'Prime') === false &&
            stripos($deal['company_name'], 'Pro') === false &&
            stripos($deal['company_name'], 'Life') === false) {
            $realCompanyNames[] = $deal['company_name'];
        }
    }
    $realCompanyNames = array_unique($realCompanyNames);
    echo "  ✓ Found " . count($realCompanyNames) . " real company names\n\n";
    
    // Step 3: Update deals with real data
    echo "Step 3: Updating deals with real data...\n";
    $updateStmt = $pdo->prepare("
        UPDATE deals 
        SET company_name = ?, amount = ?, deal_date = ?, deal_type = ?, 
            lead_investor = ?, description = ?, sector = ?
        WHERE id = ?
    ");
    
    $updated = 0;
    foreach ($realDeals as $deal) {
        // Find a deal to update (prefer placeholders)
        $findStmt = $pdo->prepare("
            SELECT id FROM deals 
            WHERE (company_name LIKE 'Healthcare Company%' OR 
                   company_name LIKE '%Tech%' OR 
                   company_name LIKE '%Health%' OR
                   company_name LIKE '%Pharma%' OR
                   company_name LIKE '%Med%' OR
                   company_name LIKE '%Care%' OR
                   company_name LIKE '%Bio%' OR
                   company_name LIKE '%Elite%' OR
                   company_name LIKE '%Well%' OR
                   company_name LIKE '%Vita%' OR
                   company_name LIKE '%Smart%' OR
                   company_name LIKE '%Digital%' OR
                   company_name LIKE '%Apex%' OR
                   company_name LIKE '%Prime%' OR
                   company_name LIKE '%Pro%' OR
                   company_name LIKE '%Life%')
            AND company_id IS NULL
            LIMIT 1
        ");
        $findStmt->execute();
        $dealToUpdate = $findStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($dealToUpdate) {
            $updateStmt->execute([
                $deal['company_name'],
                $deal['amount'] ?? 0,
                $deal['deal_date'] ?? null,
                $deal['deal_type'] ?? 'Unknown',
                $deal['lead_investor'] ?? '',
                $deal['description'] ?? '',
                $deal['sector'] ?? '',
                $dealToUpdate['id']
            ]);
            $updated++;
        }
    }
    echo "  ✓ Updated $updated deals with real data\n\n";
    
    // Step 4: Link deals to real companies
    echo "Step 4: Linking deals to real companies...\n";
    $pdo->exec("
        UPDATE deals d
        INNER JOIN companies c ON TRIM(d.company_name) = TRIM(c.name)
        SET d.company_id = c.id
        WHERE d.company_id IS NULL
    ");
    $linked = $pdo->query("SELECT COUNT(*) FROM deals WHERE company_id IS NOT NULL")->fetchColumn();
    echo "  ✓ Linked $linked deals to companies\n\n";
    
    // Step 5: Match logos to companies
    echo "Step 5: Matching logos to companies...\n";
    $logoDir = __DIR__ . '/../public/uploads/company';
    $logoFiles = [];
    if (is_dir($logoDir)) {
        $files = scandir($logoDir);
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
                $logoFiles[] = $file;
            }
        }
    }
    
    $logoMatched = 0;
    foreach ($logoFiles as $logoFile) {
        // Extract company name from filename
        $baseName = pathinfo($logoFile, PATHINFO_FILENAME);
        $companyName = str_replace(['_', '-'], ' ', $baseName);
        $companyName = ucwords($companyName);
        
        // Try to match to company
        $matchStmt = $pdo->prepare("
            UPDATE companies 
            SET logo_url = ? 
            WHERE (name LIKE ? OR name = ?) 
            AND (logo_url IS NULL OR logo_url = '')
            LIMIT 1
        ");
        $logoUrl = 'https://api.medarion.africa/uploads/company/' . $logoFile;
        $matchStmt->execute([$logoUrl, "%$companyName%", $companyName]);
        if ($matchStmt->rowCount() > 0) {
            $logoMatched++;
        }
    }
    echo "  ✓ Matched $logoMatched logos to companies\n\n";
    
    // Step 6: Re-aggregate funding
    echo "Step 6: Re-aggregating funding...\n";
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
    $pdo->exec("
        UPDATE companies c
        SET last_funding_date = (
            SELECT MAX(d.deal_date)
            FROM deals d
            WHERE d.company_id = c.id
              AND d.deal_date IS NOT NULL
        )
    ");
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
    echo "  ✓ Funding re-aggregated\n\n";
    
    // Step 7: Verify
    echo "Step 7: Verifying results...\n";
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN total_funding > 0 THEN 1 ELSE 0 END) as with_funding,
            SUM(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 ELSE 0 END) as with_logo
        FROM companies
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  Total companies: {$result['total']}\n";
    echo "  With funding: {$result['with_funding']}\n";
    echo "  With logos: {$result['with_logo']}\n\n";
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

