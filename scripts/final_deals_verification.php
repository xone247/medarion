<?php
/**
 * FINAL DEALS VERIFICATION
 * 
 * This script provides a final verification report on deals data
 */

// Database configuration
$db_config = [
    'host' => 'localhost',
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => ''
];

$data_file = 'data_master/verified/deals/master_deals.json';

echo "======================================================================\n";
echo "FINAL DEALS VERIFICATION REPORT\n";
echo "======================================================================\n\n";

// Check database
try {
    $db = new PDO("mysql:host=" . $db_config['host'] . ";dbname=" . $db_config['database'], $db_config['username'], $db_config['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $db->query("SELECT COUNT(*) as total FROM deals");
    $db_total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo "📊 DATABASE STATUS:\n";
    echo "   Total deals in database: " . $db_total . "\n";
    
    // Check for duplicates
    $dupStmt = $db->query("
        SELECT company_name, deal_type, deal_date, amount, COUNT(*) as count
        FROM deals 
        GROUP BY company_name, deal_type, deal_date, amount 
        HAVING count > 1
    ");
    $duplicates = $dupStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($duplicates) > 0) {
        echo "   ⚠️  Duplicates found: " . count($duplicates) . "\n";
    } else {
        echo "   ✅ No duplicates found\n";
    }
    
} catch (PDOException $e) {
    echo "   ❌ Database error: " . $e->getMessage() . "\n";
    $db_total = 0;
}

// Check JSON file
if (file_exists($data_file)) {
    $data = json_decode(file_get_contents($data_file), true);
    $file_total = is_array($data) ? count($data) : 0;
    
    echo "\n📊 SOURCE FILE STATUS:\n";
    echo "   Total deals in file: " . $file_total . "\n";
    
    if ($file_total == $db_total) {
        echo "   ✅ File and database counts match\n";
    } else {
        echo "   ⚠️  File and database counts don't match\n";
    }
    
    // Check URL quality
    $real_urls = 0;
    $placeholder_urls = 0;
    $no_urls = 0;
    
    foreach ($data as $deal) {
        $url = $deal['source_url'] ?? '';
        if (empty($url)) {
            $no_urls++;
        } elseif (strpos($url, 'techcrunch.com/search') !== false || 
                  strpos($url, 'google.com/search') !== false ||
                  strpos($url, 'search?') !== false) {
            $placeholder_urls++;
        } else {
            $real_urls++;
        }
    }
    
    echo "\n📊 DATA QUALITY:\n";
    echo "   ✅ Verified deals (real source URLs): " . $real_urls . "\n";
    echo "   ⚠️  Unverified deals (placeholder URLs): " . $placeholder_urls . "\n";
    echo "   ❌ Unverified deals (no URLs): " . $no_urls . "\n";
    echo "   📈 Verification rate: " . round(($real_urls / $file_total) * 100, 1) . "%\n";
    
} else {
    echo "\n❌ Source file not found: $data_file\n";
}

echo "\n✅ Verification complete!\n";
?>

