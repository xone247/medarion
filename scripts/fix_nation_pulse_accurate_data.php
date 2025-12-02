<?php
/**
 * Fix Nation Pulse Data with Accurate, Factual Information
 * Replace incorrect life expectancy and other health metrics with real data
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "FIX NATION PULSE DATA - ACCURATE FACTUAL DATA\n";
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

// Accurate Life Expectancy Data for African Countries (2024 estimates)
// Source: World Bank, WHO, UN estimates
$accurate_life_expectancy = [
    'Algeria' => 77.0,
    'Angola' => 62.0,
    'Benin' => 61.5,
    'Botswana' => 69.0,
    'Burkina Faso' => 59.0,
    'Burundi' => 61.0,
    'Cabo Verde' => 73.0,
    'Cameroon' => 60.0,
    'Central African Republic' => 54.0,
    'Chad' => 54.0,
    'Comoros' => 64.0,
    'Congo' => 64.0,
    'Côte d\'Ivoire' => 58.0,
    'Ivory Coast' => 58.0,
    'Democratic Republic of the Congo' => 60.0,
    'Djibouti' => 67.0,
    'Egypt' => 72.0,
    'Equatorial Guinea' => 58.0,
    'Eritrea' => 66.0,
    'Eswatini' => 60.0,
    'Ethiopia' => 66.0,
    'Gabon' => 66.0,
    'Gambia' => 62.0,
    'Ghana' => 64.0,
    'Guinea' => 59.0,
    'Guinea-Bissau' => 58.0,
    'Kenya' => 67.0,
    'Lesotho' => 55.0,
    'Liberia' => 64.0,
    'Libya' => 73.0,
    'Madagascar' => 67.0,
    'Malawi' => 65.0,
    'Mali' => 59.0,
    'Mauritania' => 65.0,
    'Mauritius' => 75.0,
    'Morocco' => 74.0,
    'Mozambique' => 61.0,
    'Namibia' => 65.0,
    'Niger' => 62.0,
    'Nigeria' => 55.0,
    'Rwanda' => 69.0,
    'São Tomé and Príncipe' => 70.0,
    'Senegal' => 68.0,
    'Seychelles' => 73.0,
    'Sierra Leone' => 55.0,
    'Somalia' => 57.0,
    'South Africa' => 65.0,
    'South Sudan' => 58.0,
    'Sudan' => 65.0,
    'Tanzania' => 66.0,
    'Togo' => 61.0,
    'Tunisia' => 76.0,
    'Uganda' => 63.0,
    'Zambia' => 64.0,
    'Zimbabwe' => 61.0
];

// Fix life expectancy data
echo "=" . str_repeat("=", 69) . "\n";
echo "FIXING LIFE EXPECTANCY DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$fixed_count = 0;
$not_found_count = 0;
$not_found_countries = [];

foreach ($data as &$item) {
    $metric_name = strtolower($item['metric_name'] ?? '');
    
    // Check if this is a life expectancy entry
    if (stripos($metric_name, 'life') !== false && stripos($metric_name, 'expectancy') !== false) {
        $country = $item['country'] ?? '';
        $current_value = floatval($item['metric_value'] ?? 0);
        
        // Check if value is unrealistic (outside 30-100 range)
        if ($current_value < 30 || $current_value > 100) {
            // Try to find accurate value
            $accurate_value = null;
            
            // Try exact match first
            if (isset($accurate_life_expectancy[$country])) {
                $accurate_value = $accurate_life_expectancy[$country];
            } else {
                // Try case-insensitive match
                foreach ($accurate_life_expectancy as $key => $value) {
                    if (strcasecmp($country, $key) === 0) {
                        $accurate_value = $value;
                        break;
                    }
                }
            }
            
            if ($accurate_value !== null) {
                $item['metric_value'] = $accurate_value;
                $item['metric_unit'] = 'years';
                $fixed_count++;
                echo "✅ Fixed: $country - Changed from $current_value to $accurate_value years\n";
            } else {
                $not_found_count++;
                if (!in_array($country, $not_found_countries)) {
                    $not_found_countries[] = $country;
                }
                echo "⚠️  No accurate data found for: $country (current: $current_value)\n";
            }
        }
    }
}
unset($item);

echo "\n";
echo "✅ Fixed: $fixed_count life expectancy values\n";
if ($not_found_count > 0) {
    echo "⚠️  Countries without accurate data: " . implode(', ', $not_found_countries) . "\n";
}
echo "\n";

// Check and fix other potentially incorrect metrics
echo "=" . str_repeat("=", 69) . "\n";
echo "CHECKING OTHER METRICS FOR ACCURACY\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$suspicious_metrics = [];

foreach ($data as $item) {
    $metric_name = strtolower($item['metric_name'] ?? '');
    $value = floatval($item['metric_value'] ?? 0);
    $country = $item['country'] ?? '';
    
    // Check for suspicious values based on metric type
    $suspicious = false;
    $reason = '';
    
    if (stripos($metric_name, 'mortality') !== false) {
        // Mortality rates should typically be per 1000 or per 100,000
        // Under-5 mortality: 10-200 per 1000
        // Maternal mortality: 10-1000 per 100,000
        if (stripos($metric_name, 'under_five') !== false || stripos($metric_name, 'neonatal') !== false) {
            if ($value > 500) {
                $suspicious = true;
                $reason = "Under-5/Neonatal mortality seems too high";
            }
        } elseif (stripos($metric_name, 'maternal') !== false) {
            if ($value > 2000) {
                $suspicious = true;
                $reason = "Maternal mortality seems too high";
            }
        }
    } elseif (stripos($metric_name, 'population') !== false && stripos($metric_name, 'growth') !== false) {
        // Population growth rate should be -5% to +5%
        if (abs($value) > 10) {
            $suspicious = true;
            $reason = "Population growth rate seems unrealistic";
        }
    } elseif (stripos($metric_name, 'gdp') !== false && stripos($metric_name, 'growth') !== false) {
        // GDP growth rate should be -20% to +20%
        if (abs($value) > 30) {
            $suspicious = true;
            $reason = "GDP growth rate seems unrealistic";
        }
    } elseif (stripos($metric_name, 'inflation') !== false) {
        // Inflation rate should be -10% to +100%
        if ($value < -10 || $value > 200) {
            $suspicious = true;
            $reason = "Inflation rate seems unrealistic";
        }
    } elseif (stripos($metric_name, 'coverage') !== false || stripos($metric_name, 'prevalence') !== false) {
        // Coverage and prevalence should be 0-100%
        if ($value < 0 || $value > 100) {
            $suspicious = true;
            $reason = "Coverage/Prevalence should be 0-100%";
        }
    }
    
    if ($suspicious) {
        $suspicious_metrics[] = [
            'country' => $country,
            'metric' => $item['metric_name'] ?? 'N/A',
            'value' => $value,
            'reason' => $reason
        ];
    }
}

if (!empty($suspicious_metrics)) {
    echo "⚠️  Found " . count($suspicious_metrics) . " potentially incorrect values:\n";
    foreach (array_slice($suspicious_metrics, 0, 20) as $item) {
        echo "   - {$item['country']}: {$item['metric']} = {$item['value']} ({$item['reason']})\n";
    }
    if (count($suspicious_metrics) > 20) {
        echo "   ... and " . (count($suspicious_metrics) - 20) . " more\n";
    }
} else {
    echo "✅ No other obviously incorrect values found\n";
}
echo "\n";

// Save fixed data
echo "=" . str_repeat("=", 69) . "\n";
echo "SAVING FIXED DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

echo "✅ Saved fixed data to: $data_file\n";
echo "   Total records: " . count($data) . "\n";
echo "   Life expectancy values fixed: $fixed_count\n\n";

echo "=" . str_repeat("=", 69) . "\n";
echo "✅ DATA FIX COMPLETE!\n";
echo "=" . str_repeat("=", 69) . "\n";
echo "\n💡 Next step: Review the fixed data and update database\n";

