<?php
/**
 * Fix Logo Filename Mismatches
 * Matches database logo URLs with actual uploaded files
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
    echo "FIXING LOGO FILENAME MISMATCHES\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get all companies with logos
    $companies = $pdo->query("
        SELECT id, name, logo_url 
        FROM companies 
        WHERE logo_url IS NOT NULL 
        AND logo_url != ''
        AND logo_url LIKE '%/company/%'
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($companies) . " companies with logo URLs\n\n";
    
    // Get list of actual logo files
    $logoDir = __DIR__ . '/../public/uploads/company/';
    $actualFiles = [];
    if (is_dir($logoDir)) {
        $files = glob($logoDir . '*.{png,jpg,jpeg,svg}', GLOB_BRACE);
        foreach ($files as $file) {
            $actualFiles[] = basename($file);
        }
    }
    
    echo "Found " . count($actualFiles) . " actual logo files\n\n";
    
    // Function to normalize company name for matching
    function normalizeForMatching($name) {
        $name = strtolower($name);
        $name = preg_replace('/[^a-z0-9]/', '', $name);
        return $name;
    }
    
    // Create mapping of normalized names to actual files
    $fileMap = [];
    foreach ($actualFiles as $file) {
        $normalized = normalizeForMatching(pathinfo($file, PATHINFO_FILENAME));
        $fileMap[$normalized] = $file;
    }
    
    $updateStmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE id = ?");
    $baseUrl = 'https://api.medarion.africa/uploads/company/';
    $fixed = 0;
    $notFound = 0;
    
    foreach ($companies as $company) {
        // Extract filename from URL
        $currentUrl = $company['logo_url'];
        $currentFile = basename(parse_url($currentUrl, PHP_URL_PATH));
        
        // Check if current file exists
        if (in_array($currentFile, $actualFiles)) {
            // File exists, no need to fix
            continue;
        }
        
        // Try to find matching file by company name
        $normalizedName = normalizeForMatching($company['name']);
        $matchedFile = null;
        
        // Direct match
        if (isset($fileMap[$normalizedName])) {
            $matchedFile = $fileMap[$normalizedName];
        } else {
            // Try partial matches
            foreach ($fileMap as $normalized => $file) {
                if (strpos($normalized, $normalizedName) !== false || strpos($normalizedName, $normalized) !== false) {
                    $matchedFile = $file;
                    break;
                }
            }
        }
        
        if ($matchedFile) {
            $newUrl = $baseUrl . $matchedFile;
            $updateStmt->execute([$newUrl, $company['id']]);
            $fixed++;
            echo "  ✓ {$company['name']}: {$currentFile} -> {$matchedFile}\n";
        } else {
            $notFound++;
            echo "  ✗ {$company['name']}: No matching file found for {$currentFile}\n";
        }
    }
    
    echo "\n✓ Fixed {$fixed} logo URLs\n";
    echo "✗ Could not match {$notFound} logos\n\n";
    
    // Also fix common mismatches manually
    $commonFixes = [
        'mPharma' => 'mpharma.png',
        'LifeBank' => 'lifebank.png',
        'Dokkan Afkar' => 'dokkan_afkar.png',
        'Aga Khan Hospital' => 'aga_khan_hospital.png',
        'Cipla Medpro' => 'cipla_medpro.png',
        'Medic Mobile' => 'medic_mobile.png',
    ];
    
    echo "Applying common fixes...\n";
    foreach ($commonFixes as $companyName => $correctFile) {
        if (in_array($correctFile, $actualFiles)) {
            $stmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE name = ? AND logo_url IS NOT NULL");
            $newUrl = $baseUrl . $correctFile;
            $stmt->execute([$newUrl, $companyName]);
            echo "  ✓ {$companyName} -> {$correctFile}\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

