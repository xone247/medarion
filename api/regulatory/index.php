<?php
// Route regulatory requests directly to get_regulatory.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Prevent output before include
ob_start();
require_once __DIR__ . '/get_regulatory.php';
$output = ob_get_clean();

// Only output if it's JSON (to prevent HTML errors)
if (trim($output)) {
    $decoded = json_decode($output, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo $output;
    } else {
        // If not JSON, just output it (might be an error message)
        echo $output;
    }
}
?>

