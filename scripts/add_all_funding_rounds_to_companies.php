<?php
/**
 * Extract ALL funding rounds from deals table and add to companies
 * This ensures every company has complete funding history
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
    echo "EXTRACTING ALL FUNDING ROUNDS FROM DEALS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get all companies
    $companies = $pdo->query("SELECT id, name FROM companies")->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($companies) . " companies\n\n";
    
    // Load comprehensive company data
    $comprehensiveData = [];
    if (file_exists(__DIR__ . '/../comprehensive_company_data.json')) {
        $comprehensiveData = json_decode(file_get_contents(__DIR__ . '/../comprehensive_company_data.json'), true);
        $comprehensiveMap = [];
        foreach ($comprehensiveData as $data) {
            $comprehensiveMap[$data['name']] = $data;
        }
    }
    
    $updated = 0;
    
    foreach ($companies as $company) {
        $company_id = $company['id'];
        $company_name = $company['name'];
        
        // Get all deals for this company
        $dealsStmt = $pdo->prepare("
            SELECT deal_type, amount, deal_date, lead_investor, participants, description
            FROM deals 
            WHERE company_id = ? OR company_name = ?
            ORDER BY deal_date DESC
        ");
        $dealsStmt->execute([$company_id, $company_name]);
        $deals = $dealsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($deals) > 0) {
            // Update comprehensive data if exists
            if (isset($comprehensiveMap[$company_name])) {
                $funding_rounds = [];
                foreach ($deals as $deal) {
                    if ($deal['amount'] && $deal['amount'] > 0) {
                        $funding_rounds[] = [
                            'type' => $deal['deal_type'] ?? 'seed',
                            'amount' => floatval($deal['amount']),
                            'date' => $deal['deal_date'] ? strval($deal['deal_date']) : null,
                            'investor' => $deal['lead_investor'] ?? ''
                        ];
                    }
                }
                $comprehensiveMap[$company_name]['funding_rounds'] = $funding_rounds;
                $updated++;
            }
        }
    }
    
    // Save updated comprehensive data
    $comprehensiveData = array_values($comprehensiveMap);
    file_put_contents(__DIR__ . '/../comprehensive_company_data.json', json_encode($comprehensiveData, JSON_PRETTY_PRINT));
    
    echo "Updated funding rounds for $updated companies\n";
    echo "Total funding rounds extracted: " . array_sum(array_map(function($c) { return count($c['funding_rounds'] ?? []); }, $comprehensiveData)) . "\n";
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "FUNDING ROUNDS EXTRACTION COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

