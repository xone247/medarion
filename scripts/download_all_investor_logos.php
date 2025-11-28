<?php
/**
 * Download logos for ALL investors
 * This will download logos from company websites and update the database
 */

require_once __DIR__ . '/../config/database.php';

$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
if (!empty($config['port'])) {
    $dsn .= ";port={$config['port']}";
}

function download_image($url, $save_path) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    $image_data = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code == 200 && $image_data) {
        $dir = dirname($save_path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        return file_put_contents($save_path, $image_data) !== false;
    }
    return false;
}

try {
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "DOWNLOADING ALL INVESTOR LOGOS\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Get all investors
    $investors = $pdo->query("SELECT id, name, website FROM investors WHERE (logo IS NULL OR logo = '') AND website IS NOT NULL AND website != ''")->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($investors) . " investors without logos\n\n";
    
    $downloaded = 0;
    $failed = 0;
    $logoDir = __DIR__ . '/../public/uploads/investor';
    
    if (!is_dir($logoDir)) {
        mkdir($logoDir, 0755, true);
    }
    
    foreach ($investors as $index => $investor) {
        $investor_id = $investor['id'];
        $name = $investor['name'];
        $website = $investor['website'];
        
        echo "[" . ($index + 1) . "/" . count($investors) . "] {$name}... ";
        
        // Create filename
        $filename = strtolower(str_replace([' ', "'", '.', '/', '\\'], ['_', '', '', '_', '_'], $name)) . '.png';
        $save_path = $logoDir . '/' . $filename;
        $db_url = 'https://api.medarion.africa/uploads/investor/' . $filename;
        
        // Check if already exists
        if (file_exists($save_path)) {
            $updateStmt = $pdo->prepare("UPDATE investors SET logo = ? WHERE id = ?");
            $updateStmt->execute([$db_url, $investor_id]);
            echo "✓ already exists, updated DB\n";
            $downloaded++;
            continue;
        }
        
        $logo_found = false;
        
        if ($website) {
            try {
                $parsed_url = parse_url($website);
                if ($parsed_url && isset($parsed_url['host'])) {
                    $base_url = $parsed_url['scheme'] . '://' . $parsed_url['host'];
                    
                    $common_paths = [
                        '/logo.png', '/logo.jpg', '/logo.svg',
                        '/assets/logo.png', '/assets/logo.jpg', '/assets/logo.svg',
                        '/images/logo.png', '/images/logo.jpg', '/images/logo.svg',
                        '/wp-content/uploads/logo.png',
                        '/favicon.ico'
                    ];
                    
                    foreach ($common_paths as $path) {
                        $full_logo_url = $base_url . $path;
                        if (download_image($full_logo_url, $save_path)) {
                            $logo_found = true;
                            break;
                        }
                    }
                }
            } catch (Exception $e) {
                // Continue to next attempt
            }
        }
        
        if ($logo_found) {
            $updateStmt = $pdo->prepare("UPDATE investors SET logo = ? WHERE id = ?");
            $updateStmt->execute([$db_url, $investor_id]);
            echo "✓ downloaded\n";
            $downloaded++;
        } else {
            echo "✗ failed\n";
            $failed++;
        }
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "LOGO DOWNLOAD COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    echo "Downloaded/Updated: $downloaded\n";
    echo "Failed: $failed\n";
    
    // Verify
    $withLogos = $pdo->query("SELECT COUNT(*) FROM investors WHERE logo IS NOT NULL AND logo != ''")->fetchColumn();
    $total = $pdo->query("SELECT COUNT(*) FROM investors")->fetchColumn();
    echo "\nTotal investors: $total\n";
    echo "With logos: $withLogos\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

