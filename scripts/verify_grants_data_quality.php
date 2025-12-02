<?php
/**
 * VERIFY GRANTS DATA QUALITY
 * 
 * This script checks:
 * 1. Which grants have source URLs (verified)
 * 2. Which grants don't have source URLs (need verification)
 * 3. Identifies potentially generic or placeholder data
 */

$data_file = 'data_master/verified/grants/master_grants.json';

if (!file_exists($data_file)) {
    echo "❌ File not found: $data_file\n";
    exit(1);
}

echo "======================================================================\n";
echo "VERIFY GRANTS DATA QUALITY\n";
echo "======================================================================\n\n";

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    echo "❌ Invalid JSON file or empty data\n";
    exit(1);
}

$with_source = 0;
$without_source = 0;
$placeholder_urls = 0;
$grants_without_source = [];
$grants_with_placeholder = [];

foreach ($data as $grant) {
    $url = $grant['website'] ?? $grant['source_url'] ?? '';
    $is_placeholder = !empty($url) && (
        strpos($url, 'techcrunch.com/search') !== false || 
        strpos($url, 'google.com/search') !== false ||
        strpos($url, 'search?') !== false ||
        strpos($url, '&') === false && strpos($url, 'http') === 0 && strlen($url) < 20 // Suspiciously short URLs
    );
    
    if (empty($url)) {
        $without_source++;
        $grants_without_source[] = [
            'title' => $grant['title'] ?? 'Unknown',
            'funding_agency' => $grant['funding_agency'] ?? 'Unknown',
            'amount' => $grant['amount'] ?? 'Unknown',
            'country' => $grant['country'] ?? 'Unknown',
            'grant_type' => $grant['grant_type'] ?? 'Unknown'
        ];
    } elseif ($is_placeholder) {
        $placeholder_urls++;
        $grants_with_placeholder[] = [
            'title' => $grant['title'] ?? 'Unknown',
            'funding_agency' => $grant['funding_agency'] ?? 'Unknown',
            'url' => $url,
            'amount' => $grant['amount'] ?? 'Unknown',
            'country' => $grant['country'] ?? 'Unknown'
        ];
    } else {
        $with_source++;
    }
}

echo "📊 Total grants: " . count($data) . "\n";
echo "✅ Grants with real source URLs: " . $with_source . "\n";
echo "⚠️  Grants with placeholder URLs: " . $placeholder_urls . "\n";
echo "❌ Grants with no URLs: " . $without_source . "\n";
echo "📈 Verification rate: " . round(($with_source / count($data)) * 100, 1) . "%\n\n";

if ($placeholder_urls > 0) {
    echo "⚠️  Grants with placeholder URLs (first 10):\n";
    $count = 0;
    foreach ($grants_with_placeholder as $grant) {
        if ($count++ >= 10) break;
        echo "   - " . $grant['title'] . " | " . $grant['funding_agency'] . " | " . $grant['url'] . "\n";
    }
    if ($placeholder_urls > 10) {
        echo "   ... and " . ($placeholder_urls - 10) . " more\n";
    }
    echo "\n";
}

if ($without_source > 0) {
    echo "❌ Grants without source URLs (first 10):\n";
    $count = 0;
    foreach ($grants_without_source as $grant) {
        if ($count++ >= 10) break;
        echo "   - " . $grant['title'] . " | " . $grant['funding_agency'] . " | $" . number_format($grant['amount']) . " | " . $grant['country'] . "\n";
    }
    if ($without_source > 10) {
        echo "   ... and " . ($without_source - 10) . " more\n";
    }
}

echo "\n✅ Verification complete!\n";
?>

