<?php
/**
 * CHECK DEALS URL QUALITY
 * 
 * This script checks the quality of source URLs in deals data
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

$real_urls = 0;
$placeholder_urls = 0;
$no_urls = 0;
$placeholder_deals = [];

foreach ($data as $deal) {
    $url = $deal['source_url'] ?? '';
    $name = $deal['company_name'] ?? 'Unknown';
    
    if (empty($url)) {
        $no_urls++;
    } elseif (strpos($url, 'techcrunch.com/search') !== false || 
              strpos($url, 'google.com/search') !== false ||
              strpos($url, 'search?') !== false) {
        $placeholder_urls++;
        $placeholder_deals[] = [
            'name' => $name,
            'url' => $url,
            'deal_type' => $deal['deal_type'] ?? 'Unknown',
            'date' => $deal['deal_date'] ?? 'Unknown'
        ];
    } else {
        $real_urls++;
    }
}

echo "======================================================================\n";
echo "DEALS URL QUALITY CHECK\n";
echo "======================================================================\n\n";

echo "📊 Total deals: " . count($data) . "\n";
echo "✅ Deals with real source URLs: " . $real_urls . "\n";
echo "⚠️  Deals with placeholder URLs: " . $placeholder_urls . "\n";
echo "❌ Deals with no URLs: " . $no_urls . "\n";

if ($placeholder_urls > 0) {
    echo "\n⚠️  Deals with placeholder URLs (first 10):\n";
    $count = 0;
    foreach ($placeholder_deals as $deal) {
        if ($count++ >= 10) break;
        echo "   - " . $deal['name'] . " | " . $deal['deal_type'] . " | " . $deal['date'] . "\n";
        echo "     URL: " . $deal['url'] . "\n";
    }
    if ($placeholder_urls > 10) {
        echo "   ... and " . ($placeholder_urls - 10) . " more\n";
    }
}

echo "\n✅ Check complete!\n";
?>

