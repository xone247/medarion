<?php
/**
 * Comprehensive Investor Data Fix and Enrichment
 * 1. Fix logo URLs (convert to absolute URLs)
 * 2. Calculate total_invested, deal_count, avg_deal_size from deals
 * 3. Extract portfolio companies from deals
 * 4. Extract focus_sectors from deals
 * 5. Extract geographic_focus from deals
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
    
    echo "=" . str_repeat("=", 70) . "\n";
    echo "COMPREHENSIVE INVESTOR DATA FIX AND ENRICHMENT\n";
    echo "=" . str_repeat("=", 70) . "\n\n";
    
    // Step 1: Ensure all columns exist
    echo "[1/6] Ensuring investor columns exist...\n";
    try {
        $pdo->exec("ALTER TABLE investors 
            ADD COLUMN IF NOT EXISTS total_invested DECIMAL(20,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS deal_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS avg_deal_size DECIMAL(20,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL,
            ADD COLUMN IF NOT EXISTS focus_sectors JSON NULL,
            ADD COLUMN IF NOT EXISTS geographic_focus JSON NULL,
            ADD COLUMN IF NOT EXISTS portfolio_companies JSON NULL");
        echo "  ✓ Columns checked\n\n";
    } catch (PDOException $e) {
        // Try individual columns
        $columns = [
            'total_invested' => 'DECIMAL(20,2) DEFAULT 0',
            'deal_count' => 'INT DEFAULT 0',
            'avg_deal_size' => 'DECIMAL(20,2) DEFAULT 0',
            'logo_url' => 'VARCHAR(500) NULL',
            'focus_sectors' => 'JSON NULL',
            'geographic_focus' => 'JSON NULL',
            'portfolio_companies' => 'JSON NULL'
        ];
        foreach ($columns as $col => $def) {
            try {
                $pdo->exec("ALTER TABLE investors ADD COLUMN $col $def");
                echo "  ✓ Added column: $col\n";
            } catch (PDOException $e2) {
                // Column exists, ignore
            }
        }
        echo "\n";
    }
    
    // Step 2: Sync logo to logo_url if needed
    echo "[2/6] Syncing logo URLs...\n";
    $pdo->exec("UPDATE investors SET logo_url = logo WHERE logo_url IS NULL AND logo IS NOT NULL");
    $logoCount = $pdo->query("SELECT COUNT(*) FROM investors WHERE logo_url IS NOT NULL")->fetchColumn();
    echo "  ✓ Found $logoCount investors with logos\n\n";
    
    // Step 3: Fix logo URLs to absolute paths
    echo "[3/6] Converting logo URLs to absolute paths...\n";
    $investors = $pdo->query("SELECT id, logo_url FROM investors WHERE logo_url IS NOT NULL")->fetchAll(PDO::FETCH_ASSOC);
    $fixed = 0;
    foreach ($investors as $inv) {
        $logoUrl = $inv['logo_url'];
        if ($logoUrl && !preg_match('/^https?:\/\//', $logoUrl)) {
            // Convert relative to absolute
            if (strpos($logoUrl, '/uploads/') === 0) {
                $newUrl = 'https://api.medarion.africa' . $logoUrl;
            } else if (strpos($logoUrl, 'uploads/') === 0) {
                $newUrl = 'https://api.medarion.africa/uploads/' . substr($logoUrl, 9);
            } else {
                $newUrl = 'https://api.medarion.africa/uploads/investor/' . basename($logoUrl);
            }
            $pdo->prepare("UPDATE investors SET logo_url = ? WHERE id = ?")->execute([$newUrl, $inv['id']]);
            $fixed++;
        }
    }
    echo "  ✓ Fixed $fixed logo URLs\n\n";
    
    // Step 4: Get all investors
    echo "[4/6] Enriching investor data from deals...\n";
    $investors = $pdo->query("SELECT id, name, headquarters FROM investors")->fetchAll(PDO::FETCH_ASSOC);
    echo "  Found " . count($investors) . " investors to enrich\n\n";
    
    $enriched = 0;
    
    foreach ($investors as $investor) {
        $investor_id = $investor['id'];
        $investor_name = $investor['name'];
        
        echo "Enriching: {$investor_name}...\n";
        
        // Find deals for this investor (check lead_investor and participants JSON)
        $dealsStmt = $pdo->prepare("
            SELECT 
                id,
                company_id,
                company_name,
                amount,
                sector,
                country,
                deal_date,
                participants
            FROM deals 
            WHERE lead_investor = ? 
               OR participants LIKE ?
               OR participants LIKE ?
        ");
        $searchPattern1 = "%{$investor_name}%";
        $searchPattern2 = "%" . str_replace(' ', '%', $investor_name) . "%";
        $dealsStmt->execute([$investor_name, $searchPattern1, $searchPattern2]);
        $deals = $dealsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate stats
        $total_invested = 0;
        $deal_count = count($deals);
        $sectors = [];
        $countries = [];
        $portfolio_companies = [];
        
        foreach ($deals as $deal) {
            $amount = floatval($deal['amount'] ?? 0);
            $total_invested += $amount;
            
            if ($deal['sector'] && !in_array($deal['sector'], $sectors)) {
                $sectors[] = $deal['sector'];
            }
            
            if ($deal['country'] && !in_array($deal['country'], $countries)) {
                $countries[] = $deal['country'];
            }
            
            $companyName = $deal['company_name'] ?? null;
            if ($companyName && !in_array($companyName, $portfolio_companies)) {
                $portfolio_companies[] = $companyName;
            }
        }
        
        $avg_deal_size = $deal_count > 0 ? $total_invested / $deal_count : 0;
        
        // Update investor
        $updateStmt = $pdo->prepare("
            UPDATE investors SET
                total_invested = ?,
                deal_count = ?,
                avg_deal_size = ?,
                focus_sectors = ?,
                geographic_focus = ?,
                portfolio_companies = ?
            WHERE id = ?
        ");
        
        $updateStmt->execute([
            $total_invested,
            $deal_count,
            $avg_deal_size,
            json_encode($sectors),
            json_encode($countries),
            json_encode($portfolio_companies),
            $investor_id
        ]);
        
        echo "  ✓ Total invested: $" . number_format($total_invested, 2) . "\n";
        echo "  ✓ Deal count: $deal_count\n";
        echo "  ✓ Avg deal size: $" . number_format($avg_deal_size, 2) . "\n";
        echo "  ✓ Sectors: " . count($sectors) . " (" . implode(', ', array_slice($sectors, 0, 3)) . (count($sectors) > 3 ? '...' : '') . ")\n";
        echo "  ✓ Geographic focus: " . count($countries) . " countries\n";
        echo "  ✓ Portfolio companies: " . count($portfolio_companies) . "\n";
        
        $enriched++;
    }
    
    echo "\n[5/6] Summary:\n";
    $stats = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(total_invested) as total_invested,
            SUM(deal_count) as total_deals,
            AVG(avg_deal_size) as avg_deal_size
        FROM investors
    ")->fetch(PDO::FETCH_ASSOC);
    
    echo "  Total investors: " . $stats['total'] . "\n";
    echo "  Total invested: $" . number_format($stats['total_invested'] ?? 0, 2) . "\n";
    echo "  Total deals: " . ($stats['total_deals'] ?? 0) . "\n";
    echo "  Average deal size: $" . number_format($stats['avg_deal_size'] ?? 0, 2) . "\n";
    
    echo "\n[6/6] Fixing logo column sync...\n";
    $pdo->exec("UPDATE investors SET logo = logo_url WHERE logo IS NULL AND logo_url IS NOT NULL");
    echo "  ✓ Logo column synced\n";
    
    echo "\n" . str_repeat("=", 70) . "\n";
    echo "INVESTOR ENRICHMENT COMPLETE\n";
    echo "=" . str_repeat("=", 70) . "\n";
    echo "Enriched: $enriched investors\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}
?>

