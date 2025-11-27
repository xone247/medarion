<?php
/**
 * Debug why certain tables aren't being seeded
 */
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// Test a sample INSERT for each missing table
$test_inserts = [
    'regulatory_bodies' => "INSERT INTO regulatory_bodies (name, country, abbreviation, website, description, is_active) VALUES ('Test Regulatory', 'Test Country', 'TEST', NULL, 'Test description', TRUE)",
    'public_stocks' => "INSERT INTO public_stocks (company_name, ticker, exchange, price, market_cap, currency, sector, country) VALUES ('Test Company', 'TEST', 'JSE', '100', '1M', 'ZAR', 'Healthcare', 'South Africa')",
    'clinical_centers' => "INSERT INTO clinical_centers (name, country, city, description, is_active) VALUES ('Test Center', 'Test Country', 'Test City', 'Test description', TRUE)",
    'investigators' => "INSERT INTO investigators (name, title, institution, country, city, is_active) VALUES ('Test Investigator', 'Dr', 'Test Institution', 'Test Country', 'Test City', TRUE)",
    'nation_pulse_data' => "INSERT INTO nation_pulse_data (country, data_type, metric_name, metric_value, metric_unit, year, source) VALUES ('Test Country', 'population', 'Test Metric', 1000, 'people', 2024, 'Test Source')",
    'company_regulatory' => "INSERT INTO company_regulatory (company_id, regulatory_body_id, product_name, status, region, application_date) VALUES (1, 1, 'Test Product', 'Submitted', 'Test Region', '2024-01-01')",
];

echo "Testing INSERT statements for missing tables:\n\n";

foreach ($test_inserts as $table => $sql) {
    try {
        $pdo->exec($sql);
        echo "✅ $table: INSERT works\n";
        
        // Clean up test data
        $pdo->exec("DELETE FROM `$table` WHERE name LIKE 'Test%' OR company_name LIKE 'Test%'");
    } catch (PDOException $e) {
        echo "❌ $table: " . $e->getMessage() . "\n";
    }
}

// Check table structures
echo "\n\nChecking table structures:\n\n";
$tables = ['regulatory_bodies', 'public_stocks', 'clinical_centers', 'investigators', 'nation_pulse_data', 'company_regulatory'];

foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table`");
        $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "$table columns: " . implode(', ', array_slice($cols, 0, 10)) . (count($cols) > 10 ? '...' : '') . "\n";
    } catch (PDOException $e) {
        echo "❌ $table: " . $e->getMessage() . "\n";
    }
}

