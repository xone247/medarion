<?php
/**
 * Final Verification of All Data
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
    echo "FINAL DATA VERIFICATION\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // 1. Regulatory Approvals
    echo "1. REGULATORY APPROVALS\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved, COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending, COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted, COUNT(CASE WHEN status = 'Under Review' THEN 1 END) as under_review, COUNT(CASE WHEN status IS NULL OR status = '' THEN 1 END) as empty FROM company_regulatory");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  Total: {$result['total']}\n";
    echo "  Approved: {$result['approved']}\n";
    echo "  Pending: {$result['pending']}\n";
    echo "  Submitted: {$result['submitted']}\n";
    echo "  Under Review: {$result['under_review']}\n";
    if ($result['empty'] > 0) {
        echo "  ⚠️  Empty status: {$result['empty']}\n";
        // Fix empty statuses
        $pdo->exec("UPDATE company_regulatory SET status = 'Pending' WHERE status IS NULL OR status = ''");
        echo "  ✓ Fixed empty statuses\n";
    }
    echo "\n";
    
    // 2. Regulatory Bodies
    echo "2. REGULATORY BODIES\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN website IS NOT NULL AND website != '' THEN 1 END) as with_website, COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as with_description, COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 END) as with_logo FROM regulatory_bodies");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  Total: {$result['total']}\n";
    echo "  With website: {$result['with_website']}\n";
    echo "  With description: {$result['with_description']}\n";
    echo "  With logo: {$result['with_logo']}\n";
    echo "\n";
    
    // 3. Investor Logos
    echo "3. INVESTOR LOGOS\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 END) as with_logo FROM investors");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  Total: {$result['total']}\n";
    echo "  With logo: {$result['with_logo']}\n";
    echo "\n";
    
    // 4. Company Logos
    echo "4. COMPANY LOGOS\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 END) as with_logo FROM companies");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  Total: {$result['total']}\n";
    echo "  With logo: {$result['with_logo']}\n";
    echo "\n";
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "VERIFICATION COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

