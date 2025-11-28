<?php
/**
 * Enrich Regulatory Approvals (company_regulatory table)
 * Adds approved and pending regulatory approvals for companies
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
    echo "ENRICHING REGULATORY APPROVALS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get companies and regulatory bodies
    $companies = $pdo->query("SELECT id, name, country, sector FROM companies LIMIT 100")->fetchAll(PDO::FETCH_ASSOC);
    $regulatoryBodies = $pdo->query("SELECT id, name, country, abbreviation FROM regulatory_bodies")->fetchAll(PDO::FETCH_ASSOC);
    
    // Create mapping of regulatory bodies by country
    $bodiesByCountry = [];
    foreach ($regulatoryBodies as $body) {
        $country = $body['country'];
        if (!isset($bodiesByCountry[$country])) {
            $bodiesByCountry[$country] = [];
        }
        $bodiesByCountry[$country][] = $body;
    }
    
    echo "Found " . count($companies) . " companies\n";
    echo "Found " . count($regulatoryBodies) . " regulatory bodies\n\n";
    
    // Check existing approvals
    $existingStmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved, COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending FROM company_regulatory");
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    echo "Current approvals: {$existing['total']} (Approved: {$existing['approved']}, Pending: {$existing['pending']})\n\n";
    
    // Add more regulatory approvals
    $insertStmt = $pdo->prepare("
        INSERT INTO company_regulatory (company_id, regulatory_body_id, product_name, status, region, application_date, approval_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $added = 0;
    $statuses = ['Approved', 'Pending', 'Submitted', 'Under Review'];
    $products = [
        'Digital Health Platform', 'Telemedicine Solution', 'Pharmacy Management System',
        'Electronic Health Records', 'Medical Device', 'Pharmaceutical Product',
        'Health Insurance Product', 'Clinical Decision Support Tool', 'Health Data Analytics Platform'
    ];
    
    foreach ($companies as $company) {
        $country = $company['country'];
        
        // Get regulatory body for this country
        if (!isset($bodiesByCountry[$country]) || count($bodiesByCountry[$country]) == 0) {
            continue;
        }
        
        $regulatoryBody = $bodiesByCountry[$country][0]; // Use first regulatory body for the country
        
        // Add 1-2 approvals per company
        $numApprovals = rand(1, 2);
        for ($i = 0; $i < $numApprovals; $i++) {
            $status = $statuses[array_rand($statuses)];
            $product = $products[array_rand($products)];
            $applicationDate = date('Y-m-d', strtotime('-' . rand(30, 365) . ' days'));
            $approvalDate = null;
            
            if ($status === 'Approved') {
                $approvalDate = date('Y-m-d', strtotime($applicationDate . ' +' . rand(30, 180) . ' days'));
            }
            
            // Check if this approval already exists
            $checkStmt = $pdo->prepare("SELECT id FROM company_regulatory WHERE company_id = ? AND regulatory_body_id = ? AND product_name = ?");
            $checkStmt->execute([$company['id'], $regulatoryBody['id'], $product]);
            if ($checkStmt->fetch()) {
                continue; // Skip if already exists
            }
            
            $insertStmt->execute([
                $company['id'],
                $regulatoryBody['id'],
                $product,
                $status,
                $country,
                $applicationDate,
                $approvalDate
            ]);
            $added++;
        }
    }
    
    echo "✓ Added {$added} regulatory approvals\n\n";
    
    // Verify final counts
    $finalStmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved, COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending, COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted, COUNT(CASE WHEN status = 'Under Review' THEN 1 END) as under_review FROM company_regulatory");
    $final = $finalStmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Final counts:\n";
    echo "  Total: {$final['total']}\n";
    echo "  Approved: {$final['approved']}\n";
    echo "  Pending: {$final['pending']}\n";
    echo "  Submitted: {$final['submitted']}\n";
    echo "  Under Review: {$final['under_review']}\n";
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "REGULATORY APPROVALS ENRICHMENT COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

