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
    echo "VERIFY DEALS IN DATABASE\n";
    echo "======================================================================\n\n";
    
    // Check total count
    $stmt = $db->query("SELECT COUNT(*) as count FROM deals");
    $total = $stmt->fetch()['count'];
    echo "📊 Total deals in database: {$total}\n\n";
    
    // Get recent deals
    echo "📊 Recent deals (last 10):\n";
    $stmt = $db->query("SELECT id, company_name, deal_type, amount, deal_date, country, lead_investor FROM deals ORDER BY deal_date DESC, id DESC LIMIT 10");
    $deals = $stmt->fetchAll();
    foreach ($deals as $deal) {
        $amount = number_format($deal['amount'], 0);
        echo "   - ID: {$deal['id']} | {$deal['company_name']} | {$deal['deal_type']} | \${$amount} | {$deal['deal_date']} | {$deal['country']} | Lead: {$deal['lead_investor']}\n";
    }
    
    // Check for Helium Health specifically
    echo "\n📊 Helium Health deals:\n";
    $stmt = $db->query("SELECT id, company_name, deal_type, amount, deal_date, country, lead_investor FROM deals WHERE company_name LIKE '%Helium%' LIMIT 5");
    $helium = $stmt->fetchAll();
    foreach ($helium as $deal) {
        $amount = number_format($deal['amount'], 0);
        echo "   - ID: {$deal['id']} | {$deal['company_name']} | {$deal['deal_type']} | \${$amount} | {$deal['deal_date']} | {$deal['country']} | Lead: {$deal['lead_investor']}\n";
    }
    
    echo "\n✅ Database verification complete!\n";
    
} catch (PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}

