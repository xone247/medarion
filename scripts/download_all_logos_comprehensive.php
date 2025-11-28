<?php
/**
 * Comprehensive Logo Download Script
 * Downloads logos for companies, investors, and regulatory bodies
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
    echo "COMPREHENSIVE LOGO DOWNLOAD\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Helper function to download image
    function download_image($url, $save_path, $timeout = 10) {
        if (empty($url)) return false;
        $url = trim($url);
        if (!filter_var($url, FILTER_VALIDATE_URL)) return false;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_BINARYTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        $raw = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code >= 200 && $http_code < 300 && $raw && strlen($raw) > 1000) {
            file_put_contents($save_path, $raw);
            return true;
        }
        return false;
    }
    
    // Helper function to normalize name for filename
    function normalize_filename($name) {
        return strtolower(preg_replace('/[^a-z0-9]+/', '_', $name));
    }
    
    // ============================================
    // 1. COMPANY LOGOS
    // ============================================
    echo "1. DOWNLOADING COMPANY LOGOS\n";
    echo str_repeat("-", 60) . "\n";
    
    $companyLogoDir = __DIR__ . '/../public/uploads/company/';
    if (!is_dir($companyLogoDir)) {
        mkdir($companyLogoDir, 0777, true);
    }
    
    $companies = $pdo->query("SELECT id, name, website FROM companies WHERE (logo_url IS NULL OR logo_url = '' OR logo IS NULL OR logo = '') AND website IS NOT NULL AND website != '' LIMIT 50")->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($companies) . " companies without logos\n";
    
    $companyDownloaded = 0;
    foreach ($companies as $index => $company) {
        $filename = normalize_filename($company['name']) . '.png';
        $save_path = $companyLogoDir . $filename;
        $db_url = '/uploads/company/' . $filename;
        
        if (file_exists($save_path)) {
            $updateStmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE id = ?");
            $updateStmt->execute([$db_url, $company['id']]);
            $companyDownloaded++;
            continue;
        }
        
        $website = $company['website'];
        if ($website) {
            $parsed = parse_url($website);
            $base_url = $parsed['scheme'] . '://' . $parsed['host'];
            
            $common_paths = ['/logo.png', '/logo.jpg', '/assets/logo.png', '/images/logo.png', '/favicon.ico'];
            foreach ($common_paths as $path) {
                $logo_url = $base_url . $path;
                if (download_image($logo_url, $save_path)) {
                    $updateStmt = $pdo->prepare("UPDATE companies SET logo_url = ? WHERE id = ?");
                    $updateStmt->execute([$db_url, $company['id']]);
                    $companyDownloaded++;
                    echo "  ✓ {$company['name']}\n";
                    break;
                }
            }
        }
    }
    
    echo "  Downloaded/Updated: {$companyDownloaded} company logos\n\n";
    
    // ============================================
    // 2. INVESTOR LOGOS
    // ============================================
    echo "2. DOWNLOADING INVESTOR LOGOS\n";
    echo str_repeat("-", 60) . "\n";
    
    $investorLogoDir = __DIR__ . '/../public/uploads/investor/';
    if (!is_dir($investorLogoDir)) {
        mkdir($investorLogoDir, 0777, true);
    }
    
    // Check which logo column exists
    $logoColumnCheck = $pdo->query("SHOW COLUMNS FROM investors LIKE 'logo%'")->fetchAll(PDO::FETCH_COLUMN);
    $logoColumn = in_array('logo_url', $logoColumnCheck) ? 'logo_url' : (in_array('logo', $logoColumnCheck) ? 'logo' : null);
    
    if ($logoColumn) {
        $investors = $pdo->query("SELECT id, name, website FROM investors WHERE ({$logoColumn} IS NULL OR {$logoColumn} = '') AND website IS NOT NULL AND website != ''")->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $investors = $pdo->query("SELECT id, name, website FROM investors WHERE website IS NOT NULL AND website != ''")->fetchAll(PDO::FETCH_ASSOC);
    }
    echo "Found " . count($investors) . " investors without logos\n";
    
    $investorDownloaded = 0;
    foreach ($investors as $index => $investor) {
        $filename = normalize_filename($investor['name']) . '.png';
        $save_path = $investorLogoDir . $filename;
        $db_url = '/uploads/investor/' . $filename;
        
        if (file_exists($save_path)) {
            if ($logoColumn) {
                $updateStmt = $pdo->prepare("UPDATE investors SET {$logoColumn} = ? WHERE id = ?");
                $updateStmt->execute([$db_url, $investor['id']]);
            }
            $investorDownloaded++;
            continue;
        }
        
        $website = $investor['website'];
        if ($website) {
            $parsed = parse_url($website);
            $base_url = $parsed['scheme'] . '://' . $parsed['host'];
            
            $common_paths = ['/logo.png', '/logo.jpg', '/assets/logo.png', '/images/logo.png', '/favicon.ico'];
            foreach ($common_paths as $path) {
                $logo_url = $base_url . $path;
                if (download_image($logo_url, $save_path)) {
                    if ($logoColumn) {
                        $updateStmt = $pdo->prepare("UPDATE investors SET {$logoColumn} = ? WHERE id = ?");
                        $updateStmt->execute([$db_url, $investor['id']]);
                    }
                    $investorDownloaded++;
                    echo "  ✓ {$investor['name']}\n";
                    break;
                }
            }
        }
    }
    
    echo "  Downloaded/Updated: {$investorDownloaded} investor logos\n\n";
    
    // ============================================
    // 3. REGULATORY BODY LOGOS
    // ============================================
    echo "3. DOWNLOADING REGULATORY BODY LOGOS\n";
    echo str_repeat("-", 60) . "\n";
    
    $regulatoryLogoDir = __DIR__ . '/../public/uploads/regulatory/';
    if (!is_dir($regulatoryLogoDir)) {
        mkdir($regulatoryLogoDir, 0777, true);
    }
    
    // Check which logo column exists for regulatory bodies
    $regLogoColumnCheck = $pdo->query("SHOW COLUMNS FROM regulatory_bodies LIKE 'logo%'")->fetchAll(PDO::FETCH_COLUMN);
    $regLogoColumn = in_array('logo_url', $regLogoColumnCheck) ? 'logo_url' : (in_array('logo', $regLogoColumnCheck) ? 'logo' : null);
    
    if ($regLogoColumn) {
        $regulatoryBodies = $pdo->query("SELECT id, name, website, abbreviation FROM regulatory_bodies WHERE ({$regLogoColumn} IS NULL OR {$regLogoColumn} = '') AND website IS NOT NULL AND website != ''")->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $regulatoryBodies = $pdo->query("SELECT id, name, website, abbreviation FROM regulatory_bodies WHERE website IS NOT NULL AND website != ''")->fetchAll(PDO::FETCH_ASSOC);
    }
    echo "Found " . count($regulatoryBodies) . " regulatory bodies without logos\n";
    
    $regulatoryDownloaded = 0;
    foreach ($regulatoryBodies as $index => $body) {
        $filename = normalize_filename($body['name'] ?: $body['abbreviation']) . '.png';
        $save_path = $regulatoryLogoDir . $filename;
        $db_url = '/uploads/regulatory/' . $filename;
        
        if (file_exists($save_path)) {
            if ($regLogoColumn) {
                $updateStmt = $pdo->prepare("UPDATE regulatory_bodies SET {$regLogoColumn} = ? WHERE id = ?");
                $updateStmt->execute([$db_url, $body['id']]);
            }
            $regulatoryDownloaded++;
            continue;
        }
        
        $website = $body['website'];
        if ($website) {
            $parsed = parse_url($website);
            $base_url = $parsed['scheme'] . '://' . $parsed['host'];
            
            $common_paths = ['/logo.png', '/logo.jpg', '/assets/logo.png', '/images/logo.png', '/favicon.ico'];
            foreach ($common_paths as $path) {
                $logo_url = $base_url . $path;
                if (download_image($logo_url, $save_path)) {
                    if ($regLogoColumn) {
                        $updateStmt = $pdo->prepare("UPDATE regulatory_bodies SET {$regLogoColumn} = ? WHERE id = ?");
                        $updateStmt->execute([$db_url, $body['id']]);
                    }
                    $regulatoryDownloaded++;
                    echo "  ✓ {$body['name']}\n";
                    break;
                }
            }
        }
    }
    
    echo "  Downloaded/Updated: {$regulatoryDownloaded} regulatory body logos\n\n";
    
    // Final summary
    echo "=" . str_repeat("=", 60) . "\n";
    echo "LOGO DOWNLOAD COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    echo "Company logos: {$companyDownloaded}\n";
    echo "Investor logos: {$investorDownloaded}\n";
    echo "Regulatory body logos: {$regulatoryDownloaded}\n";
    
    // Verify final counts
    $companyCount = $pdo->query("SELECT COUNT(*) FROM companies WHERE (logo_url IS NOT NULL AND logo_url != '') OR (logo IS NOT NULL AND logo != '')")->fetchColumn();
    if ($logoColumn) {
        $investorCount = $pdo->query("SELECT COUNT(*) FROM investors WHERE {$logoColumn} IS NOT NULL AND {$logoColumn} != ''")->fetchColumn();
    } else {
        $investorCount = 0;
    }
    $regulatoryCount = $pdo->query("SELECT COUNT(*) FROM regulatory_bodies WHERE (logo_url IS NOT NULL AND logo_url != '') OR (logo IS NOT NULL AND logo != '')")->fetchColumn();
    
    echo "\nFinal logo counts:\n";
    echo "  Companies with logos: {$companyCount}\n";
    echo "  Investors with logos: {$investorCount}\n";
    echo "  Regulatory bodies with logos: {$regulatoryCount}\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

