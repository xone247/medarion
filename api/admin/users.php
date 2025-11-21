<?php
// Admin Users API endpoint
// Handles user management operations

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
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
    
    switch ($method) {
        case 'GET':
            // Get users with pagination and filters
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $search = $_GET['search'] ?? '';
            $role = $_GET['role'] ?? '';
            $status = $_GET['status'] ?? '';
            
            $offset = ($page - 1) * $limit;
            
            // Build query
            $whereConditions = ['1=1'];
            $params = [];
            
            if (!empty($search)) {
                $whereConditions[] = "(first_name LIKE :search OR last_name LIKE :search OR email LIKE :search OR company_name LIKE :search)";
                $params[':search'] = "%{$search}%";
            }
            
            if (!empty($role)) {
                $whereConditions[] = "role = :role";
                $params[':role'] = $role;
            }
            
            if (!empty($status)) {
                if ($status === 'active') {
                    $whereConditions[] = "is_active = 1";
                } elseif ($status === 'inactive') {
                    $whereConditions[] = "is_active = 0";
                }
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            // Get total count
            $countSql = "SELECT COUNT(*) as total FROM users WHERE {$whereClause}";
            $stmt = $pdo->prepare($countSql);
            $stmt->execute($params);
            $total = $stmt->fetch()['total'];
            
            // Get users
            $sql = "SELECT * FROM users WHERE {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format users
            $formattedUsers = array_map(function($user) {
                return [
                    'id' => (int)$user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'role' => $user['role'],
                    'account_tier' => $user['account_tier'] ?? 'free',
                    'user_type' => $user['role'], // Map role to user_type
                    'company_name' => $user['company_name'],
                    'phone' => $user['phone'],
                    'country' => $user['country'],
                    'city' => $user['city'],
                    'bio' => $user['bio'],
                    'profile_image' => $user['profile_image'],
                    'is_verified' => (bool)$user['is_verified'],
                    'is_active' => (bool)$user['is_active'],
                    'is_admin' => (bool)$user['is_admin'],
                    'app_roles' => json_decode($user['app_roles'] ?? '[]', true),
                    'dashboard_modules' => json_decode($user['dashboard_modules'] ?? '[]', true),
                    'ai_quota_used' => (int)($user['ai_quota_used'] ?? 0),
                    'ai_quota_reset_date' => $user['ai_quota_reset_date'],
                    'created_at' => $user['created_at'],
                    'updated_at' => $user['updated_at']
                ];
            }, $users);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'users' => $formattedUsers,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => (int)$total,
                        'pages' => (int)ceil($total / $limit)
                    ]
                ]
            ]);
            break;
            
        case 'POST':
            // Create new user
            if (!$input || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Email is required']);
                exit;
            }
            
            // Check if user already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$input['email']]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'User already exists']);
                exit;
            }
            
            // Create user
            $stmt = $pdo->prepare("
                INSERT INTO users (
                    username, email, password_hash, first_name, last_name, role, 
                    company_name, phone, country, city, bio, account_tier,
                    is_verified, is_active, is_admin, app_roles, created_at, updated_at
                ) VALUES (
                    :username, :email, :password_hash, :first_name, :last_name, :role,
                    :company_name, :phone, :country, :city, :bio, :account_tier,
                    :is_verified, :is_active, :is_admin, :app_roles, NOW(), NOW()
                )
            ");
            
            $stmt->execute([
                ':username' => $input['username'] ?? explode('@', $input['email'])[0],
                ':email' => $input['email'],
                ':password_hash' => password_hash($input['password'] ?? 'password123', PASSWORD_DEFAULT),
                ':first_name' => $input['first_name'] ?? '',
                ':last_name' => $input['last_name'] ?? '',
                ':role' => $input['role'] ?? 'startup',
                ':company_name' => $input['company_name'] ?? null,
                ':phone' => $input['phone'] ?? null,
                ':country' => $input['country'] ?? null,
                ':city' => $input['city'] ?? null,
                ':bio' => $input['bio'] ?? null,
                ':account_tier' => $input['account_tier'] ?? 'free',
                ':is_verified' => $input['is_verified'] ?? false,
                ':is_active' => $input['is_active'] ?? true,
                ':is_admin' => $input['is_admin'] ?? false,
                ':app_roles' => json_encode($input['app_roles'] ?? [])
            ]);
            
            $userId = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'id' => (int)$userId,
                'message' => 'User created successfully'
            ]);
            break;
            
        case 'PATCH':
            // Update user
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'User ID is required']);
                exit;
            }
            
            $userId = $input['id'];
            $action = $input['action'] ?? 'update';
            
            switch ($action) {
                case 'update':
                    // Update user fields
                    $updateFields = [];
                    $params = [':id' => $userId];
                    
                    $allowedFields = ['first_name', 'last_name', 'email', 'phone', 'company_name', 'country', 'city', 'bio', 'role', 'account_tier', 'is_verified', 'is_active', 'is_admin'];
                    
                    foreach ($allowedFields as $field) {
                        if (isset($input[$field])) {
                            $updateFields[] = "{$field} = :{$field}";
                            $params[":{$field}"] = $input[$field];
                        }
                    }
                    
                    if (isset($input['app_roles'])) {
                        $updateFields[] = "app_roles = :app_roles";
                        $params[':app_roles'] = json_encode($input['app_roles']);
                    }
                    
                    if (!empty($updateFields)) {
                        $updateFields[] = "updated_at = NOW()";
                        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = :id";
                        $stmt = $pdo->prepare($sql);
                        $stmt->execute($params);
                    }
                    break;
                    
                case 'verify':
                case 'unverify':
                    $verified = $action === 'verify';
                    $stmt = $pdo->prepare("UPDATE users SET is_verified = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$verified, $userId]);
                    break;
                    
                case 'activate':
                case 'deactivate':
                    $active = $action === 'activate';
                    $stmt = $pdo->prepare("UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$active, $userId]);
                    break;
                    
                case 'change_tier':
                    if (!isset($input['tier'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Tier is required']);
                        exit;
                    }
                    $stmt = $pdo->prepare("UPDATE users SET account_tier = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$input['tier'], $userId]);
                    break;
                    
                case 'change_role':
                    if (!isset($input['role'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Role is required']);
                        exit;
                    }
                    $stmt = $pdo->prepare("UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$input['role'], $userId]);
                    break;
                    
                case 'reset_password':
                    $newPassword = $input['password'] ?? 'password123';
                    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$passwordHash, $userId]);
                    break;
                    
                case 'update_app_roles':
                    if (!isset($input['app_roles'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'App roles are required']);
                        exit;
                    }
                    $stmt = $pdo->prepare("UPDATE users SET app_roles = ?, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([json_encode($input['app_roles']), $userId]);
                    break;
            }
            
            echo json_encode(['success' => true, 'message' => 'User updated successfully']);
            break;
            
        case 'DELETE':
            // Delete or modify user
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'User ID is required']);
                exit;
            }
            
            $userId = $input['id'];
            $action = $input['action'] ?? 'deactivate';
            
            switch ($action) {
                case 'delete':
                    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                    $stmt->execute([$userId]);
                    break;
                case 'deactivate':
                    $stmt = $pdo->prepare("UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$userId]);
                    break;
                case 'activate':
                    $stmt = $pdo->prepare("UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$userId]);
                    break;
                case 'block':
                    $stmt = $pdo->prepare("UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$userId]);
                    break;
                case 'suspend':
                    $stmt = $pdo->prepare("UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$userId]);
                    break;
            }
            
            echo json_encode(['success' => true, 'message' => 'User action completed successfully']);
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