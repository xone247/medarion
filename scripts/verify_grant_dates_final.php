<?php
/**
 * FINAL VERIFICATION OF GRANT DATES
 */

// Database configuration
$db_config = [
    'host' => 'localhost',
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => ''
];

echo "======================================================================\n";
echo "FINAL VERIFICATION OF GRANT DATES\n";
echo "======================================================================\n\n";

try {
    $db = new PDO("mysql:host=" . $db_config['host'] . ";dbname=" . $db_config['database'], $db_config['username'], $db_config['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $today = new DateTime();
    
    // Check for future dates
    $stmt = $db->query("SELECT COUNT(*) as count FROM grants WHERE award_date > CURDATE()");
    $future_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Check for null dates
    $stmt = $db->query("SELECT COUNT(*) as count FROM grants WHERE award_date IS NULL OR award_date = ''");
    $null_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Check for very old dates (before 2020)
    $stmt = $db->query("SELECT COUNT(*) as count FROM grants WHERE award_date < '2020-01-01'");
    $old_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo "📊 DATE VERIFICATION:\n";
    echo "   - Grants with future dates: " . $future_count . "\n";
    echo "   - Grants with null dates: " . $null_count . "\n";
    echo "   - Grants with dates before 2020: " . $old_count . "\n\n";
    
    // Date distribution by year
    $stmt = $db->query("SELECT YEAR(award_date) as year, COUNT(*) as count FROM grants WHERE award_date IS NOT NULL GROUP BY YEAR(award_date) ORDER BY year");
    $year_dist = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 DATE DISTRIBUTION BY YEAR:\n";
    foreach ($year_dist as $row) {
        echo "   - " . $row['year'] . ": " . $row['count'] . " grants\n";
    }
    
    // Sample grants with dates
    echo "\n======================================================================\n";
    echo "SAMPLE GRANTS WITH DATES (first 10)\n";
    echo "======================================================================\n\n";
    
    $stmt = $db->query("SELECT title, funding_agency, amount, award_date, duration FROM grants ORDER BY award_date DESC LIMIT 10");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "   - " . $row['title'] . "\n";
        echo "     Agency: " . $row['funding_agency'] . "\n";
        echo "     Amount: $" . number_format($row['amount']) . "\n";
        echo "     Award Date: " . ($row['award_date'] ?? 'N/A') . "\n";
        echo "     Duration: " . ($row['duration'] ?? 'N/A') . "\n\n";
    }
    
    if ($future_count == 0 && $null_count == 0) {
        echo "✅ All grant dates are verified and correct!\n";
    } else {
        echo "⚠️  Some dates need attention\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?>

