<?php
/**
 * VERIFY GRANTS IN DATABASE
 * 
 * This script verifies that all verified grants are in the database
 * and checks for any old/unverified grants
 */

// Database configuration
$db_config = [
    'host' => 'localhost',
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => ''
];

echo "======================================================================\n";
echo "VERIFY GRANTS IN DATABASE\n";
echo "======================================================================\n\n";

try {
    $db = new PDO("mysql:host=" . $db_config['host'] . ";dbname=" . $db_config['database'], $db_config['username'], $db_config['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Total count
    $stmt = $db->query("SELECT COUNT(*) as total FROM grants");
    $total = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "📊 Total grants in database: " . $total['total'] . "\n\n";
    
    // Check for grants with missing or placeholder URLs
    echo "======================================================================\n";
    echo "CHECKING URL QUALITY\n";
    echo "======================================================================\n\n";
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM grants WHERE website IS NULL OR website = ''");
    $no_url = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($no_url > 0) {
        echo "❌ Grants with missing URLs: " . $no_url . "\n";
    } else {
        echo "✅ All grants have URLs\n";
    }
    
    // Check for placeholder URLs
    $stmt = $db->query("SELECT COUNT(*) as count FROM grants WHERE website LIKE '%techcrunch.com/search%' OR website LIKE '%google.com/search%' OR website LIKE '%search?%'");
    $placeholder_urls = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($placeholder_urls > 0) {
        echo "⚠️  Grants with placeholder URLs: " . $placeholder_urls . "\n";
    } else {
        echo "✅ No placeholder URLs found\n";
    }
    
    // Check for old generic URLs
    $stmt = $db->query("SELECT COUNT(*) as count FROM grants WHERE website IN ('https://who.org', 'https://usaid.org', 'https://global.org', 'https://unicef.org', 'https://gavi.org', 'https://bill&melindagates.org', 'https://africandevelopmentbank.org')");
    $generic_urls = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($generic_urls > 0) {
        echo "⚠️  Grants with generic URLs: " . $generic_urls . "\n";
    } else {
        echo "✅ No generic placeholder URLs found\n";
    }
    
    // Sample grants
    echo "\n======================================================================\n";
    echo "SAMPLE VERIFIED GRANTS (first 10)\n";
    echo "======================================================================\n\n";
    
    $stmt = $db->query("SELECT title, funding_agency, amount, country, website FROM grants ORDER BY id LIMIT 10");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "   - " . $row['title'] . "\n";
        echo "     Agency: " . $row['funding_agency'] . "\n";
        echo "     Amount: $" . number_format($row['amount']) . "\n";
        echo "     Country: " . $row['country'] . "\n";
        echo "     URL: " . ($row['website'] ?: 'No URL') . "\n\n";
    }
    
    // Funding agencies distribution
    echo "======================================================================\n";
    echo "FUNDING AGENCIES DISTRIBUTION\n";
    echo "======================================================================\n\n";
    
    $stmt = $db->query("SELECT funding_agency, COUNT(*) as count FROM grants GROUP BY funding_agency ORDER BY count DESC LIMIT 10");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "   - " . $row['funding_agency'] . ": " . $row['count'] . " grants\n";
    }
    
    echo "\n✅ Verification complete!\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?>

