<?php
/**
 * Fix All Regulatory Approval Statuses
 * Ensures ALL 168 approvals have proper status values
 */

require_once __DIR__ . '/../config/database.php';

$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
if (!empty($config['port'])) {
    $dsn .= ";port={$config['port']}";
}

try {
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Fixing all regulatory approval statuses...\n";
    
    // First, set all empty/null statuses to Pending
    $pdo->exec("UPDATE company_regulatory SET status = 'Pending' WHERE status IS NULL OR status = ''");
    
    // Get all approvals
    $allApprovals = $pdo->query("SELECT id FROM company_regulatory ORDER BY id")->fetchAll(PDO::FETCH_COLUMN);
    $total = count($allApprovals);
    
    // Target distribution
    $targetApproved = round($total * 0.4);
    $targetPending = round($total * 0.3);
    $targetSubmitted = round($total * 0.2);
    $targetUnderReview = $total - $targetApproved - $targetPending - $targetSubmitted;
    
    $updateStmt = $pdo->prepare("UPDATE company_regulatory SET status = ? WHERE id = ?");
    
    $counts = ['Approved' => 0, 'Pending' => 0, 'Submitted' => 0, 'Under Review' => 0];
    
    foreach ($allApprovals as $id) {
        if ($counts['Approved'] < $targetApproved) {
            $updateStmt->execute(['Approved', $id]);
            $counts['Approved']++;
        } elseif ($counts['Pending'] < $targetPending) {
            $updateStmt->execute(['Pending', $id]);
            $counts['Pending']++;
        } elseif ($counts['Submitted'] < $targetSubmitted) {
            $updateStmt->execute(['Submitted', $id]);
            $counts['Submitted']++;
        } elseif ($counts['Under Review'] < $targetUnderReview) {
            $updateStmt->execute(['Under Review', $id]);
            $counts['Under Review']++;
        }
    }
    
    echo "✓ Fixed all {$total} regulatory approval statuses\n";
    echo "  Approved: {$counts['Approved']}\n";
    echo "  Pending: {$counts['Pending']}\n";
    echo "  Submitted: {$counts['Submitted']}\n";
    echo "  Under Review: {$counts['Under Review']}\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

