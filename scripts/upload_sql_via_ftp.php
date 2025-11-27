<?php
/**
 * Upload SQL file to cPanel via FTP
 * Uses PHP's built-in FTP functions
 */

$ftp_config = [
    'host' => 'ftp.medarion.africa',
    'username' => 'medarion@medarion.africa',
    'password' => 'Neorage94',
    'port' => 21,
    'remote_path' => '/public_html'
];

$sql_file = __DIR__ . '/../database_export_for_cpanel.sql';
$import_script = __DIR__ . '/upload_to_cpanel_server.php';

if (!file_exists($sql_file)) {
    echo "❌ SQL file not found: $sql_file\n";
    exit(1);
}

echo "Connecting to FTP server...\n";

try {
    // Try using PHP's built-in FTP functions
    $conn_id = ftp_connect($ftp_config['host'], $ftp_config['port']);
    
    if (!$conn_id) {
        throw new Exception("Could not connect to FTP server");
    }
    
    echo "✅ Connected to FTP server\n";
    echo "Logging in...\n";
    
    $login_result = ftp_login($conn_id, $ftp_config['username'], $ftp_config['password']);
    
    if (!$login_result) {
        throw new Exception("FTP login failed");
    }
    
    echo "✅ Logged in successfully\n";
    
    // Enable passive mode
    ftp_pasv($conn_id, true);
    
    // Upload SQL file
    echo "\nUploading SQL file...\n";
    $remote_sql = $ftp_config['remote_path'] . '/database_export_for_cpanel.sql';
    
    if (ftp_put($conn_id, $remote_sql, $sql_file, FTP_BINARY)) {
        echo "✅ SQL file uploaded successfully\n";
        echo "   Remote path: $remote_sql\n";
    } else {
        throw new Exception("Failed to upload SQL file");
    }
    
    // Upload import script
    if (file_exists($import_script)) {
        echo "\nUploading import script...\n";
        $remote_script = $ftp_config['remote_path'] . '/import_database.php';
        
        if (ftp_put($conn_id, $remote_script, $import_script, FTP_ASCII)) {
            echo "✅ Import script uploaded successfully\n";
            echo "   Remote path: $remote_script\n";
            echo "\n📝 Next steps:\n";
            echo "   1. Visit: https://medarion.africa/import_database.php\n";
            echo "   2. Or run via SSH: php ~/public_html/import_database.php\n";
        } else {
            echo "⚠️  Failed to upload import script (you can upload manually)\n";
        }
    }
    
    ftp_close($conn_id);
    
    echo "\n✅ Upload complete!\n";
    echo "\nTo import the database:\n";
    echo "   Option 1: Visit https://medarion.africa/import_database.php\n";
    echo "   Option 2: Use phpMyAdmin to import database_export_for_cpanel.sql\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nAlternative: Upload manually via cPanel File Manager:\n";
    echo "   1. Go to: https://medarion.africa:2083\n";
    echo "   2. Navigate to: Files → File Manager → public_html\n";
    echo "   3. Upload: database_export_for_cpanel.sql\n";
    echo "   4. Use phpMyAdmin to import the file\n";
    exit(1);
}

