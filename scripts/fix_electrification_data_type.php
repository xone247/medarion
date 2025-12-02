<?php
/**
 * Fix electrification data_type to 'electrification' instead of 'health_infrastructure'
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "FIX ELECTRIFICATION DATA TYPE\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$data_file = 'data_master/verified/nation_pulse/master_nation_pulse.json';

if (!file_exists($data_file)) {
    die("❌ File not found: $data_file\n");
}

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    die("❌ Invalid JSON data\n");
}

echo "📊 Loaded " . count($data) . " records\n\n";

$fixed = 0;
foreach ($data as &$item) {
    if (isset($item['metric_name']) && 
        (strpos(strtolower($item['metric_name']), 'electrification') !== false ||
         strpos(strtolower($item['metric_name']), 'electricity') !== false)) {
        if ($item['data_type'] !== 'electrification') {
            $old_type = $item['data_type'];
            $item['data_type'] = 'electrification';
            $fixed++;
            if ($fixed <= 5) {
                echo "✅ Fixed: {$item['country']} - {$item['metric_name']} ({$old_type} → electrification)\n";
            }
        }
    }
}

echo "\n📊 Total fixed: $fixed records\n\n";

// Save updated data
file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "✅ Saved updated data to: $data_file\n\n";

// Verify
$electrification_count = 0;
foreach ($data as $item) {
    if (isset($item['data_type']) && $item['data_type'] === 'electrification') {
        $electrification_count++;
    }
}

echo "📊 Verification:\n";
echo "   - Records with data_type='electrification': $electrification_count\n\n";

