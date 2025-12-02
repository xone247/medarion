<?php
/**
 * Clear old investigators data and upload updated factual data
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "CLEAR OLD AND UPLOAD ACCURATE INVESTIGATORS DATA\n";
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

$data_file = 'data_master/verified/investigators/master_investigators.json';

if (!file_exists($data_file)) {
    die("❌ File not found: $data_file\n");
}

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    die("❌ Invalid JSON data\n");
}

echo "📊 Loaded " . count($data) . " records from file\n\n";

// Check current database count
$current_count = $db->query("SELECT COUNT(*) FROM investigators")->fetchColumn();
echo "📊 Current records in database: $current_count\n\n";

echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 1: CLEARING OLD INVESTIGATORS DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

echo "🗑️  Clearing old data...\n";
$db->exec("TRUNCATE TABLE investigators");
echo "✅ Cleared all old investigators data\n\n";

echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 2: UPLOADING ACCURATE DATA TO DATABASE\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$fields = ['id', 'name', 'first_name', 'last_name', 'title', 'institution', 'specialization', 'affiliation', 'country', 'city', 'email', 'phone', 'specialties', 'therapeutic_areas', 'experience_years', 'education', 'certifications', 'bio', 'research_interests', 'trials_conducted', 'publications_count', 'website', 'linkedin_url', 'is_active'];

$field_list = implode(', ', $fields);
$placeholders = ':' . implode(', :', $fields);
$insert_sql = "INSERT INTO investigators ($field_list, created_at, updated_at) VALUES ($placeholders, NOW(), NOW())";

$stmt = $db->prepare($insert_sql);

$uploaded = 0;
$errors = 0;

foreach ($data as $index => $item) {
    try {
        $params = [];
        foreach ($fields as $field) {
            $value = $item[$field] ?? null;
            
            // Handle JSON fields
            if (in_array($field, ['specialties', 'therapeutic_areas', 'education', 'certifications', 'research_interests'])) {
                if (is_string($value)) {
                    // Check if it's already valid JSON
                    $decoded = json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        // Already valid JSON
                        $params[":$field"] = $value;
                    } else {
                        // Not JSON, convert to JSON array
                        $params[":$field"] = json_encode([$value]);
                    }
                } elseif (is_array($value)) {
                    $params[":$field"] = json_encode($value);
                } else {
                    // Null or empty, set to null
                    $params[":$field"] = null;
                }
            } else {
                // Ensure first_name and last_name are never null
                if ($field === 'first_name' && (empty($value) || $value === null)) {
                    // Try to extract from name
                    $name = $item['name'] ?? '';
                    $name_parts = explode(' ', $name, 2);
                    $value = $name_parts[0] ?? '';
                }
                if ($field === 'last_name' && (empty($value) || $value === null)) {
                    // Try to extract from name
                    $name = $item['name'] ?? '';
                    $name_parts = explode(' ', $name, 2);
                    $value = $name_parts[1] ?? '';
                }
                $params[":$field"] = $value;
            }
        }
        
        $stmt->execute($params);
        $uploaded++;
        
        if ($uploaded % 10 == 0) {
            echo "   Uploaded: $uploaded records...\n";
        }
    } catch(PDOException $e) {
        $errors++;
        echo "   ❌ Error uploading record " . ($index + 1) . " (" . ($item['name'] ?? 'Unknown') . "): " . $e->getMessage() . "\n";
    }
}

echo "\n" . str_repeat("=", 69) . "\n";
echo "UPLOAD SUMMARY\n";
echo str_repeat("=", 69) . "\n\n";

echo "✅ Successfully uploaded: $uploaded records\n";
if ($errors > 0) {
    echo "⚠️  Errors: $errors records\n";
}

$final_count = $db->query("SELECT COUNT(*) FROM investigators")->fetchColumn();
echo "\n📊 Database status:\n";
echo "   - Records in database: $final_count\n";
echo "   - Records in file: " . count($data) . "\n";

// Show sample of updated data
$samples = $db->query("SELECT name, country, institution, specialization FROM investigators WHERE name NOT LIKE 'Principal Investigator%' LIMIT 5")->fetchAll();
echo "\n📊 Sample updated records:\n";
foreach ($samples as $sample) {
    echo "   - {$sample['country']}: {$sample['name']} - {$sample['institution']}\n";
}

echo "\n✅ UPLOAD COMPLETE!\n\n";

