<?php
/**
 * Check for countries with multiple regulatory bodies
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "CHECK FOR COUNTRIES WITH MULTIPLE REGULATORY BODIES\n";
echo "=" . str_repeat("=", 69) . "\n\n";

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
    echo "✅ Connected to database\n\n";
} catch(PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage() . "\n\n");
}

// Check for duplicates
$stmt = $db->query("SELECT country, COUNT(*) as count FROM regulatory_bodies GROUP BY country HAVING count > 1 ORDER BY count DESC, country");
$duplicates = $stmt->fetchAll();

if (count($duplicates) > 0) {
    echo "⚠️  Found " . count($duplicates) . " countries with multiple regulatory bodies:\n\n";
    
    foreach ($duplicates as $dup) {
        echo "   📍 {$dup['country']}: {$dup['count']} regulatory bodies\n";
        
        // Get details for each regulatory body
        $stmt_details = $db->prepare("SELECT id, name, acronym, website FROM regulatory_bodies WHERE country = ? ORDER BY id");
        $stmt_details->execute([$dup['country']]);
        $details = $stmt_details->fetchAll();
        
        foreach ($details as $detail) {
            echo "      - ID {$detail['id']}: {$detail['name']}";
            if (!empty($detail['acronym'])) {
                echo " ({$detail['acronym']})";
            }
            if (!empty($detail['website'])) {
                echo " - {$detail['website']}";
            }
            echo "\n";
        }
        echo "\n";
    }
} else {
    echo "✅ No duplicates found!\n";
    echo "   Each country has exactly one regulatory body.\n\n";
}

// Get total count
$total = $db->query("SELECT COUNT(*) FROM regulatory_bodies")->fetchColumn();
$unique_countries = $db->query("SELECT COUNT(DISTINCT country) FROM regulatory_bodies")->fetchColumn();

echo "\n📊 Database Summary:\n";
echo "   - Total regulatory bodies: $total\n";
echo "   - Unique countries: $unique_countries\n";

if ($total > $unique_countries) {
    echo "   ⚠️  There are " . ($total - $unique_countries) . " duplicate entries\n";
} else {
    echo "   ✅ All entries are unique (one per country)\n";
}

echo "\n";

