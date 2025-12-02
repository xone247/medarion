<?php
/**
 * Fix Electrification with Precise Country Matching
 */

$data_file = 'data_master/verified/nation_pulse/master_nation_pulse.json';
$data = json_decode(file_get_contents($data_file), true);

// Precise electrification rates
$electrification = [
    'Algeria' => 99.8,
    'Angola' => 43.0,
    'Benin' => 42.0,
    'Botswana' => 72.0,
    'Burkina Faso' => 21.0,
    'Burundi' => 11.0,
    'Cabo Verde' => 100.0,
    'Cameroon' => 65.0,
    'Central African Republic' => 15.0,
    'Chad' => 11.0,
    'Comoros' => 70.0,
    'Congo' => 50.0,  // Republic of Congo
    'Côte d\'Ivoire' => 71.0,
    'Cote d\'Ivoire' => 71.0,
    'Ivory Coast' => 71.0,
    'Democratic Republic of the Congo' => 19.0,
    'DR Congo' => 19.0,
    'Djibouti' => 42.0,
    'Egypt' => 100.0,
    'Equatorial Guinea' => 67.0,
    'Eritrea' => 52.0,
    'Eswatini' => 83.0,
    'Ethiopia' => 52.0,
    'Gabon' => 92.0,
    'Gambia' => 64.0,
    'Ghana' => 85.0,
    'Guinea' => 35.0,
    'Guinea-Bissau' => 33.0,
    'Kenya' => 75.0,
    'Lesotho' => 47.0,
    'Liberia' => 12.0,
    'Libya' => 100.0,
    'Madagascar' => 35.0,
    'Malawi' => 15.0,
    'Mali' => 51.0,
    'Mauritania' => 48.0,
    'Mauritius' => 100.0,
    'Morocco' => 100.0,
    'Mozambique' => 31.0,
    'Namibia' => 56.0,
    'Niger' => 19.0,
    'Nigeria' => 60.0,
    'Rwanda' => 51.0,
    'São Tomé and Príncipe' => 75.0,
    'Sao Tome and Principe' => 75.0,
    'Senegal' => 70.0,
    'Seychelles' => 100.0,
    'Sierra Leone' => 26.0,
    'Somalia' => 49.0,
    'South Africa' => 85.0,
    'South Sudan' => 7.0,
    'Sudan' => 47.0,
    'Tanzania' => 40.0,
    'Togo' => 53.0,
    'Tunisia' => 100.0,
    'Uganda' => 45.0,
    'Zambia' => 45.0,
    'Zimbabwe' => 52.0,
];

$fixed = 0;
foreach ($data as &$item) {
    $country = trim($item['country'] ?? '');
    $metric = strtolower($item['metric_name'] ?? '');
    
    if (stripos($metric, 'electrification') !== false || stripos($metric, 'electricity') !== false) {
        // Exact match first
        if (isset($electrification[$country])) {
            $correct_value = $electrification[$country];
            $current_value = floatval($item['metric_value'] ?? 0);
            if (abs($current_value - $correct_value) > 0.1) {
                $item['metric_value'] = $correct_value;
                $item['metric_unit'] = 'percentage';
                $fixed++;
                echo "✅ Fixed: $country - {$current_value}% → {$correct_value}%\n";
            }
        } else {
            // Try case-insensitive match
            $matched = false;
            foreach ($electrification as $key => $value) {
                if (strcasecmp($country, $key) === 0) {
                    $current_value = floatval($item['metric_value'] ?? 0);
                    if (abs($current_value - $value) > 0.1) {
                        $item['metric_value'] = $value;
                        $item['metric_unit'] = 'percentage';
                        $fixed++;
                        echo "✅ Fixed: $country - {$current_value}% → {$value}%\n";
                    }
                    $matched = true;
                    break;
                }
            }
            
            // Special cases for partial matches
            if (!$matched) {
                if (stripos($country, 'Congo') !== false && stripos($country, 'Democratic') !== false) {
                    $item['metric_value'] = 19.0;
                    $item['metric_unit'] = 'percentage';
                    $fixed++;
                    echo "✅ Fixed: $country → 19%\n";
                } elseif (stripos($country, 'Congo') !== false && stripos($country, 'Democratic') === false) {
                    $item['metric_value'] = 50.0;
                    $item['metric_unit'] = 'percentage';
                    $fixed++;
                    echo "✅ Fixed: $country → 50%\n";
                }
            }
        }
    }
}
unset($item);

file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo "\n✅ Fixed: $fixed values\n";

