<?php
/**
 * Match logos to investors and other entities
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
    echo "MATCHING LOGOS TO INVESTORS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Match investor logos
    $investorLogoDir = __DIR__ . '/../public/uploads/investor';
    $investorLogos = [];
    if (is_dir($investorLogoDir)) {
        $files = scandir($investorLogoDir);
        foreach ($files as $file) {
            if (in_array(pathinfo($file, PATHINFO_EXTENSION), ['png', 'jpg', 'jpeg', 'svg'])) {
                $investorLogos[] = $file;
            }
        }
    }
    
    echo "Found " . count($investorLogos) . " investor logo files\n\n";
    
    $matched = 0;
    foreach ($investorLogos as $logoFile) {
        $baseName = pathinfo($logoFile, PATHINFO_FILENAME);
        $investorName = str_replace(['_', '-'], ' ', $baseName);
        $investorName = ucwords($investorName);
        
        $updateStmt = $pdo->prepare("
            UPDATE investors 
            SET logo = ? 
            WHERE (name LIKE ? OR name = ?) 
            AND (logo IS NULL OR logo = '')
            LIMIT 1
        ");
        $logoUrl = 'https://api.medarion.africa/uploads/investor/' . $logoFile;
        $updateStmt->execute([$logoUrl, "%$investorName%", $investorName]);
        if ($updateStmt->rowCount() > 0) {
            echo "  ✓ Matched logo for: $investorName\n";
            $matched++;
        }
    }
    
    echo "\n✓ Matched $matched investor logos\n\n";
    
    // Match regulatory body logos
    echo "Matching regulatory body logos...\n";
    $regulatoryLogoDir = __DIR__ . '/../public/uploads/regulatory';
    $regulatoryLogos = [];
    if (is_dir($regulatoryLogoDir)) {
        $files = scandir($regulatoryLogoDir);
        foreach ($files as $file) {
            if (in_array(pathinfo($file, PATHINFO_EXTENSION), ['png', 'jpg', 'jpeg', 'svg'])) {
                $regulatoryLogos[] = $file;
            }
        }
    }
    
    echo "Found " . count($regulatoryLogos) . " regulatory logo files\n\n";
    
    $matchedReg = 0;
    foreach ($regulatoryLogos as $logoFile) {
        $baseName = pathinfo($logoFile, PATHINFO_FILENAME);
        $regName = str_replace(['_', '-'], ' ', $baseName);
        $regName = ucwords($regName);
        
        $updateStmt = $pdo->prepare("
            UPDATE regulatory_bodies 
            SET logo_url = ? 
            WHERE (name LIKE ? OR name = ?) 
            AND (logo_url IS NULL OR logo_url = '')
            LIMIT 1
        ");
        $logoUrl = 'https://api.medarion.africa/uploads/regulatory/' . $logoFile;
        $updateStmt->execute([$logoUrl, "%$regName%", $regName]);
        if ($updateStmt->rowCount() > 0) {
            echo "  ✓ Matched logo for: $regName\n";
            $matchedReg++;
        }
    }
    
    echo "\n✓ Matched $matchedReg regulatory body logos\n\n";
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "LOGO MATCHING COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

