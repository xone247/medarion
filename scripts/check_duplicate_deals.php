<?php
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
    echo "CHECK FOR DUPLICATE DEALS\n";
    echo "======================================================================\n\n";

    // Check for exact duplicates (same company, deal_type, deal_date, amount)
    $sql = "
        SELECT company_name, deal_type, deal_date, amount, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id) as ids
        FROM deals 
        GROUP BY company_name, deal_type, deal_date, amount 
        HAVING count > 1 
        ORDER BY count DESC
    ";

    $stmt = $db->query($sql);
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($duplicates) > 0) {
        echo "⚠️  Found " . count($duplicates) . " groups of duplicate deals:\n\n";
        
        $totalDuplicates = 0;
        foreach ($duplicates as $dup) {
            $count = (int)$dup['count'];
            $totalDuplicates += ($count - 1); // Count extra duplicates
            echo "   Company: " . $dup['company_name'] . "\n";
            echo "   Deal Type: " . $dup['deal_type'] . "\n";
            echo "   Date: " . $dup['deal_date'] . "\n";
            echo "   Amount: $" . number_format($dup['amount'], 2) . "\n";
            echo "   Count: " . $count . " duplicates\n";
            echo "   IDs: " . $dup['ids'] . "\n";
            echo "\n";
        }
        
        echo "📊 Summary:\n";
        echo "   - Duplicate groups: " . count($duplicates) . "\n";
        echo "   - Total extra records: " . $totalDuplicates . "\n";
        echo "   - Records to remove: " . $totalDuplicates . "\n";
    } else {
        echo "✅ No exact duplicates found (same company, deal_type, deal_date, amount)\n";
    }

    // Check for similar duplicates (same company, deal_type, deal_date but different amounts)
    echo "\n======================================================================\n";
    echo "CHECK FOR SIMILAR DUPLICATES (same company, deal_type, date)\n";
    echo "======================================================================\n\n";

    $sql2 = "
        SELECT company_name, deal_type, deal_date, COUNT(*) as count, GROUP_CONCAT(CONCAT(id, ':', amount) ORDER BY id SEPARATOR ' | ') as details
        FROM deals 
        WHERE company_name IS NOT NULL AND deal_type IS NOT NULL AND deal_date IS NOT NULL
        GROUP BY company_name, deal_type, deal_date 
        HAVING count > 1 
        ORDER BY count DESC
        LIMIT 20
    ";

    $stmt2 = $db->query($sql2);
    $similar = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    if (count($similar) > 0) {
        echo "⚠️  Found " . count($similar) . " groups of similar duplicates:\n\n";
        foreach ($similar as $sim) {
            echo "   Company: " . $sim['company_name'] . "\n";
            echo "   Deal Type: " . $sim['deal_type'] . "\n";
            echo "   Date: " . $sim['deal_date'] . "\n";
            echo "   Count: " . $sim['count'] . "\n";
            echo "   Details: " . $sim['details'] . "\n";
            echo "\n";
        }
    } else {
        echo "✅ No similar duplicates found\n";
    }

    // Total count
    $totalStmt = $db->query("SELECT COUNT(*) as total FROM deals");
    $total = $totalStmt->fetch(PDO::FETCH_ASSOC);
    echo "\n📊 Total deals in database: " . $total['total'] . "\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

