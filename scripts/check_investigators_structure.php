<?php
/**
 * Check Investigators Database Structure and Current Data
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
    
    // Get count
    $count = $db->query("SELECT COUNT(*) FROM investigators")->fetchColumn();
    echo "📊 Total investigators: $count\n\n";
    
    // Get sample data
    $samples = $db->query("SELECT id, name, country, institution, email, specialization FROM investigators LIMIT 5")->fetchAll();
    echo "📊 Sample records:\n";
    foreach ($samples as $sample) {
        echo json_encode($sample, JSON_PRETTY_PRINT) . "\n\n";
    }
    
    // Count by country
    $by_country = $db->query("SELECT country, COUNT(*) as count FROM investigators GROUP BY country ORDER BY count DESC LIMIT 10")->fetchAll();
    echo "📊 Top 10 countries by investigator count:\n";
    foreach ($by_country as $country) {
        echo "   - {$country['country']}: {$country['count']} investigators\n";
    }
    
} catch(PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}

