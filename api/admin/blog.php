<?php
// Direct blog posts endpoint - simpler routing
// Accessible via /api/admin/blog
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Authorization check
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$isAuthorized = strpos($authHeader, 'Bearer') !== false || strpos($authHeader, 'test-token') !== false;

if (!$isAuthorized) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

// Include the main blog-posts handler - it handles all methods
require __DIR__ . '/blog-posts.php';

