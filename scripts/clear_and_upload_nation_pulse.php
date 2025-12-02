<?php
/**
 * Clear Old Nation Pulse Data and Upload Accurate Data
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "CLEAR OLD AND UPLOAD ACCURATE NATION PULSE DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$db_config = [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4'
];

try {
    $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['database']};charset={$db_config['charset']}";
    $db = new PDO($dsn, $db_config['username'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    echo "✅ Connected to database\n\n";
} catch(PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage() . "\n\n");
}

// Step 1: Clear old data
echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 1: CLEARING OLD NATION PULSE DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

try {
    $stmt = $db->query("SELECT COUNT(*) FROM nation_pulse_data");
    $old_count = $stmt->fetchColumn();
    echo "📊 Current records in database: $old_count\n\n";
    
    echo "🗑️  Clearing old data...\n";
    $db->exec("TRUNCATE TABLE nation_pulse_data");
    echo "✅ Cleared all old Nation Pulse data\n\n";
} catch(PDOException $e) {
    die("❌ Error clearing data: " . $e->getMessage() . "\n\n");
}

// Step 2: Load accurate data
echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 2: LOADING ACCURATE NATION PULSE DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$data_file = 'data_master/verified/nation_pulse/master_nation_pulse.json';

if (!file_exists($data_file)) {
    die("❌ File not found: $data_file\n");
}

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    die("❌ Invalid JSON data\n");
}

echo "📊 Loaded " . count($data) . " accurate records\n\n";

// Step 3: Upload accurate data
echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 3: UPLOADING ACCURATE DATA TO DATABASE\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$fields = ['id', 'country', 'country_code', 'data_type', 'metric_name', 'metric_value', 'metric_unit', 'year', 'source'];

$field_list = implode(', ', $fields);
$placeholders = ':' . implode(', :', $fields);

$insert_sql = "INSERT INTO nation_pulse_data ($field_list, created_at, updated_at) VALUES ($placeholders, NOW(), NOW())";
$stmt_insert = $db->prepare($insert_sql);

$uploaded = 0;
$errors = 0;

foreach ($data as $index => $item) {
    try {
        $params = [];
        foreach ($fields as $field) {
            $params[":$field"] = $item[$field] ?? null;
        }
        
        $stmt_insert->execute($params);
        $uploaded++;
        
        if (($index + 1) % 100 === 0) {
            echo "   Uploaded: " . ($index + 1) . " records...\n";
        }
    } catch (PDOException $e) {
        $errors++;
        if ($errors <= 5) {
            echo "   ⚠️  Error uploading record " . ($index + 1) . ": " . $e->getMessage() . "\n";
        }
    }
}

echo "\n";
echo "=" . str_repeat("=", 69) . "\n";
echo "UPLOAD SUMMARY\n";
echo "=" . str_repeat("=", 69) . "\n\n";

echo "✅ Successfully uploaded: $uploaded records\n";
if ($errors > 0) {
    echo "⚠️  Errors: $errors records\n";
}

// Verify upload
$stmt = $db->query("SELECT COUNT(*) FROM nation_pulse_data");
$new_count = $stmt->fetchColumn();

echo "\n📊 Database status:\n";
echo "   - Records in database: $new_count\n";
echo "   - Records in file: " . count($data) . "\n";

// Check electrification specifically
$stmt = $db->query("SELECT COUNT(*) FROM nation_pulse_data WHERE metric_name LIKE '%electrification%' OR metric_name LIKE '%electricity%'");
$electrification_count = $stmt->fetchColumn();
echo "   - Electrification entries: $electrification_count\n";

// Sample electrification data
$stmt = $db->query("SELECT country, metric_value FROM nation_pulse_data WHERE (metric_name LIKE '%electrification%' OR metric_name LIKE '%electricity%') LIMIT 10");
$samples = $stmt->fetchAll();
echo "\n📊 Sample electrification data:\n";
foreach ($samples as $sample) {
    echo "   - {$sample['country']}: {$sample['metric_value']}%\n";
}

echo "\n";
echo "=" . str_repeat("=", 69) . "\n";
echo "✅ UPLOAD COMPLETE!\n";
echo "=" . str_repeat("=", 69) . "\n";

