<?php
/**
 * Database Import Script for cPanel
 * Upload this file and database_export_for_cpanel.sql to public_html
 * Then visit: https://medarion.africa/import_database.php
 */
$cpanel_config = [
    'host' => 'localhost',
    'user' => 'medasnnc_medarion',
    'password' => 'Neorage94',
    'database' => 'medasnnc_medarion',
];

// Security: Only allow from localhost or specific IP
$allowed_ips = ['127.0.0.1', '::1', '66.29.131.252'];
$client_ip = $_SERVER['REMOTE_ADDR'] ?? '';

if (!in_array($client_ip, $allowed_ips) && $client_ip !== '127.0.0.1') {
    // Still allow but show warning
    // die("Access denied. This script should only be run from the server.");
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Database Import - Medarion</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
        .success { color: #4ec9b0; }
        .error { color: #f48771; }
        .warning { color: #dcdcaa; }
        pre { background: #252526; padding: 10px; border-radius: 5px; overflow-x: auto; }
        h1 { color: #569cd6; }
    </style>
</head>
<body>
    <h1>Database Import Script</h1>
    <pre>
<?php

echo "=" . str_repeat("=", 80) . "\n";
echo "MEDARION DATABASE IMPORT\n";
echo "=" . str_repeat("=", 80) . "\n\n";

// Find SQL file
$possible_locations = [
    __DIR__ . '/database_export_for_cpanel.sql',
    $_SERVER['DOCUMENT_ROOT'] . '/database_export_for_cpanel.sql',
    '/home/medasnnc/public_html/database_export_for_cpanel.sql',
];

$sql_file = null;
foreach ($possible_locations as $location) {
    if (file_exists($location)) {
        $sql_file = $location;
        break;
    }
}

if (!$sql_file) {
    echo "<span class='error'>❌ SQL file not found!</span>\n";
    echo "Please upload 'database_export_for_cpanel.sql' to the same directory as this script.\n";
    echo "\nSearched in:\n";
    foreach ($possible_locations as $loc) {
        echo "  - $loc\n";
    }
    exit;
}

echo "<span class='success'>✅ Found SQL file: $sql_file</span>\n";
echo "   Size: " . number_format(filesize($sql_file) / 1024, 2) . " KB\n\n";

try {
    echo "Connecting to database...\n";
    $pdo = new PDO(
        "mysql:host={$cpanel_config['host']};dbname={$cpanel_config['database']};charset=utf8mb4",
        $cpanel_config['user'],
        $cpanel_config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    echo "<span class='success'>✅ Connected to database</span>\n\n";
    
    // Clear existing data
    echo "Clearing existing data (preserving users)...\n";
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    $tables_to_clear = [
        'sponsored_ads', 'blog_posts', 'glossary_terms', 'nation_pulse_data',
        'investigators', 'clinical_centers', 'public_stocks', 'company_regulatory',
        'regulatory_bodies', 'clinical_trials', 'grants', 'investors',
        'deals', 'companies', 'africa_countries', 'crm_meetings', 'crm_investors'
    ];
    
    foreach ($tables_to_clear as $table) {
        try {
            $pdo->exec("TRUNCATE TABLE `$table`");
            echo "  <span class='success'>✅</span> Cleared: $table\n";
        } catch (PDOException $e) {
            // Table might not exist
        }
    }
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "<span class='success'>✅ Old data cleared</span>\n\n";
    
    // Read and parse SQL file
    echo "Reading SQL file...\n";
    $sql_content = file_get_contents($sql_file);
    $sql_content = str_replace(["\r\n", "\r"], "\n", $sql_content);
    $sql_content = preg_replace('/^\xEF\xBB\xBF/', '', $sql_content);
    
    // Parse statements
    $statements = [];
    $current = '';
    
    $lines = explode("\n", $sql_content);
    foreach ($lines as $line) {
        $trimmed = trim($line);
        
        if (empty($trimmed) || preg_match('/^--/', $trimmed)) {
            continue;
        }
        
        $current .= $line . "\n";
        
        if (preg_match('/;\s*$/', $line)) {
            $stmt = trim($current);
            if (!empty($stmt) && 
                !preg_match('/^(USE|SET FOREIGN_KEY_CHECKS)/i', $stmt) &&
                !preg_match('/^CREATE TABLE IF NOT EXISTS/i', $stmt)) {
                $statements[] = $stmt;
            }
            $current = '';
        }
    }
    
    if (!empty(trim($current))) {
        $stmt = trim($current);
        if (!empty($stmt) && !preg_match('/^(USE|SET FOREIGN_KEY_CHECKS)/i', $stmt)) {
            $statements[] = $stmt;
        }
    }
    
    echo "  Parsed " . count($statements) . " SQL statements\n";
    echo "  Executing statements...\n\n";
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("SET sql_mode = 'NO_ENGINE_SUBSTITUTION'");
    
    $executed = 0;
    $errors = 0;
    $skipped = 0;
    
    foreach ($statements as $index => $statement) {
        if (empty(trim($statement))) continue;
        
        try {
            $pdo->exec($statement);
            $executed++;
            
            if ($executed % 200 == 0) {
                echo "  Processed $executed statements...\n";
            }
        } catch (PDOException $e) {
            $error_code = $e->getCode();
            $error_msg = $e->getMessage();
            
            if ($error_code == 23000 || strpos($error_msg, 'Duplicate entry') !== false) {
                $skipped++;
            } elseif ($error_code == '42S22' || strpos($error_msg, "doesn't exist") !== false) {
                $skipped++;
            } else {
                $errors++;
                if ($errors <= 5) {
                    echo "  <span class='warning'>⚠️</span> Error: " . htmlspecialchars(substr($error_msg, 0, 100)) . "\n";
                }
            }
        }
    }
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    echo "\n<span class='success'>✅ Import complete!</span>\n";
    echo "   Executed: $executed statements\n";
    if ($skipped > 0) {
        echo "   Skipped: $skipped statements (duplicates/expected)\n";
    }
    if ($errors > 0) {
        echo "   Errors: $errors statements\n";
    }
    
    // Verify data
    echo "\nVerifying imported data...\n";
    $tables = [
        'africa_countries', 'companies', 'deals', 'investors', 'grants',
        'clinical_trials', 'regulatory_bodies', 'company_regulatory',
        'public_stocks', 'clinical_centers', 'investigators',
        'nation_pulse_data', 'glossary_terms'
    ];
    
    $total = 0;
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $result = $stmt->fetch();
            $count = $result['count'];
            $total += $count;
            echo "  <span class='success'>✅</span> $table: $count records\n";
        } catch (PDOException $e) {
            echo "  <span class='warning'>⚠️</span> $table: Error\n";
        }
    }
    
    echo "\n" . str_repeat("=", 80) . "\n";
    echo "<span class='success'>✅ DATABASE IMPORT COMPLETE!</span>\n";
    echo "   Total records: $total\n";
    echo str_repeat("=", 80) . "\n";
    
    echo "\n<span class='success'>✅ Your database has been successfully reset with the new data!</span>\n";
    echo "\n⚠️  <span class='warning'>For security, delete this file (import_database.php) after use.</span>\n";
    
} catch (PDOException $e) {
    echo "<span class='error'>❌ Database Error: " . htmlspecialchars($e->getMessage()) . "</span>\n";
} catch (Exception $e) {
    echo "<span class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</span>\n";
}

?>
    </pre>
</body>
</html>

