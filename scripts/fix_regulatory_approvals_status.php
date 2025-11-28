<?php
/**
 * Fix Regulatory Approvals Status Distribution
 * Ensures we have a good mix of Approved, Pending, Submitted, and Under Review statuses
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
    echo "FIXING REGULATORY APPROVALS STATUS DISTRIBUTION\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get current distribution
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM company_regulatory GROUP BY status");
    $current = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Current distribution:\n";
    foreach ($current as $row) {
        echo "  {$row['status']}: {$row['count']}\n";
    }
    echo "\n";
    
    // Get all approvals
    $allApprovals = $pdo->query("SELECT id, status FROM company_regulatory")->fetchAll(PDO::FETCH_ASSOC);
    
    // Target distribution: 40% Approved, 30% Pending, 20% Submitted, 10% Under Review
    $total = count($allApprovals);
    $targetApproved = round($total * 0.4);
    $targetPending = round($total * 0.3);
    $targetSubmitted = round($total * 0.2);
    $targetUnderReview = $total - $targetApproved - $targetPending - $targetSubmitted;
    
    echo "Target distribution:\n";
    echo "  Approved: {$targetApproved}\n";
    echo "  Pending: {$targetPending}\n";
    echo "  Submitted: {$targetSubmitted}\n";
    echo "  Under Review: {$targetUnderReview}\n\n";
    
    // Count current statuses
    $currentApproved = 0;
    $currentPending = 0;
    $currentSubmitted = 0;
    $currentUnderReview = 0;
    
    foreach ($allApprovals as $approval) {
        switch ($approval['status']) {
            case 'Approved': $currentApproved++; break;
            case 'Pending': $currentPending++; break;
            case 'Submitted': $currentSubmitted++; break;
            case 'Under Review': $currentUnderReview++; break;
        }
    }
    
    // Update statuses to meet targets - shuffle and assign
    $updateStmt = $pdo->prepare("UPDATE company_regulatory SET status = ? WHERE id = ?");
    
    // Shuffle approvals for random distribution
    shuffle($allApprovals);
    
    $updated = 0;
    $approvedCount = 0;
    $pendingCount = 0;
    $submittedCount = 0;
    $underReviewCount = 0;
    
    foreach ($allApprovals as $approval) {
        $newStatus = null;
        
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
            // Default to Pending if all targets met
            $newStatus = 'Pending';
        }
        
        if ($newStatus && strtolower($newStatus) !== strtolower($approval['status'])) {
            $updateStmt->execute([$newStatus, $approval['id']]);
            $updated++;
        }
    }
    
    echo "✓ Updated {$updated} approval statuses\n\n";
    
    // Final distribution
    $finalStmt = $pdo->query("SELECT status, COUNT(*) as count FROM company_regulatory GROUP BY status ORDER BY count DESC");
    $final = $finalStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Final distribution:\n";
    foreach ($final as $row) {
        echo "  {$row['status']}: {$row['count']}\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "STATUS DISTRIBUTION FIX COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

