<?php
// Admin API router - routes requests to appropriate handlers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the endpoint from the path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Find 'admin' in path and get what comes after
$adminIndex = array_search('admin', $pathParts);
if ($adminIndex !== false && isset($pathParts[$adminIndex + 1])) {
    $endpoint = $pathParts[$adminIndex + 1];
    
    // Route to appropriate handler
    $handlerFile = __DIR__ . '/' . $endpoint . '.php';
    if (file_exists($handlerFile)) {
        require $handlerFile;
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Endpoint not found: ' . $endpoint]);
    }
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Invalid admin API path']);
}
?>

