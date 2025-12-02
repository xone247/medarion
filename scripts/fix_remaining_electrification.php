<?php
/**
 * Fix Remaining Incorrect Electrification Values
 */

$data_file = 'data_master/verified/nation_pulse/master_nation_pulse.json';
$data = json_decode(file_get_contents($data_file), true);

$fixes = [
    'DR Congo' => 19.0,
    'Democratic Republic of the Congo' => 19.0,
    'Guinea' => 35.0,
    'Nigeria' => 60.0,
    'Somalia' => 49.0,
    'Sudan' => 47.0,
];

$fixed = 0;
foreach ($data as &$item) {
    $country = $item['country'] ?? '';
    $metric = strtolower($item['metric_name'] ?? '');
    
    if (stripos($metric, 'electrification') !== false || stripos($metric, 'electricity') !== false) {
        foreach ($fixes as $country_key => $correct_value) {
            if (strcasecmp($country, $country_key) === 0 || 
                stripos($country, $country_key) !== false ||
                stripos($country_key, $country) !== false) {
                $current = floatval($item['metric_value'] ?? 0);
                if (abs($current - $correct_value) > 0.1) {
                    $item['metric_value'] = $correct_value;
                    $item['metric_unit'] = 'percentage';
                    $fixed++;
                    echo "✅ Fixed: $country - {$current}% → {$correct_value}%\n";
                }
                break;
            }
        }
    }
}
unset($item);

file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo "\n✅ Fixed: $fixed values\n";

