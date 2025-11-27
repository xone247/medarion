<?php
/**
 * Comprehensive logo matching for all entities
 * Matches logos to companies, investors, and regulatory bodies
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
    echo "COMPREHENSIVE LOGO MATCHING\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Function to match logos
    function matchLogos($pdo, $table, $nameColumn, $logoColumn, $logoDir, $baseUrl) {
        $logos = [];
        if (is_dir($logoDir)) {
            $files = scandir($logoDir);
            foreach ($files as $file) {
                if (in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['png', 'jpg', 'jpeg', 'svg'])) {
                    $logos[] = $file;
                }
            }
        }
        
        $matched = 0;
        foreach ($logos as $logoFile) {
            $baseName = pathinfo($logoFile, PATHINFO_FILENAME);
            // Try multiple name variations
            $variations = [
                str_replace(['_', '-'], ' ', $baseName),
                str_replace(['_', '-'], '', $baseName),
                ucwords(str_replace(['_', '-'], ' ', $baseName)),
                strtolower($baseName),
                strtoupper($baseName)
            ];
            
            foreach ($variations as $name) {
                $updateStmt = $pdo->prepare("
                    UPDATE {$table} 
                    SET {$logoColumn} = ? 
                    WHERE ({$nameColumn} LIKE ? OR {$nameColumn} = ? OR LOWER({$nameColumn}) = LOWER(?)) 
                    AND ({$logoColumn} IS NULL OR {$logoColumn} = '')
                    LIMIT 1
                ");
                $logoUrl = $baseUrl . '/' . $logoFile;
                $updateStmt->execute([$logoUrl, "%$name%", $name, $name]);
                if ($updateStmt->rowCount() > 0) {
                    $matched++;
                    break;
                }
            }
        }
        
        return ['total' => count($logos), 'matched' => $matched];
    }
    
    // Match company logos
    echo "Matching company logos...\n";
    $companyResult = matchLogos(
        $pdo, 
        'companies', 
        'name', 
        'logo_url', 
        __DIR__ . '/../public/uploads/company',
        'https://api.medarion.africa/uploads/company'
    );
    echo "  Found {$companyResult['total']} logo files\n";
    echo "  Matched {$companyResult['matched']} logos\n\n";
    
    // Match investor logos
    echo "Matching investor logos...\n";
    $investorResult = matchLogos(
        $pdo, 
        'investors', 
        'name', 
        'logo', 
        __DIR__ . '/../public/uploads/investor',
        'https://api.medarion.africa/uploads/investor'
    );
    echo "  Found {$investorResult['total']} logo files\n";
    echo "  Matched {$investorResult['matched']} logos\n\n";
    
    // Match regulatory body logos
    echo "Matching regulatory body logos...\n";
    $regulatoryResult = matchLogos(
        $pdo, 
        'regulatory_bodies', 
        'name', 
        'logo_url', 
        __DIR__ . '/../public/uploads/regulatory',
        'https://api.medarion.africa/uploads/regulatory'
    );
    echo "  Found {$regulatoryResult['total']} logo files\n";
    echo "  Matched {$regulatoryResult['matched']} logos\n\n";
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "LOGO MATCHING COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

