<?php
/**
 * Analyze Nation Pulse Data for Accuracy
 * Check life expectancy and other metrics for factual correctness
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "NATION PULSE DATA ANALYSIS - ACCURACY CHECK\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$data_file = 'data_master/verified/nation_pulse/master_nation_pulse.json';

if (!file_exists($data_file)) {
    die("❌ File not found: $data_file\n");
}

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    die("❌ Invalid JSON data\n");
}

echo "📊 Total records: " . count($data) . "\n\n";

// Get unique metrics
$metrics = array_unique(array_column($data, 'metric_name'));
echo "📋 Unique metrics found: " . count($metrics) . "\n";
foreach ($metrics as $metric) {
    echo "   - $metric\n";
}
echo "\n";

// Get unique countries
$countries = array_unique(array_column($data, 'country'));
echo "🌍 Countries found: " . count($countries) . "\n";
echo "   Sample: " . implode(', ', array_slice($countries, 0, 10)) . "...\n\n";

// Check life expectancy specifically
echo "=" . str_repeat("=", 69) . "\n";
echo "LIFE EXPECTANCY DATA CHECK\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$life_expectancy_data = array_filter($data, function($item) {
    $metric = strtolower($item['metric_name'] ?? '');
    return stripos($metric, 'life') !== false && stripos($metric, 'expectancy') !== false;
});

echo "📊 Life Expectancy entries: " . count($life_expectancy_data) . "\n\n";

if (!empty($life_expectancy_data)) {
    echo "Sample Life Expectancy Values:\n";
    $sample = array_slice($life_expectancy_data, 0, 10);
    foreach ($sample as $item) {
        $country = $item['country'] ?? 'N/A';
        $value = $item['metric_value'] ?? 'N/A';
        $year = $item['year'] ?? 'N/A';
        $unit = $item['metric_unit'] ?? 'N/A';
        echo "   - $country: $value $unit (Year: $year)\n";
    }
    echo "\n";
    
    // Check for unrealistic values
    echo "⚠️  Checking for unrealistic values...\n";
    $unrealistic = [];
    foreach ($life_expectancy_data as $item) {
        $value = floatval($item['metric_value'] ?? 0);
        // Life expectancy should typically be between 40-90 years
        if ($value < 30 || $value > 100) {
            $unrealistic[] = [
                'country' => $item['country'] ?? 'N/A',
                'value' => $value,
                'year' => $item['year'] ?? 'N/A'
            ];
        }
    }
    
    if (!empty($unrealistic)) {
        echo "   ❌ Found " . count($unrealistic) . " unrealistic values:\n";
        foreach (array_slice($unrealistic, 0, 10) as $item) {
            echo "      - {$item['country']}: {$item['value']} years (Year: {$item['year']})\n";
        }
    } else {
        echo "   ✅ All life expectancy values are within reasonable range (30-100 years)\n";
    }
    echo "\n";
}

// Check other common health metrics
echo "=" . str_repeat("=", 69) . "\n";
echo "OTHER HEALTH METRICS CHECK\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$common_metrics = [
    'infant mortality',
    'maternal mortality',
    'gdp per capita',
    'healthcare expenditure',
    'population',
    'hiv prevalence',
    'malaria',
    'tuberculosis'
];

foreach ($common_metrics as $metric_keyword) {
    $metric_data = array_filter($data, function($item) use ($metric_keyword) {
        return stripos(strtolower($item['metric_name'] ?? ''), $metric_keyword) !== false;
    });
    
    if (!empty($metric_data)) {
        $count = count($metric_data);
        echo "📊 $metric_keyword: $count entries\n";
        
        // Show sample values
        $sample = array_slice($metric_data, 0, 3);
        foreach ($sample as $item) {
            $value = $item['metric_value'] ?? 'N/A';
            $unit = $item['metric_unit'] ?? '';
            echo "   - {$item['country']}: $value $unit\n";
        }
        echo "\n";
    }
}

// Check data completeness
echo "=" . str_repeat("=", 69) . "\n";
echo "DATA COMPLETENESS CHECK\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$missing_values = 0;
$missing_countries = 0;
$missing_years = 0;

foreach ($data as $item) {
    if (empty($item['metric_value']) || $item['metric_value'] === null) {
        $missing_values++;
    }
    if (empty($item['country']) || $item['country'] === null) {
        $missing_countries++;
    }
    if (empty($item['year']) || $item['year'] === null) {
        $missing_years++;
    }
}

echo "📊 Records with missing values:\n";
echo "   - Missing metric_value: $missing_values\n";
echo "   - Missing country: $missing_countries\n";
echo "   - Missing year: $missing_years\n\n";

$completeness = ((count($data) - $missing_values) / count($data)) * 100;
echo "✅ Data completeness: " . round($completeness, 1) . "%\n\n";

echo "=" . str_repeat("=", 69) . "\n";
echo "✅ ANALYSIS COMPLETE\n";
echo "=" . str_repeat("=", 69) . "\n";

