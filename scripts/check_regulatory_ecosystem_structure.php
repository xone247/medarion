<?php
/**
 * Check Regulatory Ecosystem Database Structure
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
    
    // Check if regulatory_ecosystem table exists
    $tables = $db->query("SHOW TABLES LIKE 'regulatory_ecosystem'")->fetchAll();
    
    if (count($tables) > 0) {
        echo "✅ Table 'regulatory_ecosystem' exists\n\n";
        
        // Get table structure
        $columns = $db->query("DESCRIBE regulatory_ecosystem")->fetchAll();
        echo "📊 Table Structure:\n";
        foreach ($columns as $col) {
            echo "   - {$col['Field']} ({$col['Type']})\n";
        }
        echo "\n";
        
        // Get count
        $count = $db->query("SELECT COUNT(*) FROM regulatory_ecosystem")->fetchColumn();
        echo "📊 Total records: $count\n\n";
        
        // Get sample data
        $samples = $db->query("SELECT * FROM regulatory_ecosystem LIMIT 3")->fetchAll();
        echo "📊 Sample records:\n";
        foreach ($samples as $sample) {
            echo json_encode($sample, JSON_PRETTY_PRINT) . "\n\n";
        }
    } else {
        echo "❌ Table 'regulatory_ecosystem' does not exist\n";
        echo "Checking for 'regulatory_bodies' table...\n\n";
        
        $tables = $db->query("SHOW TABLES LIKE 'regulatory_bodies'")->fetchAll();
        if (count($tables) > 0) {
            echo "✅ Table 'regulatory_bodies' exists\n\n";
            $columns = $db->query("DESCRIBE regulatory_bodies")->fetchAll();
            echo "📊 Table Structure:\n";
            foreach ($columns as $col) {
                echo "   - {$col['Field']} ({$col['Type']})\n";
            }
            echo "\n";
            
            $count = $db->query("SELECT COUNT(*) FROM regulatory_bodies")->fetchColumn();
            echo "📊 Total records: $count\n\n";
            
            $samples = $db->query("SELECT * FROM regulatory_bodies LIMIT 3")->fetchAll();
            echo "📊 Sample records:\n";
            foreach ($samples as $sample) {
                echo json_encode($sample, JSON_PRETTY_PRINT) . "\n\n";
            }
        }
    }
    
} catch(PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}

