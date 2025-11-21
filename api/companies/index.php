<?php
// Route companies requests directly to get_companies.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_once __DIR__ . '/get_companies.php';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once __DIR__ . '/../companies/create_company.php';
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
