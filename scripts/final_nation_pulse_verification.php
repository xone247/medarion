<?php
/**
 * Final Verification of Nation Pulse Data
 * Verify all metrics are complete and accurate
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "FINAL NATION PULSE DATA VERIFICATION\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$data_file = 'data_master/verified/nation_pulse/master_nation_pulse.json';
$data = json_decode(file_get_contents($data_file), true);

echo "📊 Total records: " . count($data) . "\n\n";

// Get all countries
$countries = array_unique(array_column($data, 'country'));
echo "🌍 Countries: " . count($countries) . "\n\n";

// Get all metrics
$metrics = array_unique(array_column($data, 'metric_name'));
echo "📋 Metrics: " . count($metrics) . "\n";
foreach ($metrics as $metric) {
    echo "   - $metric\n";
}
echo "\n";

// Check electrification specifically
echo "=" . str_repeat("=", 69) . "\n";
echo "ELECTRIFICATION VERIFICATION\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$electrification = array_filter($data, function($item) {
    $metric = strtolower($item['metric_name'] ?? '');
    return stripos($metric, 'electrification') !== false || stripos($metric, 'electricity') !== false;
});

echo "📊 Electrification entries: " . count($electrification) . "\n\n";

$zero_count = 0;
$countries_with_electrification = [];
foreach ($electrification as $item) {
    $value = floatval($item['metric_value'] ?? 0);
    $country = $item['country'] ?? '';
    $countries_with_electrification[] = $country;
    
    if ($value == 0) {
        $zero_count++;
        echo "⚠️  $country: 0%\n";
    } else {
        echo "✅ $country: {$value}%\n";
    }
}

echo "\n";
if ($zero_count == 0) {
    echo "✅ All electrification values are non-zero!\n";
} else {
    echo "⚠️  Found $zero_count countries with 0% electrification\n";
}

echo "\nCountries with electrification: " . count($countries_with_electrification) . " / " . count($countries) . "\n\n";

// Check completeness for key metrics
echo "=" . str_repeat("=", 69) . "\n";
echo "DATA COMPLETENESS CHECK\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$key_metrics = [
    'life_expectancy',
    'electrification_rate',
    'population_size',
    'gdp_per_capita_usd',
    'health_expenditure_percentage_of_gdp',
    'drinking_water_access',
    'under_five_mortality',
    'hiv_prevalence'
];

foreach ($key_metrics as $key_metric) {
    $metric_data = array_filter($data, function($item) use ($key_metric) {
        return strtolower($item['metric_name'] ?? '') === strtolower($key_metric);
    });
    
    $count = count($metric_data);
    $with_values = count(array_filter($metric_data, function($item) {
        $val = $item['metric_value'] ?? null;
        return $val !== null && $val !== '' && floatval($val) > 0;
    }));
    
    $percentage = count($countries) > 0 ? round(($count / count($countries)) * 100, 1) : 0;
    $status = ($count == count($countries) && $with_values == $count) ? '✅' : '⚠️';
    
    echo "$status $key_metric: $count entries ($with_values with values) - {$percentage}% coverage\n";
}

echo "\n";
echo "=" . str_repeat("=", 69) . "\n";
echo "✅ VERIFICATION COMPLETE!\n";
echo "=" . str_repeat("=", 69) . "\n";

