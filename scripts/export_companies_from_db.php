<?php
/**
 * Export Companies from Local Database
 */

$db_config = [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4'
];

try {
    $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['database']};charset={$db_config['charset']}";
    $db = new PDO($dsn, $db_config['username'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "Exporting companies from database...\n";
    
    $stmt = $db->query("SELECT * FROM companies ORDER BY id");
    $companies = $stmt->fetchAll();
    
    $output_file = 'data_master/verified/companies/db_companies_export.json';
    
    // Create directory if it doesn't exist
    $dir = dirname($output_file);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    file_put_contents($output_file, json_encode($companies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    echo "✅ Exported " . count($companies) . " companies to $output_file\n";
    
} catch(PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}

