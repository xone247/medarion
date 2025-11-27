<?php
/**
 * Simple PHP script to download company logos
 * Uses cURL to download logos and updates database
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
    
    // Create upload directory
    $uploadDir = __DIR__ . '/../public/uploads/company';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "DOWNLOADING COMPANY LOGOS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get companies without logos
    $stmt = $pdo->query("SELECT id, name, website FROM companies WHERE logo_url IS NULL OR logo_url = ''");
    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($companies) . " companies without logos\n\n";
    
    $downloaded = 0;
    $failed = 0;
    
    foreach ($companies as $idx => $company) {
        $name = $company['name'];
        $website = $company['website'];
        $companyId = $company['id'];
        
        echo "[" . ($idx + 1) . "/" . count($companies) . "] {$name}... ";
        
        // Create safe filename
        $safeName = preg_replace('/[^a-z0-9_-]/i', '_', strtolower($name));
        $filename = $safeName . '.png';
        $savePath = $uploadDir . '/' . $filename;
        
        // Skip if already exists
        if (file_exists($savePath)) {
            $logoUrl = "https://api.medarion.africa/uploads/company/{$filename}";
            $updateStmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE id = ?");
            if ($updateStmt->execute([$logoUrl, $companyId])) {
                echo "✓ already exists, updated DB\n";
                $downloaded++;
            }
            continue;
        }
        
        // Try to download logo
        $logoUrl = null;
        
        if ($website) {
            // Clean website URL
            $website = trim($website);
            if (!preg_match('/^https?:\/\//', $website)) {
                $website = 'https://' . $website;
            }
            
            $parsed = parse_url($website);
            $domain = $parsed['host'] ?? '';
            
            // Try common logo URLs
            $logoUrls = [
                $website . '/logo.png',
                $website . '/logo.svg',
                $website . '/images/logo.png',
                $website . '/assets/logo.png',
                $website . '/static/logo.png',
                $website . '/img/logo.png',
                "https://logo.clearbit.com/{$domain}",
                "https://www.google.com/s2/favicons?domain={$domain}&sz=256",
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            foreach ($logoUrls as $url) {
                curl_setopt($ch, CURLOPT_URL, $url);
                $imageData = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                
                if ($httpCode == 200 && $imageData && strlen($imageData) > 100) {
                    // Save image
                    if (file_put_contents($savePath, $imageData)) {
                        $logoUrl = "https://api.medarion.africa/uploads/company/{$filename}";
                        break;
                    }
                }
            }
            
            curl_close($ch);
        }
        
        if ($logoUrl) {
            $updateStmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE id = ?");
            if ($updateStmt->execute([$logoUrl, $companyId])) {
                echo "✓ downloaded\n";
                $downloaded++;
            } else {
                echo "✗ download failed\n";
                $failed++;
            }
        } else {
            echo "✗ failed\n";
            $failed++;
        }
        
        // Rate limiting
        usleep(500000); // 0.5 seconds
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "COMPLETE\n";
    echo str_repeat("=", 60) . "\n";
    echo "Downloaded/Updated: {$downloaded}\n";
    echo "Failed: {$failed}\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

