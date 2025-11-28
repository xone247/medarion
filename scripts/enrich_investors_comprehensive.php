<?php
/**
 * Comprehensive investor data enrichment
 * Calculate: total invested, deal count, avg deal size, sectors, geographic focus
 * Download logos for all investors
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
    echo "COMPREHENSIVE INVESTOR DATA ENRICHMENT\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get all investors
    $investors = $pdo->query("SELECT id, name, headquarters FROM investors")->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($investors) . " investors to enrich\n\n";
    
    $enriched = 0;
    
    foreach ($investors as $investor) {
        $investor_id = $investor['id'];
        $investor_name = $investor['name'];
        
        echo "Enriching: {$investor_name}...\n";
        
        // Calculate total invested from deals
        $totalInvestedStmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(amount), 0) as total_invested,
                COUNT(*) as deal_count,
                COALESCE(AVG(amount), 0) as avg_deal_size
            FROM deals 
            WHERE lead_investor = ? OR participants LIKE ?
        ");
        $searchPattern = "%{$investor_name}%";
        $totalInvestedStmt->execute([$investor_name, $searchPattern]);
        $stats = $totalInvestedStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get sectors
        $sectorsStmt = $pdo->prepare("
            SELECT DISTINCT sector 
            FROM deals 
            WHERE (lead_investor = ? OR participants LIKE ?) 
            AND sector IS NOT NULL 
            AND sector != ''
            LIMIT 10
        ");
        $sectorsStmt->execute([$investor_name, $searchPattern]);
        $sectors = $sectorsStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get geographic focus (countries)
        $countriesStmt = $pdo->prepare("
            SELECT DISTINCT country 
            FROM deals 
            WHERE (lead_investor = ? OR participants LIKE ?) 
            AND country IS NOT NULL 
            AND country != ''
            LIMIT 15
        ");
        $countriesStmt->execute([$investor_name, $searchPattern]);
        $countries = $countriesStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Update investor with enriched data
        $updateStmt = $pdo->prepare("
            UPDATE investors SET
                total_invested = ?,
                deal_count = ?,
                avg_deal_size = ?,
                sectors = ?,
                geographic_focus = ?
            WHERE id = ?
        ");
        
        $updateStmt->execute([
            $stats['total_invested'] ?? 0,
            $stats['deal_count'] ?? 0,
            $stats['avg_deal_size'] ?? 0,
            json_encode($sectors),
            json_encode($countries),
            $investor_id
        ]);
        
        echo "  ✓ Total invested: $" . number_format($stats['total_invested'] ?? 0) . "\n";
        echo "  ✓ Deal count: " . ($stats['deal_count'] ?? 0) . "\n";
        echo "  ✓ Avg deal size: $" . number_format($stats['avg_deal_size'] ?? 0) . "\n";
        echo "  ✓ Sectors: " . count($sectors) . "\n";
        echo "  ✓ Geographic focus: " . count($countries) . " countries\n";
        
        $enriched++;
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "INVESTOR ENRICHMENT COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    echo "Enriched: $enriched investors\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

