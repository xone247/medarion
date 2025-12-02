<?php
/**
 * DEDUPLICATE MASTER DEALS JSON FILE
 * 
 * This script removes duplicate deals from master_deals.json,
 * keeping only one record per unique combination of:
 * - company_name
 * - deal_type
 * - deal_date
 * - amount
 */

$data_file = 'data_master/verified/deals/master_deals.json';

if (!file_exists($data_file)) {
    echo "❌ File not found: $data_file\n";
    exit(1);
}

echo "======================================================================\n";
echo "DEDUPLICATE MASTER DEALS JSON FILE\n";
echo "======================================================================\n\n";

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    echo "❌ Invalid JSON file or empty data\n";
    exit(1);
}

echo "📊 Original deals count: " . count($data) . "\n\n";

// Track unique deals and duplicates
$unique = [];
$duplicates = [];
$duplicateCount = 0;

foreach ($data as $index => $deal) {
    $key = strtolower(trim($deal['company_name'] ?? '')) . '|' . 
           strtolower(trim($deal['deal_type'] ?? '')) . '|' . 
           trim($deal['deal_date'] ?? '') . '|' . 
           ($deal['amount'] ?? 0);
    
    if (isset($unique[$key])) {
        // This is a duplicate
        if (!isset($duplicates[$key])) {
            $duplicates[$key] = [$unique[$key], $deal];
            $duplicateCount += 2; // Both the original and this one
        } else {
            $duplicates[$key][] = $deal;
            $duplicateCount++;
        }
    } else {
        $unique[$key] = $deal;
    }
}

echo "📊 Unique deals: " . count($unique) . "\n";
echo "📊 Duplicate groups: " . count($duplicates) . "\n";
echo "📊 Total duplicate records: " . $duplicateCount . "\n\n";

if (count($duplicates) === 0) {
    echo "✅ No duplicates found. File is clean!\n";
    exit(0);
}

// Show some examples
echo "======================================================================\n";
echo "SAMPLE DUPLICATES (first 10)\n";
echo "======================================================================\n\n";

$sampleCount = 0;
foreach ($duplicates as $key => $dups) {
    if ($sampleCount >= 10) break;
    $parts = explode('|', $key);
    echo "   Company: " . $parts[0] . "\n";
    echo "   Deal Type: " . $parts[1] . "\n";
    echo "   Date: " . $parts[2] . "\n";
    echo "   Amount: $" . number_format($parts[3], 2) . "\n";
    echo "   Duplicate count: " . count($dups) . "\n\n";
    $sampleCount++;
}

// Create deduplicated array (keep first occurrence of each unique key)
$deduplicated = array_values($unique);

// Backup original file
$backup_file = $data_file . '.backup.' . date('Y-m-d_His');
copy($data_file, $backup_file);
echo "✅ Created backup: $backup_file\n\n";

// Save deduplicated data
file_put_contents($data_file, json_encode($deduplicated, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

echo "======================================================================\n";
echo "DEDUPLICATION SUMMARY\n";
echo "======================================================================\n\n";
echo "✅ Removed " . $duplicateCount . " duplicate records\n";
echo "📊 Original count: " . count($data) . "\n";
echo "📊 Final count: " . count($deduplicated) . "\n";
echo "✅ Saved deduplicated data to: $data_file\n";
echo "✅ Backup saved to: $backup_file\n";

