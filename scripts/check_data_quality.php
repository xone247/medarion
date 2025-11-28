<?php
/**
 * Comprehensive Data Quality Check
 * Identifies unknown/placeholder companies and missing data across all modules
 */

require_once __DIR__ . '/../config/database.php';

$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
if (!empty($config['port'])) {
    $dsn .= ";port={$config['port']}";
}

try {
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "COMPREHENSIVE DATA QUALITY CHECK\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // 1. Check for placeholder/unknown companies
    echo "1. CHECKING FOR PLACEHOLDER/UNKNOWN COMPANIES\n";
    echo str_repeat("-", 60) . "\n";
    
    // More specific placeholder patterns - exclude real company names
    $placeholderQuery = "SELECT COUNT(*) as count FROM companies WHERE (
        name LIKE 'Healthcare Company%' OR 
        name LIKE 'Placeholder%' OR
        name LIKE '%Tech Company%' OR
        name LIKE '%Health Company%' OR
        name LIKE '%Pharma Company%' OR
        name LIKE '%Med Company%' OR
        name LIKE '%Care Company%' OR
        name LIKE '%Bio Company%' OR
        name LIKE 'EliteTech%' OR
        name LIKE 'WellTech%' OR
        name LIKE 'VitaTech%' OR
        name LIKE 'SmartHealth%' OR
        name LIKE 'DigitalHealth%' OR
        name LIKE 'ApexHealth%' OR
        name LIKE 'PrimeHealth%' OR
        name LIKE 'ProHealth%' OR
        name LIKE 'LifeTech%' OR
        name LIKE '%Solutions Company%' OR
        name LIKE '%Group Company%' OR
        name LIKE '%Labs Company%' OR
        name LIKE '%Innovations Company%' OR
        name LIKE '%Systems Company%' OR
        name LIKE '%Global Company%' OR
        name LIKE '%Ventures Company%' OR
        name LIKE '%Capital Company%' OR
        name LIKE '%Fund Company%' OR
        name LIKE '%Investment Company%'
    )";
    $stmt = $pdo->query($placeholderQuery);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Placeholder companies found: " . $result['count'] . "\n";
    
    // Get sample placeholder companies
    $sampleQuery = "SELECT id, name, country FROM companies WHERE " . implode(" OR ", $placeholderConditions) . " LIMIT 10";
    $stmt = $pdo->query($sampleQuery);
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (count($samples) > 0) {
        echo "   Sample placeholder companies:\n";
        foreach ($samples as $sample) {
            echo "     - ID {$sample['id']}: {$sample['name']} ({$sample['country']})\n";
        }
    }
    echo "\n";
    
    // 2. Check Nation Pulse Data
    echo "2. CHECKING NATION PULSE DATA\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN value IS NULL OR value = 0 THEN 1 END) as missing_value, COUNT(CASE WHEN source IS NULL OR source = '' THEN 1 END) as missing_source, COUNT(CASE WHEN unit IS NULL OR unit = '' THEN 1 END) as missing_unit FROM nation_pulse_data");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Total records: " . $result['total'] . "\n";
    echo "   Missing values: " . $result['missing_value'] . "\n";
    echo "   Missing sources: " . $result['missing_source'] . "\n";
    echo "   Missing units: " . $result['missing_unit'] . "\n";
    
    // Check data types
    $stmt = $pdo->query("SELECT data_type, COUNT(*) as count FROM nation_pulse_data GROUP BY data_type");
    $dataTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "   Data by type:\n";
    foreach ($dataTypes as $dt) {
        echo "     - {$dt['data_type']}: {$dt['count']}\n";
    }
    echo "\n";
    
    // 3. Check Clinical Trials
    echo "3. CHECKING CLINICAL TRIALS DATA\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN title IS NULL OR title = '' OR title LIKE '%Trial%' OR title LIKE '%Study%' THEN 1 END) as placeholder_titles, COUNT(CASE WHEN status IS NULL OR status = '' THEN 1 END) as missing_status, COUNT(CASE WHEN phase IS NULL OR phase = '' THEN 1 END) as missing_phase, COUNT(CASE WHEN trial_id IS NULL OR trial_id = '' THEN 1 END) as missing_trial_id FROM clinical_trials");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Total trials: " . $result['total'] . "\n";
    echo "   Placeholder titles: " . $result['placeholder_titles'] . "\n";
    echo "   Missing status: " . $result['missing_status'] . "\n";
    echo "   Missing phase: " . $result['missing_phase'] . "\n";
    echo "   Missing trial ID: " . $result['missing_trial_id'] . "\n";
    echo "\n";
    
    // 4. Check Regulatory Bodies
    echo "4. CHECKING REGULATORY BODIES DATA\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN website IS NULL OR website = '' THEN 1 END) as missing_website, COUNT(CASE WHEN description IS NULL OR description = '' THEN 1 END) as missing_description, COUNT(CASE WHEN abbreviation IS NULL OR abbreviation = '' THEN 1 END) as missing_abbreviation FROM regulatory_bodies");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Total regulatory bodies: " . $result['total'] . "\n";
    echo "   Missing websites: " . $result['missing_website'] . "\n";
    echo "   Missing descriptions: " . $result['missing_description'] . "\n";
    echo "   Missing abbreviations: " . $result['missing_abbreviation'] . "\n";
    echo "\n";
    
    // 5. Check Companies Data Quality
    echo "5. CHECKING COMPANIES DATA QUALITY\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN description IS NULL OR description = '' THEN 1 END) as missing_description, COUNT(CASE WHEN website IS NULL OR website = '' THEN 1 END) as missing_website, COUNT(CASE WHEN founded_year IS NULL THEN 1 END) as missing_founded_year, COUNT(CASE WHEN employees_count IS NULL THEN 1 END) as missing_employees, COUNT(CASE WHEN logo_url IS NULL OR logo_url = '' THEN 1 END) as missing_logo FROM companies");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Total companies: " . $result['total'] . "\n";
    echo "   Missing descriptions: " . $result['missing_description'] . "\n";
    echo "   Missing websites: " . $result['missing_website'] . "\n";
    echo "   Missing founded year: " . $result['missing_founded_year'] . "\n";
    echo "   Missing employees: " . $result['missing_employees'] . "\n";
    echo "   Missing logos: " . $result['missing_logo'] . "\n";
    echo "\n";
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "DATA QUALITY CHECK COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

