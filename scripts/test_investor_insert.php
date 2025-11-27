<?php
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// Test a single investor insert
try {
    $sql = "INSERT INTO investors (name, type, headquarters, founded_year, website, description, focus_sectors, investment_stages, countries, is_active) VALUES
('Test Investor', 'VC', 'Lagos, Nigeria', 2016, 'https://test.com', 'Test description', 
'[\"Healthcare Technology\", \"HealthTech\"]', '[\"Seed\", \"Series A\", \"Series B\"]', 
'[\"Pan-Africa\"]', 1)";
    
    $pdo->exec($sql);
    echo "✅ Test insert successful\n";
    
    // Check count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM investors");
    $result = $stmt->fetch();
    echo "Total investors: " . $result['count'] . "\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

