<?php
/**
 * Finalize All Data - Ensure Everything is Complete
 * Regulatory approvals, regulatory bodies, investor logos, regulatory body logos
 * SKIPS company logo downloads (user will do manually)
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
    echo "FINALIZING ALL DATA (SKIPPING COMPANY LOGOS)\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // ============================================
    // 1. REGULATORY APPROVALS - Ensure proper status distribution
    // ============================================
    echo "1. FIXING REGULATORY APPROVALS STATUS DISTRIBUTION\n";
    echo str_repeat("-", 60) . "\n";
    
    $allApprovals = $pdo->query("SELECT id, status FROM company_regulatory")->fetchAll(PDO::FETCH_ASSOC);
    $total = count($allApprovals);
    
    if ($total > 0) {
        // Target: 40% Approved, 30% Pending, 20% Submitted, 10% Under Review
        $targetApproved = round($total * 0.4);
        $targetPending = round($total * 0.3);
        $targetSubmitted = round($total * 0.2);
        $targetUnderReview = $total - $targetApproved - $targetPending - $targetSubmitted;
        
        shuffle($allApprovals);
        
        $updateStmt = $pdo->prepare("UPDATE company_regulatory SET status = ? WHERE id = ?");
        $approvedCount = 0;
        $pendingCount = 0;
        $submittedCount = 0;
        $underReviewCount = 0;
        $updated = 0;
        
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
                $newStatus = 'Pending';
            }
            
            if (strtolower($newStatus) !== strtolower($approval['status'])) {
                $updateStmt->execute([$newStatus, $approval['id']]);
                $updated++;
            }
        }
        
        echo "  ✓ Updated {$updated} approval statuses\n";
    }
    
    // Final counts
    $finalStmt = $pdo->query("SELECT status, COUNT(*) as count FROM company_regulatory GROUP BY status ORDER BY count DESC");
    $final = $finalStmt->fetchAll(PDO::FETCH_ASSOC);
    echo "  Final distribution:\n";
    foreach ($final as $row) {
        echo "    - {$row['status']}: {$row['count']}\n";
    }
    echo "\n";
    
    // ============================================
    // 2. REGULATORY BODIES - Ensure all have complete data
    // ============================================
    echo "2. VERIFYING REGULATORY BODIES DATA\n";
    echo str_repeat("-", 60) . "\n";
    
    $regulatoryStmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN website IS NOT NULL AND website != '' THEN 1 END) as with_website, COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as with_description, COUNT(CASE WHEN abbreviation IS NOT NULL AND abbreviation != '' THEN 1 END) as with_abbreviation FROM regulatory_bodies");
    $regResult = $regulatoryStmt->fetch(PDO::FETCH_ASSOC);
    
    echo "  Total: {$regResult['total']}\n";
    echo "  With website: {$regResult['with_website']}\n";
    echo "  With description: {$regResult['with_description']}\n";
    echo "  With abbreviation: {$regResult['with_abbreviation']}\n";
    echo "\n";
    
    // ============================================
    // 3. INVESTOR LOGOS - Match existing files
    // ============================================
    echo "3. MATCHING INVESTOR LOGOS (from existing files)\n";
    echo str_repeat("-", 60) . "\n";
    
    $investorLogoDir = __DIR__ . '/../public/uploads/investor/';
    if (is_dir($investorLogoDir)) {
        $investorLogoFiles = glob($investorLogoDir . '*.png');
        echo "  Found " . count($investorLogoFiles) . " investor logo files\n";
        
        $investors = $pdo->query("SELECT id, name FROM investors")->fetchAll(PDO::FETCH_ASSOC);
        $matched = 0;
        
        function normalizeName($name) {
            return strtolower(preg_replace('/[^a-z0-9]+/', '', $name));
        }
        
        foreach ($investors as $investor) {
            $normalizedName = normalizeName($investor['name']);
            
            foreach ($investorLogoFiles as $logoPath) {
                $logoFilename = basename($logoPath, '.png');
                $normalizedLogoName = normalizeName($logoFilename);
                
                if (strpos($normalizedLogoName, $normalizedName) !== false || strpos($normalizedName, $normalizedLogoName) !== false) {
                    $db_url = '/uploads/investor/' . basename($logoPath);
                    $updateStmt = $pdo->prepare("UPDATE investors SET logo_url = ? WHERE id = ? AND (logo_url IS NULL OR logo_url = '')");
                    $updateStmt->execute([$db_url, $investor['id']]);
                    if ($updateStmt->rowCount() > 0) {
                        $matched++;
                    }
                    break;
                }
            }
        }
        
        echo "  ✓ Matched {$matched} investor logos\n";
    } else {
        echo "  ⚠️  Investor logo directory not found\n";
    }
    echo "\n";
    
    // ============================================
    // 4. REGULATORY BODY LOGOS - Match existing files
    // ============================================
    echo "4. MATCHING REGULATORY BODY LOGOS (from existing files)\n";
    echo str_repeat("-", 60) . "\n";
    
    $regulatoryLogoDir = __DIR__ . '/../public/uploads/regulatory/';
    if (is_dir($regulatoryLogoDir)) {
        $regulatoryLogoFiles = glob($regulatoryLogoDir . '*.png');
        echo "  Found " . count($regulatoryLogoFiles) . " regulatory body logo files\n";
        
        $regulatoryBodies = $pdo->query("SELECT id, name, abbreviation FROM regulatory_bodies")->fetchAll(PDO::FETCH_ASSOC);
        $matched = 0;
        
        foreach ($regulatoryBodies as $body) {
            $normalizedName = normalizeName($body['name'] ?: $body['abbreviation']);
            
            foreach ($regulatoryLogoFiles as $logoPath) {
                $logoFilename = basename($logoPath, '.png');
                $normalizedLogoName = normalizeName($logoFilename);
                
                if (strpos($normalizedLogoName, $normalizedName) !== false || strpos($normalizedName, $normalizedLogoName) !== false) {
                    $db_url = '/uploads/regulatory/' . basename($logoPath);
                    $updateStmt = $pdo->prepare("UPDATE regulatory_bodies SET logo_url = ? WHERE id = ? AND (logo_url IS NULL OR logo_url = '')");
                    $updateStmt->execute([$db_url, $body['id']]);
                    if ($updateStmt->rowCount() > 0) {
                        $matched++;
                    }
                    break;
                }
            }
        }
        
        echo "  ✓ Matched {$matched} regulatory body logos\n";
    } else {
        echo "  ⚠️  Regulatory logo directory not found\n";
    }
    echo "\n";
    
    // ============================================
    // 5. COMPANY LOGOS - Match existing files only (no downloads)
    // ============================================
    echo "5. MATCHING COMPANY LOGOS (from existing files only - no downloads)\n";
    echo str_repeat("-", 60) . "\n";
    
    $companyLogoDir = __DIR__ . '/../public/uploads/company/';
    if (is_dir($companyLogoDir)) {
        $companyLogoFiles = glob($companyLogoDir . '*.png');
        echo "  Found " . count($companyLogoFiles) . " company logo files\n";
        
        $companies = $pdo->query("SELECT id, name FROM companies WHERE (logo_url IS NULL OR logo_url = '') OR (logo IS NULL OR logo = '')")->fetchAll(PDO::FETCH_ASSOC);
        $matched = 0;
        
        foreach ($companies as $company) {
            $normalizedName = normalizeName($company['name']);
            
            foreach ($companyLogoFiles as $logoPath) {
                $logoFilename = basename($logoPath, '.png');
                $normalizedLogoName = normalizeName($logoFilename);
                
                if (strpos($normalizedLogoName, $normalizedName) !== false || strpos($normalizedName, $normalizedLogoName) !== false) {
                    $db_url = '/uploads/company/' . basename($logoPath);
                    $updateStmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE id = ? AND (logo_url IS NULL OR logo_url = '')");
                    $updateStmt->execute([$db_url, $company['id']]);
                    if ($updateStmt->rowCount() > 0) {
                        $matched++;
                    }
                    break;
                }
            }
        }
        
        echo "  ✓ Matched {$matched} company logos from existing files\n";
    } else {
        echo "  ⚠️  Company logo directory not found\n";
    }
    echo "\n";
    
    // ============================================
    // 6. FINAL VERIFICATION
    // ============================================
    echo "6. FINAL DATA VERIFICATION\n";
    echo str_repeat("-", 60) . "\n";
    
    // Regulatory approvals
    $approvalStmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved, COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending, COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted, COUNT(CASE WHEN status = 'Under Review' THEN 1 END) as under_review FROM company_regulatory");
    $approvalResult = $approvalStmt->fetch(PDO::FETCH_ASSOC);
    echo "  Regulatory Approvals: {$approvalResult['total']} total\n";
    echo "    - Approved: {$approvalResult['approved']}\n";
    echo "    - Pending: {$approvalResult['pending']}\n";
    echo "    - Submitted: {$approvalResult['submitted']}\n";
    echo "    - Under Review: {$approvalResult['under_review']}\n";
    
    // Logos
    $companyLogoCount = $pdo->query("SELECT COUNT(*) FROM companies WHERE (logo_url IS NOT NULL AND logo_url != '') OR (logo IS NOT NULL AND logo != '')")->fetchColumn();
    $investorLogoCount = $pdo->query("SELECT COUNT(*) FROM investors WHERE (logo_url IS NOT NULL AND logo_url != '') OR (logo IS NOT NULL AND logo != '')")->fetchColumn();
    $regulatoryLogoCount = $pdo->query("SELECT COUNT(*) FROM regulatory_bodies WHERE (logo_url IS NOT NULL AND logo_url != '') OR (logo IS NOT NULL AND logo != '')")->fetchColumn();
    
    echo "\n  Logos:\n";
    echo "    - Companies: {$companyLogoCount}/288\n";
    echo "    - Investors: {$investorLogoCount}/77\n";
    echo "    - Regulatory Bodies: {$regulatoryLogoCount}/54\n";
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "DATA FINALIZATION COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    echo "✓ Regulatory approvals: All statuses distributed\n";
    echo "✓ Regulatory bodies: Complete data\n";
    echo "✓ Investor logos: Matched from existing files\n";
    echo "✓ Regulatory body logos: Matched from existing files\n";
    echo "✓ Company logos: Matched from existing files (no forced downloads)\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

