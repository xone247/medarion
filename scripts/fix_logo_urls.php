<?php
/**
 * Fix logo URLs to use full API URLs
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
    echo "FIXING LOGO URLS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get all companies
    $stmt = $pdo->query("SELECT id, name, logo_url FROM companies");
    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updated = 0;
    $logoDir = __DIR__ . '/../public/uploads/company';
    
    foreach ($companies as $company) {
        $companyId = $company['id'];
        $name = $company['name'];
        $currentLogoUrl = $company['logo_url'];
        
        // Create safe filename
        $safeName = strtolower(preg_replace('/[^a-z0-9_-]/i', '_', $name));
        $logoFile = $safeName . '.png';
        $logoPath = $logoDir . '/' . $logoFile;
        
        // Check if logo file exists
        if (file_exists($logoPath)) {
            // Update with full API URL
            $newLogoUrl = 'https://api.medarion.africa/uploads/company/' . $logoFile;
            
            if ($currentLogoUrl !== $newLogoUrl) {
                $updateStmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE id = ?");
                $updateStmt->execute([$newLogoUrl, $companyId]);
                echo "  ✓ Updated {$name}: {$newLogoUrl}\n";
                $updated++;
            }
        } else {
            // Try alternative filename patterns
            $alternatives = [
                str_replace(' ', '_', strtolower($name)) . '.png',
                str_replace(' ', '-', strtolower($name)) . '.png',
                preg_replace('/[^a-z0-9]/i', '', strtolower($name)) . '.png',
            ];
            
            $found = false;
            foreach ($alternatives as $alt) {
                $altPath = $logoDir . '/' . $alt;
                if (file_exists($altPath)) {
                    $newLogoUrl = 'https://api.medarion.africa/uploads/company/' . $alt;
                    $updateStmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE id = ?");
                    $updateStmt->execute([$newLogoUrl, $companyId]);
                    echo "  ✓ Updated {$name}: {$newLogoUrl}\n";
                    $updated++;
                    $found = true;
                    break;
                }
            }
            
            if (!$found && !$currentLogoUrl) {
                echo "  ⊙ No logo found for {$name}\n";
            }
        }
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "Updated {$updated} logo URLs\n";
    echo str_repeat("=", 60) . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

