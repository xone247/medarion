<?php
/**
 * VERIFY GRANT DURATIONS IN DATABASE
 */

// Database configuration
$db_config = [
    'host' => 'localhost',
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => ''
];

echo "======================================================================\n";
echo "VERIFY GRANT DURATIONS IN DATABASE\n";
echo "======================================================================\n\n";

try {
    $db = new PDO("mysql:host=" . $db_config['host'] . ";dbname=" . $db_config['database'], $db_config['username'], $db_config['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check duration distribution
    $stmt = $db->query("SELECT duration, COUNT(*) as count FROM grants GROUP BY duration ORDER BY count DESC");
    $durations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 DURATION DISTRIBUTION:\n\n";
    foreach ($durations as $row) {
        $duration = $row['duration'] ?? 'NULL';
        echo "   - " . $duration . ": " . $row['count'] . " grants\n";
    }
    
    // Check for null durations
    $stmt = $db->query("SELECT COUNT(*) as count FROM grants WHERE duration IS NULL OR duration = ''");
    $null_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo "\n";
    if ($null_count > 0) {
        echo "⚠️  Grants with null/empty duration: " . $null_count . "\n";
    } else {
        echo "✅ All grants have durations set\n";
    }
    
    // Sample grants with durations
    echo "\n======================================================================\n";
    echo "SAMPLE GRANTS WITH DURATIONS (first 10)\n";
    echo "======================================================================\n\n";
    
    $stmt = $db->query("SELECT title, funding_agency, amount, duration, duration_months FROM grants ORDER BY id LIMIT 10");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "   - " . $row['title'] . "\n";
        echo "     Agency: " . $row['funding_agency'] . "\n";
        echo "     Amount: $" . number_format($row['amount']) . "\n";
        echo "     Duration: " . ($row['duration'] ?? 'N/A') . " (" . ($row['duration_months'] ?? 'N/A') . " months)\n\n";
    }
    
    // Duration by grant type
    echo "======================================================================\n";
    echo "DURATION BY GRANT TYPE\n";
    echo "======================================================================\n\n";
    
    $stmt = $db->query("SELECT grant_type, duration, COUNT(*) as count FROM grants GROUP BY grant_type, duration ORDER BY grant_type, duration");
    $current_type = '';
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if ($current_type !== $row['grant_type']) {
            if ($current_type !== '') echo "\n";
            echo "   " . $row['grant_type'] . ":\n";
            $current_type = $row['grant_type'];
        }
        echo "      - " . ($row['duration'] ?? 'NULL') . ": " . $row['count'] . " grants\n";
    }
    
    echo "\n✅ Verification complete!\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?>

