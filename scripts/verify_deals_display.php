<?php
/**
 * VERIFY DEALS DISPLAY
 * 
 * This script verifies that:
 * 1. Database has correct count (67 unique deals)
 * 2. All deals have required fields
 * 3. Sample deals are accurate
 */

// Database configuration
$db_config = [
    'host' => 'localhost',
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => ''
];

try {
    $db = new PDO("mysql:host=" . $db_config['host'] . ";dbname=" . $db_config['database'], $db_config['username'], $db_config['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "======================================================================\n";
    echo "VERIFY DEALS DISPLAY\n";
    echo "======================================================================\n\n";

    // Total count
    $countStmt = $db->query("SELECT COUNT(*) as total FROM deals");
    $total = $countStmt->fetch(PDO::FETCH_ASSOC);
    echo "📊 Total deals in database: " . $total['total'] . "\n\n";

    if ($total['total'] != 67) {
        echo "⚠️  WARNING: Expected 67 deals, found " . $total['total'] . "\n\n";
    }

    // Check for missing required fields
    echo "======================================================================\n";
    echo "CHECKING DATA COMPLETENESS\n";
    echo "======================================================================\n\n";

    $checks = [
        'company_name IS NULL OR company_name = ""' => 'Missing company_name',
        'deal_type IS NULL OR deal_type = ""' => 'Missing deal_type',
        'deal_date IS NULL' => 'Missing deal_date',
        'amount IS NULL' => 'Missing amount',
        'country IS NULL OR country = ""' => 'Missing country',
    ];

    foreach ($checks as $condition => $label) {
        $stmt = $db->query("SELECT COUNT(*) as count FROM deals WHERE $condition");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result['count'] > 0) {
            echo "⚠️  " . $label . ": " . $result['count'] . " deals\n";
        } else {
            echo "✅ " . $label . ": All complete\n";
        }
    }

    // Sample deals
    echo "\n======================================================================\n";
    echo "SAMPLE DEALS (last 10 by date)\n";
    echo "======================================================================\n\n";

    $sampleStmt = $db->query("
        SELECT id, company_name, deal_type, deal_date, amount, country, lead_investor, status
        FROM deals 
        ORDER BY deal_date DESC 
        LIMIT 10
    ");

    while ($row = $sampleStmt->fetch(PDO::FETCH_ASSOC)) {
        echo "   ID: " . $row['id'] . "\n";
        echo "   Company: " . $row['company_name'] . "\n";
        echo "   Deal Type: " . $row['deal_type'] . "\n";
        echo "   Date: " . $row['deal_date'] . "\n";
        echo "   Amount: $" . number_format($row['amount'], 2) . "\n";
        echo "   Country: " . $row['country'] . "\n";
        echo "   Lead Investor: " . ($row['lead_investor'] ?? 'N/A') . "\n";
        echo "   Status: " . $row['status'] . "\n";
        echo "\n";
    }

    // Verify no duplicates
    echo "======================================================================\n";
    echo "DUPLICATE CHECK\n";
    echo "======================================================================\n\n";

    $dupStmt = $db->query("
        SELECT company_name, deal_type, deal_date, amount, COUNT(*) as count
        FROM deals 
        GROUP BY company_name, deal_type, deal_date, amount 
        HAVING count > 1
    ");
    $duplicates = $dupStmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($duplicates) === 0) {
        echo "✅ No duplicates found\n";
    } else {
        echo "⚠️  Found " . count($duplicates) . " duplicate groups:\n";
        foreach ($duplicates as $dup) {
            echo "   - " . $dup['company_name'] . " | " . $dup['deal_type'] . " | " . $dup['deal_date'] . " | Count: " . $dup['count'] . "\n";
        }
    }

    echo "\n✅ Verification complete!\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

