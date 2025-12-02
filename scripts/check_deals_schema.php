<?php
$db_config = [
    'host' => 'localhost',
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => ''
];

try {
    $db = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['database']};charset=utf8mb4",
        $db_config['username'],
        $db_config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "======================================================================\n";
    echo "CHECK DEALS TABLE SCHEMA\n";
    echo "======================================================================\n\n";
    
    // Get table structure
    $stmt = $db->query("SHOW CREATE TABLE deals");
    $result = $stmt->fetch();
    echo "CREATE TABLE statement:\n";
    echo $result['Create Table'] . "\n\n";
    
    // Check sample deal_type values
    echo "Sample deal_type values in database:\n";
    $stmt = $db->query("SELECT DISTINCT deal_type FROM deals LIMIT 20");
    $types = $stmt->fetchAll();
    foreach ($types as $type) {
        echo "   - '" . $type['deal_type'] . "'\n";
    }
    
} catch (PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}

