<?php
// Admin User Overrides API endpoint
// Handles user override management

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Include database configuration
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    // Get authorization header
    $authHeader = '';
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    $authHeader = $authHeader ?: $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authorization token required']);
        exit;
    }
    
    $token = $matches[1];
    
    // Verify token and get user (for development, accept any token)
    if ($token === 'test-token' || $token === 'fa94514ca42c48cfa41169149682e998255606aef74c35fb1936cafb06b5a778') {
        // Get admin user
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND is_active = 1");
        $stmt->execute(['superadmin@medarion.com']);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Admin user not found']);
            exit;
        }
    } else {
        // For any other token, try to find the user by token (if you have a token-based auth system)
        // For now, just accept any token for development
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND is_active = 1");
        $stmt->execute([1]); // Default to user ID 1 for development
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid token']);
            exit;
        }
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if user_overrides table exists, if not create it
    $stmt = $pdo->query("SHOW TABLES LIKE 'user_overrides'");
    if (!$stmt->fetch()) {
        $createTableSql = "
            CREATE TABLE user_overrides (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(100) NOT NULL,
                account_tier VARCHAR(50) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                company_name VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                app_roles JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ";
        $pdo->exec($createTableSql);
        
        // Insert some default overrides
        $defaultOverrides = [
            ['superadmin@medarion.com', 'admin', 'enterprise', 'Super Admin', 'Medarion Platform', true, '["Super Admin","Admin Dashboard","Users Manager","Blog Manager","Ads Manager","Modules Manager","Config Manager"]'],
            ['admin@demo.medarion.com', 'admin', 'enterprise', 'Admin User', 'Medarion Platform', true, '["Admin Dashboard","Users Manager","Blog Manager"]'],
            ['startup@demo.medarion.com', 'startup', 'free', 'Tech Startup', 'TechStartup Ltd', false, '["User"]'],
            ['investor@demo.medarion.com', 'investor', 'enterprise', 'Sarah Investor', 'HealthTech Ventures', false, '["User","Investor"]']
        ];
        
        $stmt = $pdo->prepare("
            INSERT INTO user_overrides (email, role, account_tier, full_name, company_name, is_admin, app_roles) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($defaultOverrides as $override) {
            $stmt->execute($override);
        }
    }
    
    switch ($method) {
        case 'GET':
            // Get all user overrides
            $stmt = $pdo->query("SELECT * FROM user_overrides ORDER BY created_at DESC");
            $overrides = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format overrides
            $formattedOverrides = array_map(function($override) {
                return [
                    'id' => (int)$override['id'],
                    'email' => $override['email'],
                    'role' => $override['role'],
                    'account_tier' => $override['account_tier'],
                    'full_name' => $override['full_name'],
                    'company_name' => $override['company_name'],
                    'is_admin' => (bool)$override['is_admin'],
                    'app_roles' => json_decode($override['app_roles'] ?? '[]', true),
                    'created_at' => $override['created_at'],
                    'updated_at' => $override['updated_at']
                ];
            }, $overrides);
            
            echo json_encode([
                'success' => true,
                'users' => $formattedOverrides
            ]);
            break;
            
        case 'POST':
            // Create new user override
            if (!$input || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Email is required']);
                exit;
            }
            
            // Check if override already exists
            $stmt = $pdo->prepare("SELECT id FROM user_overrides WHERE email = ?");
            $stmt->execute([$input['email']]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'User override already exists']);
                exit;
            }
            
            // Create override
            $stmt = $pdo->prepare("
                INSERT INTO user_overrides (
                    email, role, account_tier, full_name, company_name, is_admin, app_roles
                ) VALUES (
                    :email, :role, :account_tier, :full_name, :company_name, :is_admin, :app_roles
                )
            ");
            
            $stmt->execute([
                ':email' => $input['email'],
                ':role' => $input['role'] ?? 'startup',
                ':account_tier' => $input['accountTier'] ?? 'free',
                ':full_name' => $input['fullName'] ?? '',
                ':company_name' => $input['companyName'] ?? null,
                ':is_admin' => $input['isAdmin'] ?? false,
                ':app_roles' => json_encode($input['appRoles'] ?? [])
            ]);
            
            $overrideId = $pdo->lastInsertId();
            
            // Get the created override
            $stmt = $pdo->prepare("SELECT * FROM user_overrides WHERE id = ?");
            $stmt->execute([$overrideId]);
            $newOverride = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => (int)$newOverride['id'],
                    'email' => $newOverride['email'],
                    'role' => $newOverride['role'],
                    'account_tier' => $newOverride['account_tier'],
                    'full_name' => $newOverride['full_name'],
                    'company_name' => $newOverride['company_name'],
                    'is_admin' => (bool)$newOverride['is_admin'],
                    'app_roles' => json_decode($newOverride['app_roles'], true),
                    'created_at' => $newOverride['created_at'],
                    'updated_at' => $newOverride['updated_at']
                ]
            ]);
            break;
            
        case 'DELETE':
            // Delete user override
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Override ID is required']);
                exit;
            }
            
            $overrideId = $input['id'];
            $stmt = $pdo->prepare("DELETE FROM user_overrides WHERE id = ?");
            $stmt->execute([$overrideId]);
            
            echo json_encode(['success' => true, 'message' => 'User override deleted successfully']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>