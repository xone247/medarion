<?php
/**
 * VERIFY DEALS DATA QUALITY
 * 
 * This script checks:
 * 1. Which deals have source URLs (verified)
 * 2. Which deals don't have source URLs (need verification)
 * 3. Identifies potentially generic company names
 */

$data_file = 'data_master/verified/deals/master_deals.json';

if (!file_exists($data_file)) {
    echo "❌ File not found: $data_file\n";
    exit(1);
}

echo "======================================================================\n";
echo "VERIFY DEALS DATA QUALITY\n";
echo "======================================================================\n\n";

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    echo "❌ Invalid JSON file or empty data\n";
    exit(1);
}

$with_source = 0;
$without_source = 0;
$generic_names = [];
$deals_without_source = [];

foreach ($data as $deal) {
    $name = $deal['company_name'] ?? 'Unknown';
    
    if (!empty($deal['source_url'])) {
        $with_source++;
    } else {
        $without_source++;
        $deals_without_source[] = [
            'name' => $name,
            'deal_type' => $deal['deal_type'] ?? 'Unknown',
            'amount' => $deal['amount'] ?? 'Unknown',
            'date' => $deal['deal_date'] ?? 'Unknown',
            'country' => $deal['country'] ?? 'Unknown'
        ];
        
        // Check for potentially generic names
        if (preg_match('/Pharma(Direct|Net|Med)|MediHealth|Health(Pro|Ultimate|Express|Advanced)/i', $name)) {
            $generic_names[] = $name;
        }
    }
}

echo "📊 Total deals: " . count($data) . "\n";
echo "✅ Deals with source_url (verified): " . $with_source . "\n";
echo "⚠️  Deals without source_url: " . $without_source . "\n";
echo "🔍 Potentially generic company names: " . count(array_unique($generic_names)) . "\n";

if (count(array_unique($generic_names)) > 0) {
    echo "\n📋 Generic names found:\n";
    foreach (array_unique($generic_names) as $name) {
        echo "   - " . $name . "\n";
    }
}

if ($without_source > 0) {
    echo "\n⚠️  Deals without source URLs (first 10):\n";
    $count = 0;
    foreach ($deals_without_source as $deal) {
        if ($count++ >= 10) break;
        echo "   - " . $deal['name'] . " | " . $deal['deal_type'] . " | $" . number_format($deal['amount']) . " | " . $deal['date'] . " | " . $deal['country'] . "\n";
    }
    if ($without_source > 10) {
        echo "   ... and " . ($without_source - 10) . " more\n";
    }
}

echo "\n✅ Verification complete!\n";
?>

