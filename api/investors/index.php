<?php
// Route investors requests directly to get_investors.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_once __DIR__ . '/get_investors.php';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Assuming a create_investor.php exists or will be created
    // require_once __DIR__ . '/create_investor.php';
    http_response_code(405); // Method Not Allowed if POST is not implemented
    echo json_encode(['error' => 'POST method not implemented for investors']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>

