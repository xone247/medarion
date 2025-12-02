<?php
/**
 * IDENTIFY UNVERIFIED GRANTS
 * 
 * This script lists all grants that need verification
 */

$data_file = 'data_master/verified/grants/master_grants.json';

if (!file_exists($data_file)) {
    echo "❌ File not found: $data_file\n";
    exit(1);
}

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    echo "❌ Invalid JSON file or empty data\n";
    exit(1);
}

$unverified_grants = [];
$verified_grants = [];

foreach ($data as $grant) {
    $url = $grant['website'] ?? $grant['source_url'] ?? '';
    $is_placeholder = !empty($url) && (
        strpos($url, 'techcrunch.com/search') !== false || 
        strpos($url, 'google.com/search') !== false ||
        strpos($url, 'search?') !== false ||
        // Generic organization domains without specific grant pages
        in_array($url, [
            'https://who.org',
            'https://usaid.org',
            'https://global.org',
            'https://unicef.org',
            'https://gavi.org',
            'https://bill&melindagates.org',
            'https://africandevelopmentbank.org'
        ]) ||
        // Very short URLs that are likely generic
        (strpos($url, 'http') === 0 && strlen($url) < 25 && strpos($url, '/') === strrpos($url, '/'))
    );
    
    if (empty($url) || $is_placeholder) {
        $unverified_grants[] = $grant;
    } else {
        $verified_grants[] = $grant;
    }
}

echo "======================================================================\n";
echo "UNVERIFIED GRANTS IDENTIFICATION\n";
echo "======================================================================\n\n";

echo "📊 Total grants: " . count($data) . "\n";
echo "✅ Verified grants: " . count($verified_grants) . "\n";
echo "⚠️  Unverified grants to replace: " . count($unverified_grants) . "\n\n";

// Group by country and funding agency
$by_country_agency = [];
foreach ($unverified_grants as $grant) {
    $country = $grant['country'] ?? 'Unknown';
    $agency = $grant['funding_agency'] ?? 'Unknown';
    $key = $country . '|' . $agency;
    if (!isset($by_country_agency[$key])) {
        $by_country_agency[$key] = [];
    }
    $by_country_agency[$key][] = $grant;
}

echo "📋 UNVERIFIED GRANTS BY COUNTRY AND AGENCY:\n";
echo "======================================================================\n";
foreach ($by_country_agency as $key => $grants) {
    list($country, $agency) = explode('|', $key);
    echo "$country - $agency: " . count($grants) . " grants\n";
}

// Save unverified grants to a separate file for reference
file_put_contents('data_master/verified/grants/unverified_grants_backup.json', json_encode($unverified_grants, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "\n✅ Unverified grants saved to: data_master/verified/grants/unverified_grants_backup.json\n";
?>

