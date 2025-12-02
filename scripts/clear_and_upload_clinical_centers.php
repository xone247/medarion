<?php
/**
 * Clear old clinical centers data and upload updated factual data
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "CLEAR OLD AND UPLOAD ACCURATE CLINICAL CENTERS DATA\n";
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

$data_file = 'data_master/verified/clinical_centers/master_clinical_centers.json';

if (!file_exists($data_file)) {
    die("❌ File not found: $data_file\n");
}

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    die("❌ Invalid JSON data\n");
}

echo "📊 Loaded " . count($data) . " records from file\n\n";

// Check current database count
$current_count = $db->query("SELECT COUNT(*) FROM clinical_centers")->fetchColumn();
echo "📊 Current records in database: $current_count\n\n";

echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 1: CLEARING OLD CLINICAL CENTERS DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

echo "🗑️  Clearing old data...\n";
$db->exec("TRUNCATE TABLE clinical_centers");
echo "✅ Cleared all old clinical centers data\n\n";

echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 2: UPLOADING ACCURATE DATA TO DATABASE\n";
echo "=" . str_repeat("=", 69) . "\n\n";

// Get actual columns from database
$columns_stmt = $db->query("SHOW COLUMNS FROM clinical_centers");
$existing_columns = [];
while ($row = $columns_stmt->fetch(PDO::FETCH_ASSOC)) {
    $existing_columns[] = $row['Field'];
}

// Define fields that might be in the JSON
$possible_fields = ['id', 'name', 'type', 'country', 'city', 'address', 'description', 'specialties', 'phases_supported', 'capacity_patients', 'established_year', 'specializations', 'certifications', 'contact_name', 'contact_email', 'contact_phone', 'website', 'active_trials_count', 'total_trials_completed', 'is_active'];

// Filter to only include fields that exist in the database
$fields = array_intersect($possible_fields, $existing_columns);

// Also add JSON fields that might exist
$json_fields = ['specialties', 'phases_supported', 'accreditation', 'contact_info', 'facilities'];
foreach ($json_fields as $json_field) {
    if (in_array($json_field, $existing_columns) && !in_array($json_field, $fields)) {
        $fields[] = $json_field;
    }
}

$field_list = implode(', ', $fields);
$placeholders = ':' . implode(', :', $fields);
$insert_sql = "INSERT INTO clinical_centers ($field_list, created_at, updated_at) VALUES ($placeholders, NOW(), NOW())";

$stmt = $db->prepare($insert_sql);

$uploaded = 0;
$errors = 0;

foreach ($data as $index => $item) {
    try {
        $params = [];
        foreach ($fields as $field) {
            $value = $item[$field] ?? null;
            
            // Handle JSON fields
            if (in_array($field, ['specialties', 'phases_supported', 'accreditation', 'contact_info', 'facilities'])) {
                if (is_string($value)) {
                    // Check if it's already valid JSON
                    $decoded = json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        // Already valid JSON
                        $params[":$field"] = $value;
                    } else {
                        // Not JSON, try to convert
                        if (!empty($value)) {
                            $params[":$field"] = json_encode([$value]);
                        } else {
                            $params[":$field"] = null;
                        }
                    }
                } elseif (is_array($value)) {
                    $params[":$field"] = json_encode($value, JSON_UNESCAPED_UNICODE);
                } else {
                    $params[":$field"] = null;
                }
            } elseif ($field === 'is_active') {
                // Convert to int
                $params[":$field"] = ($value === '1' || $value === 1 || $value === true) ? 1 : 0;
            } elseif (in_array($field, ['capacity_patients', 'established_year', 'active_trials_count', 'total_trials_completed'])) {
                // Convert to int or null
                $params[":$field"] = ($value !== null && $value !== '') ? (int)$value : null;
            } else {
                $params[":$field"] = $value;
            }
        }
        
        $stmt->execute($params);
        $uploaded++;
        
        if ($uploaded % 10 == 0) {
            echo "   Uploaded: $uploaded records...\n";
        }
    } catch (PDOException $e) {
        echo "   ❌ Error uploading record " . ($index + 1) . " (" . ($item['name'] ?? 'Unknown') . "): " . $e->getMessage() . "\n";
        $errors++;
    }
}

echo "\n" . str_repeat("=", 69) . "\n";
echo "UPLOAD SUMMARY\n";
echo str_repeat("=", 69) . "\n\n";

echo "✅ Successfully uploaded: $uploaded records\n";
if ($errors > 0) {
    echo "❌ Errors: $errors records\n";
}

// Verify upload
$final_count = $db->query("SELECT COUNT(*) FROM clinical_centers")->fetchColumn();
echo "\n📊 Database status:\n";
echo "   - Records in database: $final_count\n";
echo "   - Records in file: " . count($data) . "\n";

// Show sample records
$sample_stmt = $db->query("SELECT name, country, city FROM clinical_centers LIMIT 5");
$samples = $sample_stmt->fetchAll();

echo "\n📊 Sample records (first 5):\n";
foreach ($samples as $sample) {
    echo "   - {$sample['country']}: {$sample['name']}";
    if (!empty($sample['city'])) {
        echo " ({$sample['city']})";
    }
    echo "\n";
}

echo "\n✅ UPLOAD COMPLETE!\n";

