<?php
/**
 * Upload All Updated Data Types to Local Database
 * For testing before uploading to production
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "UPLOAD ALL UPDATED DATA TYPES (LOCAL)\n";
echo "=" . str_repeat("=", 69) . "\n\n";

// Use local database for testing
$db_config = [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'medarion_platform',  // Local database name
    'username' => 'root',
    'password' => '',  // XAMPP default
    'charset' => 'utf8mb4'
];

echo "📋 Database Configuration (LOCAL):\n";
echo "   Host: {$db_config['host']}\n";
echo "   Database: {$db_config['database']}\n";
echo "   Username: {$db_config['username']}\n\n";

// Connect to database
try {
    $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['database']};charset={$db_config['charset']}";
    $db = new PDO($dsn, $db_config['username'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    echo "✅ Connected to local database\n\n";
} catch(PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage() . "\n\n💡 Make sure:\n   1. XAMPP MySQL is running\n   2. Database 'medarion_platform' exists\n   3. Run: CREATE DATABASE IF NOT EXISTS medarion_platform;\n");
}

// Data files mapping
$data_files = [
    'deals' => 'data_master/verified/deals/master_deals.json',
    'grants' => 'data_master/verified/grants/master_grants.json',
    'investors' => 'data_master/verified/investors/master_investors.json',
    'investigators' => 'data_master/verified/investigators/master_investigators.json',
    'clinical_centers' => 'data_master/verified/clinical_centers/master_clinical_centers.json',
    'regulatory_bodies' => 'data_master/verified/regulatory_bodies/master_regulatory_bodies.json',
    'clinical_trials' => 'data_master/verified/clinical_trials/master_clinical_trials.json',
    'public_stocks' => 'data_master/verified/public_stocks/master_public_stocks.json',
    'nation_pulse' => 'data_master/verified/nation_pulse/master_nation_pulse.json'
];

$results = [];

// Helper function to upload data
function uploadData($db, $table, $data, $fields, $id_field = 'id') {
    $added = 0;
    $updated = 0;
    
    // Handle tables that might not have created_at/updated_at
    $has_timestamps = true;
    try {
        $db->query("SELECT created_at, updated_at FROM $table LIMIT 1");
    } catch (Exception $e) {
        $has_timestamps = false;
    }
    
    $field_list = implode(', ', $fields);
    $placeholders = ':' . implode(', :', $fields);
    
    if ($has_timestamps) {
        $field_list .= ', created_at, updated_at';
        $placeholders .= ', NOW(), NOW()';
    }
    
    $stmt_check = $db->prepare("SELECT $id_field FROM $table WHERE $id_field = :id");
    $stmt_insert = $db->prepare("INSERT INTO $table ($field_list) VALUES ($placeholders)");
    
    // Build update statement
    $update_fields = [];
    foreach ($fields as $field) {
        if ($field !== $id_field) {
            $update_fields[] = "$field = :$field";
        }
    }
    
    // Check if table has updated_at
    $has_updated_at = true;
    try {
        $db->query("SELECT updated_at FROM $table LIMIT 1");
    } catch (Exception $e) {
        $has_updated_at = false;
    }
    
    if ($has_updated_at) {
        $update_sql = "UPDATE $table SET " . implode(', ', $update_fields) . ", updated_at = NOW() WHERE $id_field = :id";
    } else {
        $update_sql = "UPDATE $table SET " . implode(', ', $update_fields) . " WHERE $id_field = :id";
    }
    $stmt_update = $db->prepare($update_sql);
    
    foreach ($data as $row) {
        $stmt_check->execute([':id' => $row[$id_field]]);
        $exists = $stmt_check->fetch();
        
        $params = [];
        foreach ($fields as $field) {
            $params[":$field"] = $row[$field] ?? null;
        }
        
        if ($exists) {
            $stmt_update->execute($params);
            $updated++;
        } else {
            $stmt_insert->execute($params);
            $added++;
        }
    }
    
    return ['added' => $added, 'updated' => $updated];
}

// Upload each data type
foreach ($data_files as $type => $file) {
    if (!file_exists($file)) {
        echo "⚠️  File not found: $file\n\n";
        continue;
    }
    
    echo "📋 UPLOADING " . strtoupper(str_replace('_', ' ', $type)) . "...\n";
    $data = json_decode(file_get_contents($file), true);
    
    if (!$data || !is_array($data)) {
        echo "   ⚠️  Invalid or empty data file\n\n";
        continue;
    }
    
    // Define fields for each table
    $table_fields = [
        'deals' => ['id', 'company_id', 'deal_type', 'amount', 'valuation', 'lead_investor', 'participants', 'deal_date', 'status', 'description', 'sector', 'company_name', 'country', 'source_url'],
        'grants' => ['id', 'title', 'description', 'funding_agency', 'funders', 'country', 'amount', 'duration', 'grant_type', 'sector', 'application_deadline', 'award_date', 'status', 'requirements', 'contact_email', 'website', 'duration_months', 'eligibility_criteria', 'application_process'],
        'investors' => ['id', 'name', 'slug', 'logo', 'description', 'type', 'headquarters', 'founded_year', 'founded', 'assets_under_management', 'website', 'focus_sectors', 'investment_stages', 'portfolio_companies', 'total_investments', 'average_investment', 'countries', 'team_size', 'contact_email', 'social_media', 'recent_investments', 'investment_criteria', 'portfolio_exits', 'is_active', 'total_invested', 'deal_count', 'avg_deal_size', 'sectors', 'geographic_focus', 'logo_url'],
        'investigators' => ['id', 'name', 'first_name', 'last_name', 'title', 'institution', 'specialization', 'affiliation', 'country', 'city', 'email', 'phone', 'specialties', 'therapeutic_areas', 'experience_years', 'education', 'certifications', 'bio', 'research_interests', 'trials_conducted', 'publications_count', 'website', 'linkedin_url', 'is_active'],
        'clinical_centers' => ['id', 'name', 'type', 'country', 'city', 'address', 'description', 'specialties', 'phases_supported', 'capacity_patients', 'established_year', 'specializations', 'certifications', 'contact_name', 'contact_email', 'contact_phone', 'website', 'active_trials_count', 'total_trials_completed', 'is_active'],
        'regulatory_bodies' => ['id', 'name', 'acronym', 'country', 'type', 'description', 'is_active', 'website', 'contact_email', 'contact_phone', 'address', 'approval_process_duration', 'requirements', 'abbreviation', 'logo_url'],
        'clinical_trials' => ['id', 'title', 'description', 'phase', 'medical_condition', 'intervention', 'sponsor', 'location', 'start_date', 'end_date', 'status', 'nct_number', 'indication', 'country', 'trial_id', 'company_id'],
        'public_stocks' => ['id', 'company_id', 'company_name', 'ticker', 'exchange', 'price', 'market_cap', 'currency', 'country', 'sector', 'last_updated'],
        'nation_pulse' => ['id', 'country', 'country_code', 'data_type', 'metric_name', 'metric_value', 'metric_unit', 'year', 'source']
    ];
    
    $table_name = $type === 'nation_pulse' ? 'nation_pulse_data' : $type;
    $fields = $table_fields[$type] ?? [];
    
    if (empty($fields)) {
        echo "   ⚠️  No field mapping defined for $type\n\n";
        continue;
    }
    
    try {
        // For deals, handle foreign key constraint by setting company_id to NULL if company doesn't exist
        if ($type === 'deals') {
            // First, get all existing company IDs
            $company_ids = $db->query("SELECT id FROM companies")->fetchAll(PDO::FETCH_COLUMN);
            $company_ids = array_map('intval', $company_ids);
            
            // Update deals data to set company_id to NULL if company doesn't exist
            foreach ($data as &$deal) {
                if ($deal['company_id'] && !in_array(intval($deal['company_id']), $company_ids)) {
                    $deal['company_id'] = null;
                }
            }
            unset($deal);
        }
        
        // For investors, generate slug if missing
        if ($type === 'investors') {
            foreach ($data as &$investor) {
                if (empty($investor['slug']) && !empty($investor['name'])) {
                    $investor['slug'] = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $investor['name']), '-'));
                }
            }
            unset($investor);
        }
        
        // For investigators, split name into first_name and last_name if missing
        if ($type === 'investigators') {
            foreach ($data as &$investigator) {
                if (empty($investigator['first_name']) && !empty($investigator['name'])) {
                    $name_parts = explode(' ', trim($investigator['name']), 2);
                    $investigator['first_name'] = $name_parts[0] ?? '';
                    $investigator['last_name'] = $name_parts[1] ?? '';
                }
            }
            unset($investigator);
        }
        
        $stats = uploadData($db, $table_name, $data, $fields);
        echo "   ✓ Added: {$stats['added']}, Updated: {$stats['updated']}\n\n";
        $results[$type] = ['total' => count($data), 'added' => $stats['added'], 'updated' => $stats['updated']];
    } catch (Exception $e) {
        echo "   ❌ Error: " . $e->getMessage() . "\n\n";
        $results[$type] = ['total' => count($data), 'error' => $e->getMessage()];
    }
}

// Summary
echo "=" . str_repeat("=", 69) . "\n";
echo "UPLOAD SUMMARY\n";
echo "=" . str_repeat("=", 69) . "\n\n";

foreach ($results as $type => $stats) {
    echo strtoupper(str_replace('_', ' ', $type)) . ":\n";
    echo "   Total: {$stats['total']}\n";
    if (isset($stats['error'])) {
        echo "   ❌ Error: {$stats['error']}\n";
    } else {
        echo "   Added: {$stats['added']}\n";
        echo "   Updated: {$stats['updated']}\n";
    }
    echo "\n";
}

echo "=" . str_repeat("=", 69) . "\n";
echo "✅ UPLOAD COMPLETE!\n";
echo "=" . str_repeat("=", 69) . "\n";
echo "\n💡 Next Steps:\n";
echo "   1. Check your local website to see how data displays\n";
echo "   2. Review design and make adjustments if needed\n";
echo "   3. Once satisfied, upload to production database\n";
echo "\n";

