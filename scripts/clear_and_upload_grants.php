<?php
/**
 * CLEAR OLD AND UPLOAD ACCURATE GRANTS DATA
 * 
 * This script clears existing grants data from the database
 * and uploads the latest verified data from master_grants.json
 */

// Database configuration
$db_config = [
    'host' => 'localhost',
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => ''
];

echo "======================================================================\n";
echo "CLEAR OLD AND UPLOAD ACCURATE GRANTS DATA\n";
echo "======================================================================\n\n";

// Connect to database
try {
    $db = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['database']};charset=utf8mb4",
        $db_config['username'],
        $db_config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    echo "✅ Connected to database\n\n";
} catch (PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage() . "\n");
}

// Load grants data
$grantsFile = __DIR__ . '/../data_master/verified/grants/master_grants.json';
if (!file_exists($grantsFile)) {
    die("❌ Grants file not found: $grantsFile\n");
}

$grants = json_decode(file_get_contents($grantsFile), true);
if (!$grants) {
    die("❌ Failed to parse grants JSON\n");
}

echo "📊 Loaded " . count($grants) . " records from file\n";

// Check current database count
$stmt = $db->query("SELECT COUNT(*) as count FROM grants");
$currentCount = $stmt->fetch()['count'];
echo "📊 Current records in database: {$currentCount}\n\n";

echo "======================================================================\n";
echo "STEP 1: CLEARING OLD GRANTS DATA\n";
echo "======================================================================\n\n";

try {
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    $db->exec("TRUNCATE TABLE grants");
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "🗑️  Clearing old data...\n";
    echo "✅ Cleared all old grants data\n\n";
} catch (PDOException $e) {
    echo "⚠️  Error clearing data: " . $e->getMessage() . "\n";
    echo "   Continuing with upload...\n\n";
}

echo "======================================================================\n";
echo "STEP 2: UPLOADING VERIFIED DATA TO DATABASE\n";
echo "======================================================================\n\n";

// Define fields for the grants table
$fields = ['id', 'title', 'description', 'funding_agency', 'funders', 'country', 'amount', 'duration', 'grant_type', 'sector', 'application_deadline', 'award_date', 'status', 'requirements', 'contact_email', 'website', 'duration_months', 'eligibility_criteria', 'application_process'];
$field_list = implode(', ', $fields);
$placeholders = ':' . implode(', :', $fields);
$insert_sql = "INSERT INTO grants ($field_list, created_at, updated_at) VALUES ($placeholders, NOW(), NOW())";
$stmt_insert = $db->prepare($insert_sql);

$uploaded = 0;
$errors = 0;

foreach ($grants as $index => $grant) {
    try {
        $params = [];
        foreach ($fields as $field) {
            $value = $grant[$field] ?? null;
            
            // Ensure funders is JSON string if it's an array
            if ($field === 'funders' && is_array($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE);
            } elseif ($field === 'funders' && is_string($value) && !empty($value) && !json_decode($value)) {
                // If it's a string but not valid JSON, try to make it an array and then encode
                $value = json_encode([$value], JSON_UNESCAPED_UNICODE);
            }
            
            // Ensure numeric fields are properly formatted
            if ($field === 'amount' && $value !== null) {
                $value = (float)$value;
            }
            if (in_array($field, ['duration_months']) && $value !== null) {
                $value = (int)$value;
            }
            
            $params[":$field"] = $value;
        }
        
        $stmt_insert->execute($params);
        $uploaded++;
        
        if ($uploaded % 20 == 0) {
            echo "   Uploaded: $uploaded records...\n";
        }
    } catch (PDOException $e) {
        echo "   ❌ Error uploading record " . ($index + 1) . " (" . ($grant['title'] ?? 'Unknown') . "): " . $e->getMessage() . "\n";
        $errors++;
    }
}

echo "\n=====================================================================\n";
echo "UPLOAD SUMMARY\n";
echo "=====================================================================\n\n";

echo "✅ Successfully uploaded: $uploaded records\n";
if ($errors > 0) {
    echo "⚠️  Errors encountered: $errors records\n";
}

// Verify upload
$stmt = $db->query("SELECT COUNT(*) as count FROM grants");
$finalCount = $stmt->fetch()['count'];

echo "\n📊 Database status:\n";
echo "   - Records in database: $finalCount\n";
echo "   - Records in file: " . count($grants) . "\n";

// Sample records
echo "\n📊 Sample updated records (first 5):\n";
$stmt = $db->query("SELECT title, funding_agency, amount, country, website FROM grants ORDER BY id LIMIT 5");
while ($row = $stmt->fetch()) {
    echo "   - " . $row['title'] . " | " . $row['funding_agency'] . " | $" . number_format($row['amount']) . " | " . $row['country'] . " | " . ($row['website'] ? 'Has URL' : 'No URL') . "\n";
}

echo "\n✅ UPLOAD COMPLETE!\n";
?>

