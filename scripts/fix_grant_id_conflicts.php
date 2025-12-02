<?php
/**
 * FIX GRANT ID CONFLICTS
 * 
 * This script fixes duplicate ID conflicts in grants data
 */

$data_file = 'data_master/verified/grants/master_grants.json';

if (!file_exists($data_file)) {
    echo "❌ File not found: $data_file\n";
    exit(1);
}

echo "======================================================================\n";
echo "FIX GRANT ID CONFLICTS\n";
echo "======================================================================\n\n";

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    echo "❌ Invalid JSON file or empty data\n";
    exit(1);
}

echo "📊 Original grants count: " . count($data) . "\n\n";

// Check for duplicate IDs
$id_counts = [];
foreach ($data as $grant) {
    $id = (string)($grant['id'] ?? '');
    $id_counts[$id] = ($id_counts[$id] ?? 0) + 1;
}

$duplicates = array_filter($id_counts, function($count) { return $count > 1; });

if (count($duplicates) > 0) {
    echo "⚠️  Found " . count($duplicates) . " duplicate IDs\n";
    
    // Get max ID
    $max_id = 0;
    foreach ($data as $grant) {
        $id = (int)($grant['id'] ?? 0);
        if ($id > $max_id) {
            $max_id = $id;
        }
    }
    
    // Fix duplicates by reassigning IDs
    $used_ids = [];
    $new_id = $max_id + 1;
    
    foreach ($data as $index => $grant) {
        $id = (string)($grant['id'] ?? '');
        if (isset($used_ids[$id])) {
            // This ID was already used, assign a new one
            $data[$index]['id'] = (string)$new_id++;
            echo "   Fixed duplicate ID $id -> " . $data[$index]['id'] . " (" . ($grant['title'] ?? 'Unknown') . ")\n";
        } else {
            $used_ids[$id] = true;
        }
    }
    
    echo "\n✅ Fixed all duplicate IDs\n";
} else {
    echo "✅ No duplicate IDs found\n";
}

// Save updated data
if (file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo "\n✅ Saved updated data to: $data_file\n";
} else {
    echo "❌ Failed to save updated data\n";
    exit(1);
}

echo "\n📊 Final grants count: " . count($data) . "\n";
?>

