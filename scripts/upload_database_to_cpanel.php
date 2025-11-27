<?php
/**
 * Upload and import database to cPanel
 */
$cpanel_config = [
    'host' => 'localhost',
    'user' => 'medasnnc_medarion',
    'password' => 'Neorage94',
    'database' => 'medasnnc_medarion',
];

$sql_file = __DIR__ . '/../database_export_for_cpanel.sql';

if (!file_exists($sql_file)) {
    echo "❌ SQL file not found: $sql_file\n";
    echo "Run export_local_database.php first\n";
    exit(1);
}

echo "=" . str_repeat("=", 80) . "\n";
echo "UPLOADING DATABASE TO CPANEL\n";
echo "=" . str_repeat("=", 80) . "\n\n";

try {
    // Connect to cPanel database
    echo "Connecting to cPanel database...\n";
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
    echo "✅ Connected to cPanel database\n\n";
    
    // Clear existing data (except users)
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
            echo "  ✅ Cleared: $table\n";
        } catch (PDOException $e) {
            // Table might not exist
        }
    }
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "✅ Old data cleared\n\n";
    
    // Read and execute SQL file
    echo "Importing database from SQL file...\n";
    $sql_content = file_get_contents($sql_file);
    $sql_content = str_replace(["\r\n", "\r"], "\n", $sql_content);
    $sql_content = preg_replace('/^\xEF\xBB\xBF/', '', $sql_content);
    
    // Parse and execute statements
    $statements = [];
    $current = '';
    $in_string = false;
    $string_char = '';
    
    $lines = explode("\n", $sql_content);
    foreach ($lines as $line) {
        $trimmed = trim($line);
        
        if (empty($trimmed) || preg_match('/^--/', $trimmed)) {
            continue;
        }
        
        $current .= $line . "\n";
        
        if (!$in_string && preg_match('/;\s*$/', $line)) {
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
    echo "  Executing statements...\n";
    
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
                echo "    Processed $executed statements...\n";
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
                    echo "    ⚠️  Error: " . substr($error_msg, 0, 100) . "\n";
                }
            }
        }
    }
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    echo "\n✅ Import complete!\n";
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
            echo "  ✅ $table: $count records\n";
        } catch (PDOException $e) {
            echo "  ⚠️  $table: Error\n";
        }
    }
    
    echo "\n" . str_repeat("=", 80) . "\n";
    echo "✅ DATABASE UPLOAD COMPLETE!\n";
    echo "   Total records: $total\n";
    echo str_repeat("=", 80) . "\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

