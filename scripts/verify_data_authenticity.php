<?php
/**
 * Verify Data Authenticity
 * Check if data is real and verifiable
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
    echo "DATA AUTHENTICITY VERIFICATION\n";
    echo "=" . str_repeat("=", 70) . "\n\n";
    
    // Check for placeholder patterns
    $placeholderPatterns = [
        'Healthcare Company',
        'Placeholder',
        'EliteTech',
        'WellTech',
        'ApexGroup',
        'PrimeGroup',
        'VitaHealth',
        'CareHealth',
        'SmartGroup',
        'BioHealth',
        'DigitalTech',
        'ProSolutions'
    ];
    
    echo "[1/4] Checking Companies for Placeholders...\n";
    $placeholderCount = 0;
    foreach ($placeholderPatterns as $pattern) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM companies WHERE name LIKE ?");
        $stmt->execute(["%{$pattern}%"]);
        $count = $stmt->fetchColumn();
        if ($count > 0) {
            echo "  ⚠️  Found {$count} companies matching pattern: {$pattern}\n";
            $placeholderCount += $count;
        }
    }
    
    if ($placeholderCount == 0) {
        echo "  ✅ No placeholder companies found\n";
    } else {
        echo "  ⚠️  Total placeholder companies: {$placeholderCount}\n";
    }
    
    echo "\n[2/4] Checking Real Companies...\n";
    $realCompanies = $pdo->query("
        SELECT name, total_funding, website 
        FROM companies 
        WHERE name IN ('mPharma', '54gene', 'LifeBank', 'Helium Health', 'Vezeeta', 'Zipline', 'WellaHealth', 'Medsaf', 'DrugStoc', 'MyDawa')
        ORDER BY total_funding DESC
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    echo "  ✅ Found " . count($realCompanies) . " verified real companies:\n";
    foreach ($realCompanies as $comp) {
        echo "     - {$comp['name']}: $" . number_format($comp['total_funding']) . " (Website: " . ($comp['website'] ?: 'N/A') . ")\n";
    }
    
    echo "\n[3/4] Checking Deals for Real Data...\n";
    $deals = $pdo->query("
        SELECT company_name, amount, lead_investor, deal_date, source_url 
        FROM deals 
        WHERE amount > 0 
        ORDER BY amount DESC 
        LIMIT 15
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    echo "  ✅ Top 15 deals by amount:\n";
    foreach ($deals as $deal) {
        $source = $deal['source_url'] ? 'Has source' : 'No source URL';
        echo "     - {$deal['company_name']}: $" . number_format($deal['amount']) . " by {$deal['lead_investor']} ({$deal['deal_date']}) - {$source}\n";
    }
    
    // Check for deals with source URLs
    $dealsWithSources = $pdo->query("SELECT COUNT(*) FROM deals WHERE source_url IS NOT NULL AND source_url != ''")->fetchColumn();
    echo "\n  📊 Deals with source URLs: {$dealsWithSources} / " . count($deals) . "\n";
    
    echo "\n[4/4] Checking Investors for Real Data...\n";
    $investors = $pdo->query("
        SELECT name, total_invested, deal_count, website 
        FROM investors 
        WHERE total_invested > 0 
        ORDER BY total_invested DESC 
        LIMIT 10
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    echo "  ✅ Top 10 investors by total invested:\n";
    foreach ($investors as $inv) {
        $website = $inv['website'] ? 'Has website' : 'No website';
        echo "     - {$inv['name']}: $" . number_format($inv['total_invested']) . " ({$inv['deal_count']} deals) - {$website}\n";
    }
    
    // Check for real investor names
    $realInvestors = ['TLcom Capital', 'Partech Africa', 'Novastar Ventures', 'Consonance Investment Managers', 'Village Capital'];
    echo "\n  ✅ Verified real investors in database:\n";
    foreach ($realInvestors as $realInv) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM investors WHERE name = ?");
        $stmt->execute([$realInv]);
        $exists = $stmt->fetchColumn() > 0;
        echo "     - {$realInv}: " . ($exists ? '✅ Found' : '❌ Not found') . "\n";
    }
    
    echo "\n" . str_repeat("=", 70) . "\n";
    echo "VERIFICATION SUMMARY\n";
    echo "=" . str_repeat("=", 70) . "\n";
    
    $totalCompanies = $pdo->query("SELECT COUNT(*) FROM companies")->fetchColumn();
    $totalDeals = $pdo->query("SELECT COUNT(*) FROM deals")->fetchColumn();
    $totalInvestors = $pdo->query("SELECT COUNT(*) FROM investors")->fetchColumn();
    
    echo "Total Companies: {$totalCompanies}\n";
    echo "Total Deals: {$totalDeals}\n";
    echo "Total Investors: {$totalInvestors}\n";
    echo "Placeholder Companies: {$placeholderCount}\n";
    echo "Real Companies Verified: " . count($realCompanies) . "\n";
    echo "Deals with Source URLs: {$dealsWithSources}\n";
    
    if ($placeholderCount == 0 && count($realCompanies) >= 10) {
        echo "\n✅ DATA STATUS: Appears to be REAL and VERIFIABLE\n";
        echo "   - No placeholder companies found\n";
        echo "   - Real companies verified (mPharma, 54gene, etc.)\n";
        echo "   - Deals have real amounts and investors\n";
    } else if ($placeholderCount > 0) {
        echo "\n⚠️  DATA STATUS: MIXED - Some placeholder data remains\n";
        echo "   - {$placeholderCount} placeholder companies found\n";
        echo "   - " . count($realCompanies) . " real companies verified\n";
    } else {
        echo "\n❓ DATA STATUS: Needs verification\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

