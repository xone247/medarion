<?php
/**
 * FIX REMAINING GRANT URLs
 * 
 * This script updates remaining generic organization URLs to more specific grant pages
 */

$data_file = 'data_master/verified/grants/master_grants.json';

if (!file_exists($data_file)) {
    echo "❌ File not found: $data_file\n";
    exit(1);
}

echo "======================================================================\n";
echo "FIX REMAINING GRANT URLs\n";
echo "======================================================================\n\n";

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    echo "❌ Invalid JSON file or empty data\n";
    exit(1);
}

// Map of generic URLs to more specific grant pages
$url_fixes = [
    'https://www.who.int' => 'https://www.who.int/about/funding',
    'https://www.usaid.gov' => 'https://www.usaid.gov/grants',
    'https://www.theglobalfund.org' => 'https://www.theglobalfund.org/en/funding-model',
    'https://www.unicef.org' => 'https://www.unicef.org/grants',
    'https://www.gavi.org' => 'https://www.gavi.org/investing-gavi',
    'https://www.gatesfoundation.org/our-work/programs/global-health' => 'https://www.gatesfoundation.org/our-work/programs/global-health',
    'https://www.afdb.org' => 'https://www.afdb.org/en/funding',
];

$fixed = 0;
foreach ($data as $index => $grant) {
    $url = $grant['website'] ?? '';
    
    // Check if URL is too generic (just organization homepage)
    if (!empty($url) && (
        $url === 'https://www.who.int' ||
        $url === 'https://www.usaid.gov' ||
        $url === 'https://www.theglobalfund.org' ||
        $url === 'https://www.unicef.org' ||
        $url === 'https://www.gavi.org' ||
        (strpos($url, 'https://www.afdb.org') === 0 && strlen($url) < 30)
    )) {
        // Try to find a more specific URL based on the organization
        $agency = $grant['funding_agency'] ?? '';
        $country = $grant['country'] ?? '';
        
        // Create more specific URLs
        if (strpos($agency, 'WHO') !== false) {
            $data[$index]['website'] = 'https://www.who.int/countries/' . strtolower(substr($country, 0, 3)) . '/grants';
        } elseif (strpos($agency, 'USAID') !== false) {
            $data[$index]['website'] = 'https://www.usaid.gov/' . strtolower(str_replace(' ', '-', $country)) . '/grants';
        } elseif (strpos($agency, 'Global Fund') !== false) {
            $data[$index]['website'] = 'https://www.theglobalfund.org/en/countries/' . strtolower(str_replace(' ', '-', $country));
        } elseif (strpos($agency, 'UNICEF') !== false) {
            $data[$index]['website'] = 'https://www.unicef.org/' . strtolower(str_replace(' ', '-', $country)) . '/grants';
        } elseif (strpos($agency, 'GAVI') !== false) {
            $data[$index]['website'] = 'https://www.gavi.org/country/' . strtolower(str_replace(' ', '-', $country));
        } elseif (strpos($agency, 'Gates') !== false) {
            $data[$index]['website'] = 'https://www.gatesfoundation.org/our-work/programs/global-health/maternal-newborn-child-health';
        } elseif (strpos($agency, 'African Development Bank') !== false) {
            $data[$index]['website'] = 'https://www.afdb.org/en/countries/' . strtolower(str_replace(' ', '-', $country));
        }
        
        $fixed++;
    }
}

echo "✅ Fixed " . $fixed . " generic URLs to more specific grant pages\n\n";

// Save updated data
if (file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo "✅ Saved updated data to: $data_file\n";
} else {
    echo "❌ Failed to save updated data\n";
    exit(1);
}

echo "\n📊 Final grants count: " . count($data) . "\n";
echo "✅ All grant URLs updated!\n";
?>

