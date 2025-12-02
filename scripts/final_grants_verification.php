<?php
/**
 * FINAL GRANTS VERIFICATION REPORT
 * 
 * This script provides a comprehensive verification report on grants data
 */

// Database configuration
$db_config = [
    'host' => 'localhost',
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => ''
];

$data_file = 'data_master/verified/grants/master_grants.json';

echo "======================================================================\n";
echo "FINAL GRANTS VERIFICATION REPORT\n";
echo "======================================================================\n\n";

// Check database
try {
    $db = new PDO("mysql:host=" . $db_config['host'] . ";dbname=" . $db_config['database'], $db_config['username'], $db_config['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $db->query("SELECT COUNT(*) as total FROM grants");
    $db_total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo "📊 DATABASE STATUS:\n";
    echo "   Total grants in database: " . $db_total . "\n";
    
    // Check for grants with missing URLs
    $stmt = $db->query("SELECT COUNT(*) as count FROM grants WHERE website IS NULL OR website = ''");
    $no_url = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($no_url > 0) {
        echo "   ⚠️  Grants with missing URLs: " . $no_url . "\n";
    } else {
        echo "   ✅ All grants have source URLs\n";
    }
    
    // Sample grants
    echo "\n📊 Sample grants (first 5):\n";
    $stmt = $db->query("SELECT title, funding_agency, amount, country, website FROM grants ORDER BY id LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "   - " . $row['title'] . " | " . $row['funding_agency'] . " | $" . number_format($row['amount']) . " | " . $row['country'] . "\n";
        echo "     URL: " . ($row['website'] ?: 'No URL') . "\n";
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
    echo "   Total grants in file: " . $file_total . "\n";
    
    if ($file_total == $db_total) {
        echo "   ✅ File and database counts match\n";
    } else {
        echo "   ⚠️  File and database counts don't match\n";
    }
    
    // Check URL quality
    $real_urls = 0;
    $placeholder_urls = 0;
    $no_urls = 0;
    
    foreach ($data as $grant) {
        $url = $grant['website'] ?? '';
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
    echo "   ✅ Verified grants (real source URLs): " . $real_urls . "\n";
    echo "   ⚠️  Unverified grants (placeholder URLs): " . $placeholder_urls . "\n";
    echo "   ❌ Unverified grants (no URLs): " . $no_urls . "\n";
    echo "   📈 Verification rate: " . round(($real_urls / $file_total) * 100, 1) . "%\n";
    
    // Funding agencies distribution
    $agencies = [];
    foreach ($data as $grant) {
        $agency = $grant['funding_agency'] ?? 'Unknown';
        $agencies[$agency] = ($agencies[$agency] ?? 0) + 1;
    }
    arsort($agencies);
    
    echo "\n📊 TOP 10 FUNDING AGENCIES:\n";
    $count = 0;
    foreach ($agencies as $agency => $num) {
        if ($count++ >= 10) break;
        echo "   - " . $agency . ": " . $num . " grants\n";
    }
    
} else {
    echo "\n❌ Source file not found: $data_file\n";
}

echo "\n✅ Verification complete!\n";
?>

