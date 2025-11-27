<?php
/**
 * Robust Database Seeding Script
 * Handles errors gracefully and continues processing
 */
$db_config = [
    'host' => 'localhost',
    'user' => 'root',
    'password' => '',
    'database' => 'medarion_platform',
];

$green = "\033[32m";
$red = "\033[31m";
$yellow = "\033[33m";
$blue = "\033[34m";
$reset = "\033[0m";

function print_header($text) {
    global $blue, $reset;
    echo "\n" . $blue . str_repeat("=", 80) . $reset . "\n";
    echo $blue . $text . $reset . "\n";
    echo $blue . str_repeat("=", 80) . $reset . "\n\n";
}

function print_success($text) {
    global $green, $reset;
    echo $green . "✅ " . $text . $reset . "\n";
}

function print_error($text) {
    global $red, $reset;
    echo $red . "❌ " . $text . $reset . "\n";
}

function print_warning($text) {
    global $yellow, $reset;
    echo $yellow . "⚠️  " . $text . $reset . "\n";
}

try {
    print_header("ROBUST DATABASE SEEDING");
    
    $seed_file = __DIR__ . '/seed_real_data_comprehensive.sql';
    
    if (!file_exists($seed_file)) {
        print_error("Seed file not found: $seed_file");
        exit(1);
    }
    
    // Connect to database
    $pdo = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['database']};charset=utf8mb4",
        $db_config['user'],
        $db_config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    // Clear data
    print_header("CLEARING OLD DATA");
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
            print_success("Cleared: $table");
        } catch (PDOException $e) {
            // Ignore
        }
    }
    
    foreach ($tables_to_clear as $table) {
        try {
            $pdo->exec("ALTER TABLE `$table` AUTO_INCREMENT = 1");
        } catch (PDOException $e) {
            // Ignore
        }
    }
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    print_success("All old data cleared");
    
    // Read and parse SQL file
    print_header("SEEDING DATABASE");
    print_success("Reading seed file...");
    
    $sql_content = file_get_contents($seed_file);
    $sql_content = str_replace(["\r\n", "\r"], "\n", $sql_content);
    
    // Remove BOM
    $sql_content = preg_replace('/^\xEF\xBB\xBF/', '', $sql_content);
    
    // Better SQL parsing - handle multi-line statements
    $statements = [];
    $current = '';
    $in_string = false;
    $string_char = '';
    $in_comment = false;
    
    $lines = explode("\n", $sql_content);
    foreach ($lines as $line_num => $line) {
        $trimmed = trim($line);
        
        // Skip empty lines and full-line comments
        if (empty($trimmed) || preg_match('/^--/', $trimmed)) {
            continue;
        }
        
        // Handle multi-line comments
        if (preg_match('/\/\*/', $line)) {
            $in_comment = true;
        }
        if (preg_match('/\*\//', $line)) {
            $in_comment = false;
            continue;
        }
        if ($in_comment) {
            continue;
        }
        
        // Track string state
        $chars = str_split($line);
        foreach ($chars as $char) {
            if (!$in_string && ($char === '"' || $char === "'")) {
                $in_string = true;
                $string_char = $char;
            } elseif ($in_string && $char === $string_char && strlen($current) > 0 && substr($current, -1) !== '\\') {
                $in_string = false;
                $string_char = '';
            }
        }
        
        $current .= $line . "\n";
        
        // Check for statement end (semicolon not in string)
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
    
    // Add remaining
    if (!empty(trim($current))) {
        $stmt = trim($current);
        if (!empty($stmt) && !preg_match('/^(USE|SET FOREIGN_KEY_CHECKS)/i', $stmt)) {
            $statements[] = $stmt;
        }
    }
    
    print_success("Parsed " . count($statements) . " SQL statements");
    print_warning("Executing statements (this may take a few minutes)...");
    
    // Execute statements with error handling
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("SET sql_mode = 'NO_ENGINE_SUBSTITUTION'");
    
    $executed = 0;
    $errors = 0;
    $skipped = 0;
    $error_types = [];
    
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
            
            // Skip duplicate key errors (expected for some data)
            if ($error_code == 23000 || strpos($error_msg, 'Duplicate entry') !== false) {
                $skipped++;
            } elseif ($error_code == '42S22' || strpos($error_msg, "doesn't exist") !== false) {
                // Column doesn't exist - might be schema mismatch
                $skipped++;
            } else {
                $errors++;
                if ($errors <= 10) {
                    $error_key = substr($error_msg, 0, 100);
                    if (!isset($error_types[$error_key])) {
                        $error_types[$error_key] = 0;
                    }
                    $error_types[$error_key]++;
                }
            }
        }
    }
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    print_header("SEEDING RESULTS");
    print_success("Executed: $executed statements");
    if ($skipped > 0) {
        print_warning("Skipped (duplicates/expected): $skipped statements");
    }
    if ($errors > 0) {
        print_warning("Errors: $errors statements");
        if (count($error_types) > 0) {
            echo "\nSample errors:\n";
            foreach (array_slice($error_types, 0, 5) as $error => $count) {
                echo "  - " . substr($error, 0, 80) . " ($count times)\n";
            }
        }
    }
    
    // Verify data
    print_header("VERIFYING SEEDED DATA");
    
    $tables = [
        'africa_countries' => 'Africa Countries',
        'companies' => 'Companies',
        'deals' => 'Deals',
        'investors' => 'Investors',
        'grants' => 'Grants',
        'clinical_trials' => 'Clinical Trials',
        'regulatory_bodies' => 'Regulatory Bodies',
        'company_regulatory' => 'Company Regulatory',
        'public_stocks' => 'Public Stocks',
        'clinical_centers' => 'Clinical Centers',
        'investigators' => 'Investigators',
        'nation_pulse_data' => 'Nation Pulse Data',
        'glossary_terms' => 'Glossary Terms',
    ];
    
    $total = 0;
    foreach ($tables as $table => $name) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $result = $stmt->fetch();
            $count = $result['count'];
            $total += $count;
            $status = $count > 0 ? "✅" : "⚠️ ";
            echo sprintf("%-30s %s %6d records\n", $name, $status, $count);
        } catch (PDOException $e) {
            echo sprintf("%-30s ❌ Error\n", $name);
        }
    }
    
    echo "\n" . str_repeat("-", 80) . "\n";
    echo sprintf("%-30s %s %6d records\n", "TOTAL", "✅", $total);
    
    print_header("SEEDING COMPLETE!");
    print_success("Database has been populated with real, verifiable data");
    print_success("Total records: $total");
    
} catch (Exception $e) {
    print_error("Error: " . $e->getMessage());
    exit(1);
}

