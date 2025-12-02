<?php
/**
 * Deduplicate Regulatory Bodies and Upload to Database
 * Each country should have only ONE regulatory body
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "DEDUPLICATE AND UPLOAD REGULATORY BODIES\n";
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

echo "📊 Loaded " . count($data) . " records from file\n\n";

// Step 1: Deduplicate by country
echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 1: DEDUPLICATING BY COUNTRY\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$deduplicated = [];
$duplicates_removed = 0;

foreach ($data as $item) {
    $country = $item['country'] ?? 'Unknown';
    
    // If country already exists, keep the one with more complete data
    if (isset($deduplicated[$country])) {
        $existing = $deduplicated[$country];
        
        // Count non-empty fields
        $existing_fields = 0;
        $new_fields = 0;
        
        foreach (['website', 'contact_email', 'contact_phone', 'address', 'description', 'acronym'] as $field) {
            if (!empty($existing[$field])) $existing_fields++;
            if (!empty($item[$field])) $new_fields++;
        }
        
        // Keep the one with more complete data, or the new one if it has a real website
        if ($new_fields > $existing_fields || 
            (!empty($item['website']) && strpos($item['website'], 'www.') !== false && strpos($existing['website'], 'www.') === false)) {
            $deduplicated[$country] = $item;
            $duplicates_removed++;
            echo "   🔄 Replaced duplicate for {$country} (kept more complete record)\n";
        } else {
            $duplicates_removed++;
            echo "   ❌ Removed duplicate for {$country} (kept existing record)\n";
        }
    } else {
        $deduplicated[$country] = $item;
    }
}

$unique_count = count($deduplicated);
echo "\n📊 Deduplication Summary:\n";
echo "   - Original records: " . count($data) . "\n";
echo "   - Unique countries: $unique_count\n";
echo "   - Duplicates removed: $duplicates_removed\n\n";

// Step 2: Clear old data
echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 2: CLEARING OLD DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

try {
    $old_count = $db->query("SELECT COUNT(*) FROM regulatory_bodies")->fetchColumn();
    echo "📊 Current records in database: $old_count\n\n";
    
    echo "🗑️  Clearing old data...\n";
    $db->exec("TRUNCATE TABLE regulatory_bodies");
    echo "✅ Cleared all old regulatory bodies data\n\n";
} catch(PDOException $e) {
    die("❌ Error clearing data: " . $e->getMessage() . "\n\n");
}

// Step 3: Upload deduplicated data
echo "=" . str_repeat("=", 69) . "\n";
echo "STEP 3: UPLOADING DEDUPLICATED DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

// Exclude 'requirements' field due to database constraint
$fields = ['id', 'name', 'acronym', 'country', 'type', 'description', 'is_active', 'website', 'contact_email', 'contact_phone', 'address', 'approval_process_duration', 'abbreviation', 'logo_url'];

$field_list = implode(', ', $fields);
$placeholders = ':' . implode(', :', $fields);

$insert_sql = "INSERT INTO regulatory_bodies ($field_list, created_at, updated_at) VALUES ($placeholders, NOW(), NOW())";
$stmt_insert = $db->prepare($insert_sql);

$uploaded = 0;
$errors = 0;

// Sort by country name for consistent ordering
ksort($deduplicated);

foreach ($deduplicated as $country => $item) {
    try {
        $params = [];
        foreach ($fields as $field) {
            $value = $item[$field] ?? null;
            // Convert string '1'/'0' to int for is_active
            if ($field === 'is_active' && $value !== null) {
                $value = (int)$value;
            }
            $params[":$field"] = $value;
        }
        
        $stmt_insert->execute($params);
        $uploaded++;
        
        if ($uploaded % 10 === 0) {
            echo "   Uploaded: $uploaded records...\n";
        }
    } catch (PDOException $e) {
        $errors++;
        if ($errors <= 5) {
            echo "   ⚠️  Error uploading {$country}: " . $e->getMessage() . "\n";
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
echo "   - Unique countries: $unique_count\n";

// Check for any remaining duplicates
$stmt = $db->query("SELECT country, COUNT(*) as count FROM regulatory_bodies GROUP BY country HAVING count > 1");
$remaining_duplicates = $stmt->fetchAll();

if (count($remaining_duplicates) > 0) {
    echo "\n⚠️  Remaining duplicates in database:\n";
    foreach ($remaining_duplicates as $dup) {
        echo "   - {$dup['country']}: {$dup['count']} records\n";
    }
} else {
    echo "\n✅ No duplicates found - each country has exactly one regulatory body\n";
}

// Sample data
$stmt = $db->query("SELECT name, country, website FROM regulatory_bodies ORDER BY country LIMIT 10");
$samples = $stmt->fetchAll();
echo "\n📊 Sample records (first 10):\n";
foreach ($samples as $sample) {
    echo "   - {$sample['country']}: {$sample['name']}\n";
    if (!empty($sample['website'])) {
        echo "     Website: {$sample['website']}\n";
    }
}

echo "\n";
echo "=" . str_repeat("=", 69) . "\n";
echo "✅ UPLOAD COMPLETE!\n";
echo "=" . str_repeat("=", 69) . "\n";

