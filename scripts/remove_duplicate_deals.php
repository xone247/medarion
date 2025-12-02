<?php
/**
 * REMOVE DUPLICATE DEALS
 * 
 * This script removes duplicate deals from the database,
 * keeping only one record per unique combination of:
 * - company_name
 * - deal_type
 * - deal_date
 * - amount
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
    echo "REMOVE DUPLICATE DEALS\n";
    echo "======================================================================\n\n";

    // First, get all duplicate groups
    $sql = "
        SELECT company_name, deal_type, deal_date, amount, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id) as ids
        FROM deals 
        GROUP BY company_name, deal_type, deal_date, amount 
        HAVING count > 1 
        ORDER BY count DESC
    ";

    $stmt = $db->query($sql);
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($duplicates) === 0) {
        echo "✅ No duplicates found. Database is clean!\n";
        exit(0);
    }

    echo "📊 Found " . count($duplicates) . " groups of duplicates\n\n";

    $totalRemoved = 0;
    $removedIds = [];

    // For each duplicate group, keep the first ID and remove the rest
    foreach ($duplicates as $dup) {
        $ids = explode(',', $dup['ids']);
        $keepId = (int)$ids[0]; // Keep the first (lowest) ID
        $removeIds = array_slice($ids, 1); // Remove all others

        echo "   Company: " . $dup['company_name'] . "\n";
        echo "   Deal Type: " . $dup['deal_type'] . "\n";
        echo "   Date: " . $dup['deal_date'] . "\n";
        echo "   Amount: $" . number_format($dup['amount'], 2) . "\n";
        echo "   Keeping ID: " . $keepId . "\n";
        echo "   Removing IDs: " . implode(', ', $removeIds) . "\n";

        // Delete the duplicate records
        $placeholders = implode(',', array_fill(0, count($removeIds), '?'));
        $deleteSql = "DELETE FROM deals WHERE id IN ($placeholders)";
        $deleteStmt = $db->prepare($deleteSql);
        $deleteStmt->execute($removeIds);

        $removed = $deleteStmt->rowCount();
        $totalRemoved += $removed;
        $removedIds = array_merge($removedIds, $removeIds);

        echo "   ✅ Removed " . $removed . " duplicate(s)\n\n";
    }

    echo "======================================================================\n";
    echo "REMOVAL SUMMARY\n";
    echo "======================================================================\n\n";
    echo "✅ Total duplicate records removed: " . $totalRemoved . "\n";
    echo "📊 Removed IDs: " . implode(', ', $removedIds) . "\n\n";

    // Verify final count
    $countStmt = $db->query("SELECT COUNT(*) as total FROM deals");
    $total = $countStmt->fetch(PDO::FETCH_ASSOC);
    echo "📊 Final deals count: " . $total['total'] . "\n";

    // Verify no duplicates remain
    $verifyStmt = $db->query($sql);
    $remaining = $verifyStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($remaining) === 0) {
        echo "✅ Verification: No duplicates remain!\n";
    } else {
        echo "⚠️  Warning: " . count($remaining) . " duplicate groups still exist\n";
    }

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

