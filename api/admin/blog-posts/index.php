<?php
// Route to main blog-posts.php handler
// This file handles requests to /api/admin/blog-posts/
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Directly include the main blog-posts handler without modifying REQUEST_URI
// The handler will read from $_GET and $_POST as needed
// Path: api/admin/blog-posts/index.php -> api/admin/blog-posts.php
require __DIR__ . '/../blog-posts.php';
?>