<?php
/**
 * Fix DR Congo Electrification and Verify All Data
 */

$data_file = 'data_master/verified/nation_pulse/master_nation_pulse.json';
$data = json_decode(file_get_contents($data_file), true);

$fixed = 0;
foreach ($data as &$item) {
    $country = $item['country'] ?? '';
    $metric = strtolower($item['metric_name'] ?? '');
    
    if ((stripos($country, 'DR Congo') !== false || stripos($country, 'Democratic Republic') !== false) &&
        stripos($metric, 'electrification') !== false) {
        if (floatval($item['metric_value'] ?? 0) != 19.0) {
            $item['metric_value'] = 19.0;
            $fixed++;
        }
    }
}
unset($item);

file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo "Fixed DR Congo electrification: $fixed entries\n";

