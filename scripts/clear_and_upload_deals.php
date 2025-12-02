<?php
/**
 * CLEAR OLD AND UPLOAD ACCURATE DEALS DATA
 * 
 * This script clears existing deals data from the database
 * and uploads the latest accurate data from master_deals.json
 */

// Database configuration
$db_config = [
    'host' => 'localhost',
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => ''
];

echo "======================================================================\n";
echo "CLEAR OLD AND UPLOAD ACCURATE DEALS DATA\n";
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

// Load deals data
$dealsFile = __DIR__ . '/../data_master/verified/deals/master_deals.json';
if (!file_exists($dealsFile)) {
    die("❌ Deals file not found: $dealsFile\n");
}

$deals = json_decode(file_get_contents($dealsFile), true);
if (!$deals) {
    die("❌ Failed to parse deals JSON\n");
}

echo "📊 Loaded " . count($deals) . " records from file\n";

// Check current database count
$stmt = $db->query("SELECT COUNT(*) as count FROM deals");
$currentCount = $stmt->fetch()['count'];
echo "📊 Current records in database: {$currentCount}\n\n";

echo "======================================================================\n";
echo "STEP 1: CLEARING OLD DEALS DATA\n";
echo "======================================================================\n\n";

try {
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    $db->exec("TRUNCATE TABLE deals");
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "🗑️  Clearing old data...\n";
    echo "✅ Cleared all old deals data\n\n";
} catch (PDOException $e) {
    echo "⚠️  Error clearing data: " . $e->getMessage() . "\n";
    echo "   Continuing with upload...\n\n";
}

echo "======================================================================\n";
echo "STEP 2: UPLOADING ACCURATE DATA TO DATABASE\n";
echo "======================================================================\n\n";

// Get all existing company IDs for foreign key matching
$companyIds = [];
try {
    $stmt = $db->query("SELECT id, name FROM companies");
    while ($row = $stmt->fetch()) {
        $companyIds[strtolower(trim($row['name']))] = $row['id'];
    }
} catch (PDOException $e) {
    echo "⚠️  Could not fetch company IDs: " . $e->getMessage() . "\n";
}

// Prepare insert statement
$fields = ['id', 'company_id', 'company_name', 'deal_type', 'amount', 'valuation', 'lead_investor', 'participants', 'deal_date', 'status', 'sector', 'country', 'description', 'source_url'];
$field_list = implode(', ', $fields);
$placeholders = ':' . implode(', :', $fields);
$insert_sql = "INSERT INTO deals ($field_list, created_at, updated_at) VALUES ($placeholders, NOW(), NOW())";

$stmt_insert = $db->prepare($insert_sql);

$uploaded = 0;
$errors = 0;

foreach ($deals as $index => $deal) {
    try {
        // Match company_id if company_name exists
        $companyId = null;
        if (!empty($deal['company_name'])) {
            $companyNameKey = strtolower(trim($deal['company_name']));
            $companyId = $companyIds[$companyNameKey] ?? null;
        }
        
        // Use existing company_id if set and valid, otherwise use matched ID, or NULL
        if (!empty($deal['company_id'])) {
            // Check if the company_id exists in database
            $checkId = (int)$deal['company_id'];
            if (!in_array($checkId, array_values($companyIds))) {
                // Company ID doesn't exist, set to NULL or matched ID
                $deal['company_id'] = $companyId;
            } else {
                // Keep existing valid company_id
                $deal['company_id'] = $checkId;
            }
        } else {
            // No company_id set, use matched ID or NULL
            $deal['company_id'] = $companyId;
        }
        
        // Ensure participants is JSON string
        if (isset($deal['participants'])) {
            if (is_array($deal['participants'])) {
                $deal['participants'] = json_encode($deal['participants'], JSON_UNESCAPED_UNICODE);
            } elseif (is_string($deal['participants']) && !json_decode($deal['participants'])) {
                // If it's a string but not valid JSON, wrap it
                $deal['participants'] = json_encode([$deal['participants']], JSON_UNESCAPED_UNICODE);
            }
        } else {
            $deal['participants'] = null;
        }
        
        // Normalize deal_type - ensure it matches database ENUM exactly
        // Database ENUM: 'seed', 'series_a', 'series_b', 'series_c', 'series_d', 'ipo', 'acquisition', 'merger'
        $dealType = trim($deal['deal_type'] ?? '');
        if (empty($dealType)) {
            $dealType = 'seed'; // Default to seed if missing
        }
        
        // Comprehensive mapping to database ENUM values (lowercase with underscores)
        $dealTypeMap = [
            'pre-seed' => 'seed',
            'pre_seed' => 'seed',
            'pre seed' => 'seed',
            'seed' => 'seed',
            'series a' => 'series_a',
            'series_a' => 'series_a',
            'seriesa' => 'series_a',
            'series b' => 'series_b',
            'series_b' => 'series_b',
            'seriesb' => 'series_b',
            'series c' => 'series_c',
            'series_c' => 'series_c',
            'seriesc' => 'series_c',
            'series d' => 'series_d',
            'series_d' => 'series_d',
            'seriesd' => 'series_d',
            'private equity' => 'series_a', // Map to series_a as closest match
            'private_equity' => 'series_a',
            'privateequity' => 'series_a',
            'pe' => 'series_a',
            'grant' => 'seed', // Map grants to seed
            'acquisition' => 'acquisition',
            'acquired' => 'acquisition',
            'merge' => 'merger',
            'merger' => 'merger',
            'ipo' => 'ipo'
        ];
        
        $dealTypeLower = strtolower(trim($dealType));
        
        // Check if already in correct format (database ENUM values)
        $validTypes = ['seed', 'series_a', 'series_b', 'series_c', 'series_d', 'ipo', 'acquisition', 'merger'];
        $isValid = false;
        foreach ($validTypes as $validType) {
            if ($dealTypeLower === $validType) {
                $deal['deal_type'] = $validType; // Use exact ENUM value
                $isValid = true;
                break;
            }
        }
        
        // If not already valid, use mapping
        if (!$isValid && isset($dealTypeMap[$dealTypeLower])) {
            $deal['deal_type'] = $dealTypeMap[$dealTypeLower];
        } elseif (!$isValid) {
            // Try to match "Series A", "Series B", etc. (with space and capital)
            if (preg_match('/series\s+([a-d])/i', $dealTypeLower, $matches)) {
                $deal['deal_type'] = 'series_' . strtolower($matches[1]);
            } else {
                // Default to seed if unrecognized
                $deal['deal_type'] = 'seed';
            }
        }
        
        // Ensure status is valid
        $validStatuses = ['announced', 'closed', 'pending', 'cancelled'];
        if (!in_array($deal['status'] ?? '', $validStatuses)) {
            $deal['status'] = 'closed';
        }
        
        // Prepare parameters
        $params = [];
        foreach ($fields as $field) {
            $value = $deal[$field] ?? null;
            
            // Handle numeric fields
            if (in_array($field, ['id', 'company_id']) && $value !== null) {
                $value = (int)$value;
            }
            if (in_array($field, ['amount', 'valuation']) && $value !== null) {
                $value = (float)$value;
            }
            
            $params[":$field"] = $value;
        }
        
        $stmt_insert->execute($params);
        $uploaded++;
        
        if ($uploaded % 10 == 0) {
            echo "   Uploaded: {$uploaded} records...\n";
        }
    } catch (PDOException $e) {
        $errors++;
        if ($errors <= 5) {
            echo "   ❌ Error uploading record " . ($index + 1) . " (" . ($deal['company_name'] ?? 'Unknown') . "): " . $e->getMessage() . "\n";
        }
    }
}

echo "\n=====================================================================\n";
echo "UPLOAD SUMMARY\n";
echo "=====================================================================\n\n";

echo "✅ Successfully uploaded: {$uploaded} records\n";
if ($errors > 0) {
    echo "⚠️  Errors encountered: {$errors} records\n";
}

// Verify database status
$stmt = $db->query("SELECT COUNT(*) as count FROM deals");
$dbCount = $stmt->fetch()['count'];

echo "\n📊 Database status:\n";
echo "   - Records in database: {$dbCount}\n";
echo "   - Records in file: " . count($deals) . "\n";

// Sample records
echo "\n📊 Sample updated records (first 5):\n";
$stmt = $db->query("SELECT company_name, deal_type, amount, deal_date, country FROM deals ORDER BY deal_date DESC LIMIT 5");
$samples = $stmt->fetchAll();
foreach ($samples as $sample) {
    $amount = number_format($sample['amount'], 0);
    echo "   - {$sample['company_name']}: {$sample['deal_type']} - \${$amount} ({$sample['deal_date']}) - {$sample['country']}\n";
}

echo "\n✅ UPLOAD COMPLETE!\n";

