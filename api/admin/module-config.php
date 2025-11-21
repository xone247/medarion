<?php
// Admin Module Config API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // Get module configuration for specific email
        $email = $_GET['email'] ?? '';
        
        if (!$email) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email parameter is required']);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT modules, module_order FROM user_modules WHERE email = ?");
        $stmt->execute([$email]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            $modules = json_decode($result['modules'], true) ?? [];
            $moduleOrder = json_decode($result['module_order'], true) ?? [];
        } else {
            // Return default modules
            $modules = ['dashboard', 'companies', 'deals', 'grants', 'clinical-trials'];
            $moduleOrder = ['dashboard', 'companies', 'deals', 'grants', 'clinical-trials'];
        }
        
        echo json_encode([
            'success' => true,
            'modules' => $modules,
            'moduleOrder' => $moduleOrder
        ]);
        
    } elseif ($method === 'POST') {
        // Save module configuration
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['email']) || !isset($input['modules']) || !isset($input['moduleOrder'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email, modules, and moduleOrder are required']);
            exit;
        }
        
        $email = $input['email'];
        $modules = json_encode($input['modules']);
        $moduleOrder = json_encode($input['moduleOrder']);
        
        // Check if config exists
        $stmt = $pdo->prepare("SELECT id FROM user_modules WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing config
            $stmt = $pdo->prepare("UPDATE user_modules SET modules = ?, module_order = ?, updated_at = NOW() WHERE email = ?");
            $stmt->execute([$modules, $moduleOrder, $email]);
        } else {
            // Create new config
            $stmt = $pdo->prepare("INSERT INTO user_modules (email, modules, module_order, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
            $stmt->execute([$email, $modules, $moduleOrder]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Module configuration saved successfully'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
