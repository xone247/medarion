<?php
/**
 * Cleanup Temporary Files
 * Remove temporary files and keep only verified data and scraping setup
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "CLEANUP TEMPORARY FILES\n";
echo "=" . str_repeat("=", 69) . "\n\n";

$files_to_remove = [
    // Temporary export files
    'data_master/verified/companies/db_companies_export.json',
    'data_master/verified/companies/merged_enriched_companies.json',
    
    // Temporary markdown reports
    'VERIFIED_DATA_FILES_STATUS.md',
    'VERIFIED_DATA_QUALITY_REPORT.md',
    'FINAL_VERIFIED_DATA_CHECK_REPORT.md',
    'VERIFIED_DATA_RESTORATION_COMPLETE.md',
    'DATA_ENRICHMENT_COMPLETE.md',
    
    // Temporary SQL dumps (keep most recent one)
    // We'll keep the most recent SQL dump for backup
];

$scripts_to_remove = [
    'scripts/export_all_data_from_database.php',
    'scripts/restore_verified_data_from_sql.php',
    'scripts/create_empty_data_files.php',
    'scripts/check_all_verified_data_files.php',
    'scripts/check_specific_companies.php',
    'scripts/check_zipline.php',
    'scripts/check_all_data_types_status.php',
    'scripts/verify_database_clear.php',
    'scripts/clear_all_data_except_companies.php',
    'scripts/merge_and_enrich_companies.php',
    'scripts/upload_enriched_companies.php',
    'scripts/process_company_data_comprehensive.php',
    'scripts/enrich_extracted_data.php',
    'scripts/verify_final_database_state.php',
    'scripts/fix_clinical_centers_addresses.php',
    'scripts/final_data_completeness_check.php',
    'scripts/verify_and_enrich_all_data.php',
];

$removed_files = 0;
$removed_scripts = 0;

echo "📋 Removing temporary files...\n";
foreach ($files_to_remove as $file) {
    if (file_exists($file)) {
        unlink($file);
        echo "   ✅ Removed: $file\n";
        $removed_files++;
    }
}

echo "\n📋 Removing temporary scripts...\n";
foreach ($scripts_to_remove as $script) {
    if (file_exists($script)) {
        unlink($script);
        echo "   ✅ Removed: $script\n";
        $removed_scripts++;
    }
}

echo "\n";
echo "=" . str_repeat("=", 69) . "\n";
echo "CLEANUP SUMMARY\n";
echo "=" . str_repeat("=", 69) . "\n\n";
echo "✅ Removed $removed_files temporary files\n";
echo "✅ Removed $removed_scripts temporary scripts\n\n";

echo "📁 KEPT FILES:\n";
echo "   ✅ Verified data files in data_master/verified/\n";
echo "   ✅ extract_investors_from_companies.php (useful for future)\n";
echo "   ✅ Crunchbase scraping scripts\n";
echo "   ✅ Database upload scripts\n\n";

echo "=" . str_repeat("=", 69) . "\n";
echo "✅ CLEANUP COMPLETE!\n";
echo "=" . str_repeat("=", 69) . "\n";

