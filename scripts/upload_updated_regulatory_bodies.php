<?php
/**
 * Upload Updated Regulatory Bodies to Database
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "UPLOAD UPDATED REGULATORY BODIES TO DATABASE\n";
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

// Load data
$data_file = 'data_master/verified/regulatory_bodies/master_regulatory_bodies.json';

if (!file_exists($data_file)) {
    die("❌ File not found: $data_file\n");
}

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    die("❌ Invalid JSON data\n");
}

echo "📊 Loaded " . count($data) . " records\n\n";

// Clear old data
echo "🗑️  Clearing old data...\n";
try {
    $db->exec("TRUNCATE TABLE regulatory_bodies");
    echo "✅ Cleared all old regulatory bodies data\n\n";
} catch(PDOException $e) {
    die("❌ Error clearing data: " . $e->getMessage() . "\n\n");
}

// Upload new data
echo "=" . str_repeat("=", 69) . "\n";
echo "UPLOADING UPDATED DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

// Exclude 'requirements' field due to database constraint
$fields = ['id', 'name', 'acronym', 'country', 'type', 'description', 'is_active', 'website', 'contact_email', 'contact_phone', 'address', 'approval_process_duration', 'abbreviation', 'logo_url'];

$field_list = implode(', ', $fields);
$placeholders = ':' . implode(', :', $fields);

$insert_sql = "INSERT INTO regulatory_bodies ($field_list, created_at, updated_at) VALUES ($placeholders, NOW(), NOW())";
$stmt_insert = $db->prepare($insert_sql);

$uploaded = 0;
$errors = 0;

foreach ($data as $index => $item) {
    try {
        $params = [];
        foreach ($fields as $field) {
            $value = $item[$field] ?? null;
            
            // Convert string '1'/'0' to int for is_active
            if ($field === 'is_active' && $value !== null) {
                $value = (int)$value;
            }
            
            // Truncate requirements if too long (LONGTEXT should handle it, but be safe)
            if ($field === 'requirements' && $value !== null && strlen($value) > 65535) {
                $value = substr($value, 0, 65530) . '...';
            }
            
            // Truncate description if too long
            if ($field === 'description' && $value !== null && strlen($value) > 65535) {
                $value = substr($value, 0, 65530) . '...';
            }
            
            // Truncate address if too long
            if ($field === 'address' && $value !== null && strlen($value) > 65535) {
                $value = substr($value, 0, 65530) . '...';
            }
            
            $params[":$field"] = $value;
        }
        
        $stmt_insert->execute($params);
        $uploaded++;
        
        if (($index + 1) % 20 === 0) {
            echo "   Uploaded: " . ($index + 1) . " records...\n";
        }
    } catch (PDOException $e) {
        $errors++;
        if ($errors <= 5) {
            echo "   ⚠️  Error uploading record " . ($index + 1) . " ({$item['name']}): " . $e->getMessage() . "\n";
            // Try without requirements field if it's causing issues
            if (strpos($e->getMessage(), 'requirements') !== false) {
                try {
                    $fields_no_req = array_diff($fields, ['requirements']);
                    $field_list_no_req = implode(', ', $fields_no_req);
                    $placeholders_no_req = ':' . implode(', :', $fields_no_req);
                    $insert_sql_no_req = "INSERT INTO regulatory_bodies ($field_list_no_req, created_at, updated_at) VALUES ($placeholders_no_req, NOW(), NOW())";
                    $stmt_no_req = $db->prepare($insert_sql_no_req);
                    
                    $params_no_req = [];
                    foreach ($fields_no_req as $field) {
                        $value = $item[$field] ?? null;
                        if ($field === 'is_active' && $value !== null) {
                            $value = (int)$value;
                        }
                        $params_no_req[":$field"] = $value;
                    }
                    $stmt_no_req->execute($params_no_req);
                    $uploaded++;
                    $errors--; // Decrement since we recovered
                    echo "     ✅ Recovered by omitting requirements field\n";
                } catch (PDOException $e2) {
                    // Still failed, keep the error
                }
            }
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
$stmt = $db->query("SELECT COUNT(*) FROM regulatory_bodies");
$new_count = $stmt->fetchColumn();

echo "\n📊 Database status:\n";
echo "   - Records in database: $new_count\n";
echo "   - Records in file: " . count($data) . "\n";

// Sample data
$stmt = $db->query("SELECT name, country, website FROM regulatory_bodies WHERE website IS NOT NULL AND website != '' LIMIT 5");
$samples = $stmt->fetchAll();
echo "\n📊 Sample updated records:\n";
foreach ($samples as $sample) {
    echo "   - {$sample['country']}: {$sample['name']}\n";
    echo "     Website: {$sample['website']}\n";
}

echo "\n";
echo "=" . str_repeat("=", 69) . "\n";
echo "✅ UPLOAD COMPLETE!\n";
echo "=" . str_repeat("=", 69) . "\n";

