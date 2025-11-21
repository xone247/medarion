<?php
// Seed comprehensive demo data for nation_pulse_data table
// This includes population, healthcare infrastructure, economic indicators, disease prevalence, and immunization coverage

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$config = require_once __DIR__ . '/../../config/database.php';

try {
    $dsn = "mysql:host={$config['host']};dbname={$config['database']}";
    if (!empty($config['charset'])) {
        $dsn .= ";charset={$config['charset']}";
    }
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO(
        $dsn,
        $config['username'],
        $config['password'],
        $config['options'] ?? []
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check which schema exists
    $checkColumns = $pdo->query("SHOW COLUMNS FROM nation_pulse_data LIKE 'data_type'");
    $hasDataType = $checkColumns->rowCount() > 0;
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    // $pdo->exec("DELETE FROM nation_pulse_data");
    
    $countries = ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Egypt', 'Rwanda'];
    $year = 2024;
    
    $demoData = [];
    
    foreach ($countries as $country) {
        // Population Data
        $demoData[] = ['country' => $country, 'data_type' => 'population', 'metric_name' => 'life_expectancy', 'metric_value' => match($country) { 'Nigeria' => 54.7, 'Kenya' => 66.3, 'Ghana' => 64.5, 'South Africa' => 64.1, 'Egypt' => 72.0, 'Rwanda' => 69.0, default => 65.0 }, 'metric_unit' => 'years', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'population', 'metric_name' => 'population_size', 'metric_value' => match($country) { 'Nigeria' => 206139589, 'Kenya' => 53771300, 'Ghana' => 31072940, 'South Africa' => 59308690, 'Egypt' => 104258327, 'Rwanda' => 13276517, default => 50000000 }, 'metric_unit' => 'people', 'year' => $year, 'source' => 'World Bank'];
        $demoData[] = ['country' => $country, 'data_type' => 'population', 'metric_name' => 'population_growth_rate', 'metric_value' => match($country) { 'Nigeria' => 2.4, 'Kenya' => 2.3, 'Ghana' => 2.1, 'South Africa' => 1.2, 'Egypt' => 1.9, 'Rwanda' => 2.3, default => 2.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'World Bank'];
        $demoData[] = ['country' => $country, 'data_type' => 'population', 'metric_name' => 'under_five_mortality', 'metric_value' => match($country) { 'Nigeria' => 74.2, 'Kenya' => 35.0, 'Ghana' => 44.0, 'South Africa' => 28.0, 'Egypt' => 19.0, 'Rwanda' => 29.0, default => 40.0 }, 'metric_unit' => 'per 1000', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'population', 'metric_name' => 'maternal_mortality', 'metric_value' => match($country) { 'Nigeria' => 512, 'Kenya' => 342, 'Ghana' => 308, 'South Africa' => 119, 'Egypt' => 37, 'Rwanda' => 248, default => 300 }, 'metric_unit' => 'per 100000', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'population', 'metric_name' => 'neonatal_mortality', 'metric_value' => match($country) { 'Nigeria' => 34.0, 'Kenya' => 19.0, 'Ghana' => 22.0, 'South Africa' => 11.0, 'Egypt' => 11.0, 'Rwanda' => 17.0, default => 20.0 }, 'metric_unit' => 'per 1000', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'population', 'metric_name' => 'annual_births', 'metric_value' => match($country) { 'Nigeria' => 7000000, 'Kenya' => 1500000, 'Ghana' => 800000, 'South Africa' => 1200000, 'Egypt' => 2500000, 'Rwanda' => 400000, default => 1000000 }, 'metric_unit' => 'births', 'year' => $year, 'source' => 'UN'];
        $demoData[] = ['country' => $country, 'data_type' => 'population', 'metric_name' => 'birth_rate', 'metric_value' => match($country) { 'Nigeria' => 34.0, 'Kenya' => 28.0, 'Ghana' => 26.0, 'South Africa' => 20.0, 'Egypt' => 24.0, 'Rwanda' => 30.0, default => 25.0 }, 'metric_unit' => 'per 1000', 'year' => $year, 'source' => 'World Bank'];
        
        // Healthcare Infrastructure Data
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'health_expenditure_percentage_gdp', 'metric_value' => match($country) { 'Nigeria' => 3.2, 'Kenya' => 2.8, 'Ghana' => 3.5, 'South Africa' => 8.5, 'Egypt' => 4.8, 'Rwanda' => 7.1, default => 4.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'health_expenditure_per_capita', 'metric_value' => match($country) { 'Nigeria' => 72, 'Kenya' => 58, 'Ghana' => 78, 'South Africa' => 510, 'Egypt' => 230, 'Rwanda' => 50, default => 100 }, 'metric_unit' => 'USD', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'government_health_share', 'metric_value' => match($country) { 'Nigeria' => 25.0, 'Kenya' => 30.0, 'Ghana' => 35.0, 'South Africa' => 48.0, 'Egypt' => 42.0, 'Rwanda' => 55.0, default => 35.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'private_health_share', 'metric_value' => match($country) { 'Nigeria' => 75.0, 'Kenya' => 70.0, 'Ghana' => 65.0, 'South Africa' => 52.0, 'Egypt' => 58.0, 'Rwanda' => 45.0, default => 65.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'physicians_per_10k', 'metric_value' => match($country) { 'Nigeria' => 3.8, 'Kenya' => 2.0, 'Ghana' => 1.0, 'South Africa' => 8.0, 'Egypt' => 7.6, 'Rwanda' => 1.2, default => 3.0 }, 'metric_unit' => 'per 10k', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'nurses_per_10k', 'metric_value' => match($country) { 'Nigeria' => 16.0, 'Kenya' => 12.0, 'Ghana' => 8.0, 'South Africa' => 50.0, 'Egypt' => 35.0, 'Rwanda' => 6.0, default => 15.0 }, 'metric_unit' => 'per 10k', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'midwives_per_10k', 'metric_value' => match($country) { 'Nigeria' => 4.0, 'Kenya' => 3.0, 'Ghana' => 2.5, 'South Africa' => 8.0, 'Egypt' => 6.0, 'Rwanda' => 2.0, default => 4.0 }, 'metric_unit' => 'per 10k', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'drinking_water_access', 'metric_value' => match($country) { 'Nigeria' => 68.0, 'Kenya' => 59.0, 'Ghana' => 79.0, 'South Africa' => 91.0, 'Egypt' => 99.0, 'Rwanda' => 76.0, default => 70.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'UNICEF'];
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'basic_sanitation_access', 'metric_value' => match($country) { 'Nigeria' => 44.0, 'Kenya' => 31.0, 'Ghana' => 20.0, 'South Africa' => 66.0, 'Egypt' => 95.0, 'Rwanda' => 75.0, default => 50.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'UNICEF'];
        $demoData[] = ['country' => $country, 'data_type' => 'healthcare_infrastructure', 'metric_name' => 'handwashing_facilities', 'metric_value' => match($country) { 'Nigeria' => 38.0, 'Kenya' => 25.0, 'Ghana' => 15.0, 'South Africa' => 60.0, 'Egypt' => 85.0, 'Rwanda' => 70.0, default => 45.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'UNICEF'];
        
        // Economic Indicators Data
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'gdp_per_capita', 'metric_value' => match($country) { 'Nigeria' => 2250, 'Kenya' => 2083, 'Ghana' => 2400, 'South Africa' => 6000, 'Egypt' => 4200, 'Rwanda' => 900, default => 2000 }, 'metric_unit' => 'USD', 'year' => $year, 'source' => 'World Bank'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'gdp_total_billions', 'metric_value' => match($country) { 'Nigeria' => 464, 'Kenya' => 112, 'Ghana' => 75, 'South Africa' => 356, 'Egypt' => 438, 'Rwanda' => 12, default => 200 }, 'metric_unit' => 'USD billions', 'year' => $year, 'source' => 'World Bank'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'gdp_growth_rate', 'metric_value' => match($country) { 'Nigeria' => 2.9, 'Kenya' => 4.2, 'Ghana' => 3.8, 'South Africa' => 1.2, 'Egypt' => 3.8, 'Rwanda' => 8.2, default => 3.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'World Bank'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'inflation_rate', 'metric_value' => match($country) { 'Nigeria' => 24.5, 'Kenya' => 6.1, 'Ghana' => 23.2, 'South Africa' => 5.8, 'Egypt' => 33.9, 'Rwanda' => 7.7, default => 10.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'World Bank'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'fdi_inflow_millions', 'metric_value' => match($country) { 'Nigeria' => 4800, 'Kenya' => 1200, 'Ghana' => 3000, 'South Africa' => 5600, 'Egypt' => 8900, 'Rwanda' => 400, default => 2000 }, 'metric_unit' => 'USD millions', 'year' => $year, 'source' => 'UNCTAD'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'healthcare_fdi_share', 'metric_value' => match($country) { 'Nigeria' => 8.0, 'Kenya' => 12.0, 'Ghana' => 10.0, 'South Africa' => 15.0, 'Egypt' => 18.0, 'Rwanda' => 25.0, default => 12.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'UNCTAD'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'unemployment_rate', 'metric_value' => match($country) { 'Nigeria' => 5.3, 'Kenya' => 5.7, 'Ghana' => 4.5, 'South Africa' => 32.9, 'Egypt' => 7.2, 'Rwanda' => 13.0, default => 8.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'ILO'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'informal_sector_size', 'metric_value' => match($country) { 'Nigeria' => 65.0, 'Kenya' => 83.0, 'Ghana' => 80.0, 'South Africa' => 18.0, 'Egypt' => 51.0, 'Rwanda' => 90.0, default => 60.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'ILO'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'poverty_rate', 'metric_value' => match($country) { 'Nigeria' => 40.1, 'Kenya' => 36.1, 'Ghana' => 23.4, 'South Africa' => 55.5, 'Egypt' => 29.7, 'Rwanda' => 38.2, default => 35.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'World Bank'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'gini_coefficient', 'metric_value' => match($country) { 'Nigeria' => 35.1, 'Kenya' => 40.8, 'Ghana' => 43.5, 'South Africa' => 63.0, 'Egypt' => 31.5, 'Rwanda' => 43.7, default => 40.0 }, 'metric_unit' => 'index', 'year' => $year, 'source' => 'World Bank'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'debt_to_gdp', 'metric_value' => match($country) { 'Nigeria' => 37.0, 'Kenya' => 68.0, 'Ghana' => 88.0, 'South Africa' => 72.0, 'Egypt' => 93.0, 'Rwanda' => 66.0, default => 60.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'IMF'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'fiscal_deficit_to_gdp', 'metric_value' => match($country) { 'Nigeria' => 5.0, 'Kenya' => 5.7, 'Ghana' => 4.8, 'South Africa' => 4.2, 'Egypt' => 6.1, 'Rwanda' => 5.3, default => 5.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'IMF'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'health_budget_share', 'metric_value' => match($country) { 'Nigeria' => 4.5, 'Kenya' => 5.2, 'Ghana' => 5.8, 'South Africa' => 13.2, 'Egypt' => 6.1, 'Rwanda' => 9.8, default => 6.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'currency_code', 'metric_value' => match($country) { 'Nigeria' => 'NGN', 'Kenya' => 'KES', 'Ghana' => 'GHS', 'South Africa' => 'ZAR', 'Egypt' => 'EGP', 'Rwanda' => 'RWF', default => 'USD' }, 'metric_unit' => 'code', 'year' => $year, 'source' => 'Central Bank'];
        $demoData[] = ['country' => $country, 'data_type' => 'economic_indicators', 'metric_name' => 'exchange_rate_to_usd', 'metric_value' => match($country) { 'Nigeria' => 1500, 'Kenya' => 130, 'Ghana' => 12, 'South Africa' => 18, 'Egypt' => 31, 'Rwanda' => 1200, default => 1 }, 'metric_unit' => 'rate', 'year' => $year, 'source' => 'Central Bank'];
        
        // Disease Prevalence Data (under disease_immunization data_type)
        $demoData[] = ['country' => $country, 'data_type' => 'disease_immunization', 'metric_name' => 'hiv_prevalence', 'metric_value' => match($country) { 'Nigeria' => 1.3, 'Kenya' => 4.0, 'Ghana' => 1.7, 'South Africa' => 19.1, 'Egypt' => 0.1, 'Rwanda' => 2.6, default => 2.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'UNAIDS'];
        $demoData[] = ['country' => $country, 'data_type' => 'disease_immunization', 'metric_name' => 'art_coverage', 'metric_value' => match($country) { 'Nigeria' => 45.0, 'Kenya' => 78.0, 'Ghana' => 65.0, 'South Africa' => 71.0, 'Egypt' => 85.0, 'Rwanda' => 88.0, default => 65.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'UNAIDS'];
        $demoData[] = ['country' => $country, 'data_type' => 'disease_immunization', 'metric_name' => 'malaria_incidence', 'metric_value' => match($country) { 'Nigeria' => 215, 'Kenya' => 125, 'Ghana' => 155, 'South Africa' => 8, 'Egypt' => 0, 'Rwanda' => 320, default => 150 }, 'metric_unit' => 'per 1000', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'disease_immunization', 'metric_name' => 'tuberculosis_incidence', 'metric_value' => match($country) { 'Nigeria' => 219, 'Kenya' => 233, 'Ghana' => 151, 'South Africa' => 520, 'Egypt' => 11, 'Rwanda' => 69, default => 200 }, 'metric_unit' => 'per 100000', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'disease_immunization', 'metric_name' => 'ncd_burden', 'metric_value' => match($country) { 'Nigeria' => 29.0, 'Kenya' => 27.0, 'Ghana' => 31.0, 'South Africa' => 43.0, 'Egypt' => 82.0, 'Rwanda' => 20.0, default => 30.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'WHO'];
        
        // Immunization Coverage Data (under disease_immunization data_type)
        $demoData[] = ['country' => $country, 'data_type' => 'disease_immunization', 'metric_name' => 'dtp3_coverage', 'metric_value' => match($country) { 'Nigeria' => 57.0, 'Kenya' => 78.0, 'Ghana' => 98.0, 'South Africa' => 76.0, 'Egypt' => 95.0, 'Rwanda' => 98.0, default => 80.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'disease_immunization', 'metric_name' => 'bcg_coverage', 'metric_value' => match($country) { 'Nigeria' => 75.0, 'Kenya' => 95.0, 'Ghana' => 99.0, 'South Africa' => 85.0, 'Egypt' => 98.0, 'Rwanda' => 99.0, default => 90.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'disease_immunization', 'metric_name' => 'measles_coverage', 'metric_value' => match($country) { 'Nigeria' => 54.0, 'Kenya' => 80.0, 'Ghana' => 94.0, 'South Africa' => 75.0, 'Egypt' => 96.0, 'Rwanda' => 97.0, default => 80.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'WHO'];
        $demoData[] = ['country' => $country, 'data_type' => 'disease_immunization', 'metric_name' => 'polio_coverage', 'metric_value' => match($country) { 'Nigeria' => 68.0, 'Kenya' => 82.0, 'Ghana' => 98.0, 'South Africa' => 88.0, 'Egypt' => 95.0, 'Rwanda' => 99.0, default => 85.0 }, 'metric_unit' => '%', 'year' => $year, 'source' => 'WHO'];
    }
    
    // Prepare insert statement
    if ($hasDataType) {
        $stmt = $pdo->prepare("INSERT INTO nation_pulse_data (country, data_type, metric_name, metric_value, metric_unit, year, source, created_at, updated_at) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                               ON DUPLICATE KEY UPDATE metric_value = VALUES(metric_value), updated_at = NOW()");
    } else {
        // New schema
        $stmt = $pdo->prepare("INSERT INTO nation_pulse_data (country, indicator_type, indicator_name, value, unit, year, source, created_at, updated_at) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                               ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()");
    }
    
    $inserted = 0;
    foreach ($demoData as $data) {
        try {
            if ($hasDataType) {
                $stmt->execute([
                    $data['country'],
                    $data['data_type'],
                    $data['metric_name'],
                    $data['metric_value'],
                    $data['metric_unit'],
                    $data['year'],
                    $data['source']
                ]);
            } else {
                $stmt->execute([
                    $data['country'],
                    $data['data_type'],
                    $data['metric_name'],
                    $data['metric_value'],
                    $data['metric_unit'],
                    $data['year'],
                    $data['source']
                ]);
            }
            $inserted++;
        } catch (PDOException $e) {
            // Skip duplicates or errors
            continue;
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Inserted/updated $inserted nation pulse data records",
        'total_records' => $inserted
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error: ' . $e->getMessage()
    ]);
}
?>

