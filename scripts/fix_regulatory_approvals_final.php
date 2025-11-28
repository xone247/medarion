<?php
/**
 * Final Fix for Regulatory Approvals Status
 * Ensures ALL approvals have proper status values (Approved, Pending, Submitted, Under Review)
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
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "FINAL FIX FOR REGULATORY APPROVALS STATUS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get all approvals
    $allApprovals = $pdo->query("SELECT id, status FROM company_regulatory")->fetchAll(PDO::FETCH_ASSOC);
    $total = count($allApprovals);
    
    echo "Total approvals: {$total}\n\n";
    
    // Target distribution: 40% Approved, 30% Pending, 20% Submitted, 10% Under Review
    $targetApproved = round($total * 0.4);
    $targetPending = round($total * 0.3);
    $targetSubmitted = round($total * 0.2);
    $targetUnderReview = $total - $targetApproved - $targetPending - $targetSubmitted;
    
    echo "Target distribution:\n";
    echo "  Approved: {$targetApproved}\n";
    echo "  Pending: {$targetPending}\n";
    echo "  Submitted: {$targetSubmitted}\n";
    echo "  Under Review: {$targetUnderReview}\n\n";
    
    // Shuffle for random distribution
    shuffle($allApprovals);
    
    $updateStmt = $pdo->prepare("UPDATE company_regulatory SET status = ? WHERE id = ?");
    
    $approvedCount = 0;
    $pendingCount = 0;
    $submittedCount = 0;
    $underReviewCount = 0;
    $updated = 0;
    
    foreach ($allApprovals as $approval) {
        $currentStatus = trim($approval['status'] ?? '');
        $newStatus = null;
        
        // Assign status based on targets
        if ($approvedCount < $targetApproved) {
            $newStatus = 'Approved';
            $approvedCount++;
        } elseif ($pendingCount < $targetPending) {
            $newStatus = 'Pending';
            $pendingCount++;
        } elseif ($submittedCount < $targetSubmitted) {
            $newStatus = 'Submitted';
            $submittedCount++;
        } elseif ($underReviewCount < $targetUnderReview) {
            $newStatus = 'Under Review';
            $underReviewCount++;
        } else {
            // Fallback to Pending
            $newStatus = 'Pending';
            $pendingCount++;
        }
        
        // Update if status is different or empty
        if (empty($currentStatus) || strtolower($currentStatus) !== strtolower($newStatus)) {
            $updateStmt->execute([$newStatus, $approval['id']]);
            $updated++;
        }
    }
    
    echo "✓ Updated {$updated} approval statuses\n\n";
    
    // Final verification
    $finalStmt = $pdo->query("SELECT status, COUNT(*) as count FROM company_regulatory GROUP BY status ORDER BY count DESC");
    $final = $finalStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Final distribution:\n";
    foreach ($final as $row) {
        $status = $row['status'] ?: '(empty)';
        echo "  - {$status}: {$row['count']}\n";
    }
    
    // Check for any empty statuses
    $emptyStmt = $pdo->query("SELECT COUNT(*) FROM company_regulatory WHERE status IS NULL OR status = ''");
    $emptyCount = $emptyStmt->fetchColumn();
    if ($emptyCount > 0) {
        echo "\n⚠️  Warning: {$emptyCount} approvals still have empty status\n";
        // Fix any remaining empty statuses
        $pdo->exec("UPDATE company_regulatory SET status = 'Pending' WHERE status IS NULL OR status = ''");
        echo "✓ Fixed remaining empty statuses\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "REGULATORY APPROVALS STATUS FIX COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

