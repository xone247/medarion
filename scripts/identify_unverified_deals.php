<?php
/**
 * IDENTIFY UNVERIFIED DEALS
 * 
 * This script lists all unverified deals that need to be replaced
 */

$data_file = 'data_master/verified/deals/master_deals.json';

if (!file_exists($data_file)) {
    echo "❌ File not found: $data_file\n";
    exit(1);
}

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    echo "❌ Invalid JSON file or empty data\n";
    exit(1);
}

$unverified_deals = [];
$verified_deals = [];

foreach ($data as $deal) {
    $url = $deal['source_url'] ?? '';
    $is_placeholder = !empty($url) && (
        strpos($url, 'techcrunch.com/search') !== false || 
        strpos($url, 'google.com/search') !== false ||
        strpos($url, 'search?') !== false
    );
    
    if (empty($url) || $is_placeholder) {
        $unverified_deals[] = $deal;
    } else {
        $verified_deals[] = $deal;
    }
}

echo "======================================================================\n";
echo "UNVERIFIED DEALS IDENTIFICATION\n";
echo "======================================================================\n\n";

echo "📊 Total deals: " . count($data) . "\n";
echo "✅ Verified deals: " . count($verified_deals) . "\n";
echo "⚠️  Unverified deals to replace: " . count($unverified_deals) . "\n\n";

echo "📋 UNVERIFIED DEALS LIST:\n";
echo "======================================================================\n";
foreach ($unverified_deals as $index => $deal) {
    $url = $deal['source_url'] ?? '';
    $url_type = empty($url) ? 'NO URL' : 'PLACEHOLDER URL';
    echo ($index + 1) . ". " . ($deal['company_name'] ?? 'Unknown') . "\n";
    echo "   Type: " . ($deal['deal_type'] ?? 'Unknown') . "\n";
    echo "   Amount: $" . number_format($deal['amount'] ?? 0) . "\n";
    echo "   Date: " . ($deal['deal_date'] ?? 'Unknown') . "\n";
    echo "   Country: " . ($deal['country'] ?? 'Unknown') . "\n";
    echo "   Status: " . $url_type . "\n";
    if (!empty($url)) {
        echo "   URL: " . $url . "\n";
    }
    echo "\n";
}

// Save unverified deals to a separate file for reference
file_put_contents('data_master/verified/deals/unverified_deals_backup.json', json_encode($unverified_deals, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "✅ Unverified deals saved to: data_master/verified/deals/unverified_deals_backup.json\n";
?>

