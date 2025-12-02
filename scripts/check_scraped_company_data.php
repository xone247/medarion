<?php
/**
 * Check for Scraped Company Data in Database
 * Look for companies with source_url, scraped_at, or other scraped indicators
 */

$db_config = [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4'
];

try {
    $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['database']};charset={$db_config['charset']}";
    $db = new PDO($dsn, $db_config['username'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "=" . str_repeat("=", 69) . "\n";
    echo "CHECKING FOR SCRAPED COMPANY DATA\n";
    echo "=" . str_repeat("=", 69) . "\n\n";
    
    // Check if companies table has source_url or scraped_at columns
    $columns_stmt = $db->query("SHOW COLUMNS FROM companies");
    $columns = $columns_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "📋 Company table columns:\n";
    foreach ($columns as $col) {
        echo "   - $col\n";
    }
    echo "\n";
    
    // Check total companies
    $count_stmt = $db->query("SELECT COUNT(*) as count FROM companies");
    $total = $count_stmt->fetch()['count'];
    echo "📊 Total companies in database: $total\n\n";
    
    // Check for duplicates by name
    echo "🔍 Checking for duplicate company names...\n";
    $duplicates_stmt = $db->query("
        SELECT name, COUNT(*) as count 
        FROM companies 
        GROUP BY name 
        HAVING count > 1
        ORDER BY count DESC
    ");
    $duplicates = $duplicates_stmt->fetchAll();
    
    if (count($duplicates) > 0) {
        echo "⚠️  Found " . count($duplicates) . " duplicate company names:\n";
        foreach ($duplicates as $dup) {
            echo "   - {$dup['name']}: {$dup['count']} entries\n";
        }
    } else {
        echo "✅ No duplicate company names found\n";
    }
    echo "\n";
    
    // Check companies with website
    $website_stmt = $db->query("SELECT COUNT(*) as count FROM companies WHERE website IS NOT NULL AND website != ''");
    $with_website = $website_stmt->fetch()['count'];
    echo "📊 Companies with website: $with_website / $total\n";
    
    // Check companies with funding data
    $funding_stmt = $db->query("SELECT COUNT(*) as count FROM companies WHERE total_funding IS NOT NULL AND total_funding > 0");
    $with_funding = $funding_stmt->fetch()['count'];
    echo "📊 Companies with funding data: $with_funding / $total\n";
    
    // Check companies with investors
    $investors_stmt = $db->query("SELECT COUNT(*) as count FROM companies WHERE investors IS NOT NULL AND investors != '[]' AND investors != ''");
    $with_investors = $investors_stmt->fetch()['count'];
    echo "📊 Companies with investors: $with_investors / $total\n";
    
    // Sample companies to check data quality
    echo "\n📋 Sample companies (first 5):\n";
    $sample_stmt = $db->query("SELECT id, name, website, total_funding, investors, products, markets FROM companies LIMIT 5");
    $samples = $sample_stmt->fetchAll();
    
    foreach ($samples as $sample) {
        echo "\n   Company: {$sample['name']}\n";
        echo "   - Website: " . ($sample['website'] ?: 'N/A') . "\n";
        echo "   - Funding: " . ($sample['total_funding'] ?: 'N/A') . "\n";
        echo "   - Investors: " . ($sample['investors'] ?: 'N/A') . "\n";
        echo "   - Products: " . ($sample['products'] ?: 'N/A') . "\n";
    }
    
    echo "\n";
    echo "=" . str_repeat("=", 69) . "\n";
    
} catch(PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}

