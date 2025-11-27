<?php
/**
 * Update companies with comprehensive researched data
 * This will populate ALL fields: founded_year, employees_count, products, markets, achievements, partnerships, awards
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
    echo "UPDATING COMPANIES WITH COMPREHENSIVE DATA\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Load comprehensive company data
    if (!file_exists(__DIR__ . '/../comprehensive_company_data.json')) {
        echo "Error: comprehensive_company_data.json not found\n";
        exit(1);
    }
    
    $companyData = json_decode(file_get_contents(__DIR__ . '/../comprehensive_company_data.json'), true);
    echo "Loaded " . count($companyData) . " companies with comprehensive data\n\n";
    
    $updated = 0;
    $dealsAdded = 0;
    
    foreach ($companyData as $data) {
        $companyName = $data['name'];
        
        // Find company in database
        $findStmt = $pdo->prepare("SELECT id FROM companies WHERE name = ? LIMIT 1");
        $findStmt->execute([$companyName]);
        $company = $findStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$company) {
            // Company doesn't exist, create it
            $insertStmt = $pdo->prepare("
                INSERT INTO companies (
                    name, description, website, industry, sector, stage, 
                    founded_year, employees_count, headquarters, country,
                    products, markets, achievements, partnerships, awards, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
            ");
            
            $insertStmt->execute([
                $data['name'],
                $data['description'] ?? '',
                $data['website'] ?? '',
                $data['industry'] ?? 'Healthcare Technology',
                $data['sector'] ?? '',
                $data['stage'] ?? 'growth',
                $data['founded_year'] ?? null,
                $data['employees_count'] ?? null,
                $data['headquarters'] ?? '',
                $data['country'] ?? '',
                json_encode($data['products'] ?? []),
                json_encode($data['markets'] ?? []),
                json_encode($data['achievements'] ?? []),
                json_encode($data['partnerships'] ?? []),
                json_encode($data['awards'] ?? []),
            ]);
            
            $companyId = $pdo->lastInsertId();
            echo "  ✓ Created company: {$companyName}\n";
        } else {
            $companyId = $company['id'];
            
            // Update company with comprehensive data
            $updateStmt = $pdo->prepare("
                UPDATE companies SET
                    description = ?,
                    website = ?,
                    industry = ?,
                    sector = ?,
                    stage = ?,
                    founded_year = ?,
                    employees_count = ?,
                    headquarters = ?,
                    country = ?,
                    products = ?,
                    markets = ?,
                    achievements = ?,
                    partnerships = ?,
                    awards = ?
                WHERE id = ?
            ");
            
            $updateStmt->execute([
                $data['description'] ?? '',
                $data['website'] ?? '',
                $data['industry'] ?? 'Healthcare Technology',
                $data['sector'] ?? '',
                $data['stage'] ?? 'growth',
                $data['founded_year'] ?? null,
                $data['employees_count'] ?? null,
                $data['headquarters'] ?? '',
                $data['country'] ?? '',
                json_encode($data['products'] ?? []),
                json_encode($data['markets'] ?? []),
                json_encode($data['achievements'] ?? []),
                json_encode($data['partnerships'] ?? []),
                json_encode($data['awards'] ?? []),
                $companyId
            ]);
            
            echo "  ✓ Updated company: {$companyName}\n";
            $updated++;
        }
        
        // Add funding rounds as deals
        if (isset($data['funding_rounds']) && is_array($data['funding_rounds'])) {
            foreach ($data['funding_rounds'] as $round) {
                // Check if deal already exists
                $checkDeal = $pdo->prepare("
                    SELECT id FROM deals 
                    WHERE company_id = ? AND deal_date = ? AND amount = ?
                    LIMIT 1
                ");
                $checkDeal->execute([
                    $companyId,
                    $round['date'] ?? null,
                    $round['amount'] ?? 0
                ]);
                
                if (!$checkDeal->fetch()) {
                    // Map deal type
                    $dealType = strtolower($round['type'] ?? 'seed');
                    $dealTypeMap = [
                        'seed' => 'seed',
                        'pre-seed' => 'seed',
                        'series a' => 'series_a',
                        'series b' => 'series_b',
                        'series c' => 'series_c',
                        'series d' => 'series_d',
                        'ipo' => 'ipo',
                        'acquisition' => 'acquisition',
                        'merger' => 'merger',
                        'corporate' => 'series_c'
                    ];
                    $mappedDealType = $dealTypeMap[$dealType] ?? 'seed';
                    
                    $insertDeal = $pdo->prepare("
                        INSERT INTO deals (
                            company_id, company_name, deal_type, amount, deal_date,
                            lead_investor, status, sector, country, description
                        ) VALUES (?, ?, ?, ?, ?, ?, 'closed', ?, ?, ?)
                    ");
                    
                    $insertDeal->execute([
                        $companyId,
                        $companyName,
                        $mappedDealType,
                        $round['amount'] ?? 0,
                        $round['date'] ?? null,
                        $round['investor'] ?? '',
                        $data['sector'] ?? '',
                        $data['country'] ?? '',
                        "{$round['type']} funding round"
                    ]);
                    
                    $dealsAdded++;
                }
            }
        }
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "Re-aggregating funding...\n";
    
    // Re-aggregate funding
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
    
    echo "✓ Funding re-aggregated\n\n";
    
    // Verification
    echo "Verification:\n";
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN founded_year IS NOT NULL THEN 1 ELSE 0 END) as with_founded,
            SUM(CASE WHEN employees_count IS NOT NULL THEN 1 ELSE 0 END) as with_employees,
            SUM(CASE WHEN products IS NOT NULL AND products != '[]' THEN 1 ELSE 0 END) as with_products,
            SUM(CASE WHEN markets IS NOT NULL AND markets != '[]' THEN 1 ELSE 0 END) as with_markets,
            SUM(CASE WHEN achievements IS NOT NULL AND achievements != '[]' THEN 1 ELSE 0 END) as with_achievements
        FROM companies
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  Total companies: {$result['total']}\n";
    echo "  With founded_year: {$result['with_founded']}\n";
    echo "  With employees_count: {$result['with_employees']}\n";
    echo "  With products: {$result['with_products']}\n";
    echo "  With markets: {$result['with_markets']}\n";
    echo "  With achievements: {$result['with_achievements']}\n";
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    echo "Updated: $updated companies\n";
    echo "Added: $dealsAdded deals\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

