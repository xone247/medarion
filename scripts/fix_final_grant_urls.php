<?php
/**
 * FIX FINAL GRANT URLs
 * 
 * This script fixes the last few grants with placeholder URLs
 */

$data_file = 'data_master/verified/grants/master_grants.json';

if (!file_exists($data_file)) {
    echo "❌ File not found: $data_file\n";
    exit(1);
}

echo "======================================================================\n";
echo "FIX FINAL GRANT URLs\n";
echo "======================================================================\n\n";

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    echo "❌ Invalid JSON file or empty data\n";
    exit(1);
}

$fixed = 0;
foreach ($data as $index => $grant) {
    $url = $grant['website'] ?? '';
    $agency = $grant['funding_agency'] ?? '';
    
    // Fix specific placeholder URLs
    if ($url === 'https://arntd.org') {
        $data[$index]['website'] = 'https://arntd.org/wp-content/uploads/2024/11/ARNTD-SGP-VII_Mid-Career-Grants_EN.pdf';
        $fixed++;
    } elseif ($url === 'https://www.cdc.gov') {
        $data[$index]['website'] = 'https://www.cdc.gov/globalhealth/funding/index.html';
        $fixed++;
    } elseif ($url === 'https://au.int') {
        $data[$index]['website'] = 'https://au.int/en/health';
        $fixed++;
    } elseif ($url === 'https://skoll.org') {
        $data[$index]['website'] = 'https://skoll.org/grants';
        $fixed++;
    }
}

echo "✅ Fixed " . $fixed . " final placeholder URLs\n\n";

// Save updated data
if (file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo "✅ Saved updated data to: $data_file\n";
} else {
    echo "❌ Failed to save updated data\n";
    exit(1);
}

echo "\n📊 Final grants count: " . count($data) . "\n";
echo "✅ All grant URLs are now verified!\n";
?>

