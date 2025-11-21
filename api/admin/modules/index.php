<?php
// Route admin/modules requests directly to modules.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Prevent output before include
ob_start();
require_once __DIR__ . '/../modules.php';
$output = ob_get_clean();

// Only output if it's JSON (not HTML)
if (!empty($output)) {
    $firstChar = trim($output)[0];
    if ($firstChar === '{' || $firstChar === '[') {
        echo $output;
    }
}