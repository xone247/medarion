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
    echo "CHECK DEAL DATES\n";
    echo "======================================================================\n\n";
    
    // Get date distribution
    $stmt = $db->query("SELECT deal_date, COUNT(*) as count FROM deals WHERE deal_date IS NOT NULL GROUP BY deal_date ORDER BY deal_date DESC LIMIT 20");
    echo "Date distribution (last 20 unique dates):\n";
    while($row = $stmt->fetch()) {
        echo "   - {$row['deal_date']}: {$row['count']} deals\n";
    }
    
    // Count deals by year
    echo "\nDeals by year:\n";
    $stmt = $db->query("SELECT YEAR(deal_date) as year, COUNT(*) as count FROM deals WHERE deal_date IS NOT NULL GROUP BY YEAR(deal_date) ORDER BY year DESC");
    while($row = $stmt->fetch()) {
        echo "   - {$row['year']}: {$row['count']} deals\n";
    }
    
    // Count deals with null dates
    $stmt = $db->query("SELECT COUNT(*) as count FROM deals WHERE deal_date IS NULL");
    $nullCount = $stmt->fetch()['count'];
    echo "\nDeals with NULL dates: {$nullCount}\n";
    
    // Show sample of recent deals
    echo "\nSample of recent deals (last 10):\n";
    $stmt = $db->query("SELECT company_name, deal_date, deal_type, amount FROM deals ORDER BY deal_date DESC LIMIT 10");
    while($row = $stmt->fetch()) {
        $amount = number_format($row['amount'], 0);
        echo "   - {$row['company_name']} | {$row['deal_type']} | \${$amount} | {$row['deal_date']}\n";
    }
    
} catch (PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}

