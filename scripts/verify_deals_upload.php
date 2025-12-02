<?php
/**
 * Verify Deals Upload
 */

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
    echo "VERIFY DEALS UPLOAD\n";
    echo "======================================================================\n\n";
    
    // Check total count
    $stmt = $db->query("SELECT COUNT(*) as count FROM deals");
    $total = $stmt->fetch()['count'];
    echo "📊 Total deals in database: {$total}\n\n";
    
    // Check for missing deal_type
    $stmt = $db->query("SELECT COUNT(*) as count FROM deals WHERE deal_type IS NULL OR deal_type = ''");
    $missing = $stmt->fetch()['count'];
    echo "⚠️  Deals with missing deal_type: {$missing}\n\n";
    
    // Sample records with deal_type
    echo "📊 Sample records (with deal_type):\n";
    $stmt = $db->query("SELECT company_name, deal_type, amount, deal_date, country FROM deals WHERE deal_type IS NOT NULL AND deal_type != '' ORDER BY deal_date DESC LIMIT 10");
    $samples = $stmt->fetchAll();
    foreach ($samples as $sample) {
        $amount = number_format($sample['amount'], 0);
        echo "   - {$sample['company_name']}: {$sample['deal_type']} - \${$amount} ({$sample['deal_date']}) - {$sample['country']}\n";
    }
    
    // Check deal types distribution
    echo "\n📊 Deal types distribution:\n";
    $stmt = $db->query("SELECT deal_type, COUNT(*) as count FROM deals WHERE deal_type IS NOT NULL AND deal_type != '' GROUP BY deal_type ORDER BY count DESC");
    $types = $stmt->fetchAll();
    foreach ($types as $type) {
        echo "   - {$type['deal_type']}: {$type['count']} deals\n";
    }
    
    // Check countries distribution
    echo "\n📊 Top 10 countries by deal count:\n";
    $stmt = $db->query("SELECT country, COUNT(*) as count FROM deals WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 10");
    $countries = $stmt->fetchAll();
    foreach ($countries as $country) {
        echo "   - {$country['country']}: {$country['count']} deals\n";
    }
    
    echo "\n✅ Verification complete!\n";
    
} catch (PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage() . "\n");
}

