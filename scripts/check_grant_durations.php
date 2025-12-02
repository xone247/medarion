<?php
/**
 * CHECK CURRENT GRANT DURATIONS
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

echo "======================================================================\n";
echo "CHECK CURRENT GRANT DURATIONS\n";
echo "======================================================================\n\n";

$durations = [];
$null_durations = 0;

foreach ($data as $grant) {
    $duration = $grant['duration'] ?? $grant['duration_months'] ?? null;
    if ($duration === null || $duration === '') {
        $null_durations++;
    } else {
        $durations[$duration] = ($durations[$duration] ?? 0) + 1;
    }
}

echo "📊 Total grants: " . count($data) . "\n";
echo "❌ Grants with null/empty duration: " . $null_durations . "\n";
echo "✅ Grants with duration set: " . (count($data) - $null_durations) . "\n\n";

if (count($durations) > 0) {
    echo "📊 Current duration distribution:\n";
    foreach ($durations as $d => $c) {
        echo "   - " . $d . ": " . $c . " grants\n";
    }
}

echo "\n✅ Check complete!\n";
?>

