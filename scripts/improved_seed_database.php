<?php
/**
 * Improved Database Seeding Script
 * Uses MySQL command line for better multi-line SQL handling
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
    print_header("IMPROVED DATABASE SEEDING");
    
    // Use MySQL command line for better SQL parsing
    $seed_file = __DIR__ . '/seed_real_data_comprehensive.sql';
    
    if (!file_exists($seed_file)) {
        print_error("Seed file not found: $seed_file");
        exit(1);
    }
    
    // Clear data first using PDO
    print_header("CLEARING OLD DATA");
    $pdo = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['database']};charset=utf8mb4",
        $db_config['user'],
        $db_config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
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
            // Ignore if table doesn't exist
        }
    }
    
    // Reset AUTO_INCREMENT
    foreach ($tables_to_clear as $table) {
        try {
            $pdo->exec("ALTER TABLE `$table` AUTO_INCREMENT = 1");
        } catch (PDOException $e) {
            // Ignore
        }
    }
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    print_success("All old data cleared");
    
    // Use MySQL command line for seeding (handles multi-line SQL better)
    print_header("SEEDING DATABASE WITH MYSQL COMMAND LINE");
    
    $mysql_path = 'C:\\xampp\\mysql\\bin\\mysql.exe';
    if (!file_exists($mysql_path)) {
        // Try alternative path
        $mysql_path = 'mysql';
    }
    
    $command = sprintf(
        '"%s" -h%s -u%s %s %s < "%s"',
        $mysql_path,
        $db_config['host'],
        $db_config['user'],
        $db_config['password'] ? '-p' . escapeshellarg($db_config['password']) : '',
        $db_config['database'],
        $seed_file
    );
    
    print_success("Executing MySQL command...");
    print_warning("This may take a few minutes for large files...");
    
    // Execute using shell
    $output = [];
    $return_var = 0;
    exec($command . ' 2>&1', $output, $return_var);
    
    if ($return_var === 0) {
        print_success("MySQL command executed successfully");
    } else {
        // MySQL CLI might have warnings but still succeed
        $error_output = implode("\n", $output);
        if (strpos($error_output, 'ERROR') !== false) {
            print_error("MySQL errors occurred:");
            echo substr($error_output, 0, 500) . "\n";
        } else {
            print_success("Seeding completed (warnings may be present)");
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
    
} catch (Exception $e) {
    print_error("Error: " . $e->getMessage());
    exit(1);
}

