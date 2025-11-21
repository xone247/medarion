<?php
// Admin Settings API endpoint
// Handles system settings management

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    
    // Check if system_settings table exists, if not create it
    $stmt = $pdo->query("SHOW TABLES LIKE 'system_settings'");
    if (!$stmt->fetch()) {
        $createTableSql = "
            CREATE TABLE system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(255) UNIQUE NOT NULL,
                setting_value TEXT,
                setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
                description TEXT,
                category VARCHAR(100) DEFAULT 'general',
                is_public BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_public (is_public)
            )
        ";
        $pdo->exec($createTableSql);
        
        // Insert default settings
        $defaultSettings = [
            ['site_name', 'Medarion', 'string', 'The name of the website', 'general', true],
            ['site_description', 'African Healthcare Data Platform', 'string', 'The description of the website', 'general', true],
            ['site_url', 'https://medarion.com', 'string', 'The URL of the website', 'general', true],
            ['admin_email', 'admin@medarion.com', 'string', 'Admin email address', 'general', false],
            ['max_file_size', '10485760', 'number', 'Maximum file upload size in bytes', 'uploads', false],
            ['allowed_file_types', 'jpg,jpeg,png,gif,pdf,doc,docx', 'string', 'Allowed file types for uploads', 'uploads', false],
            ['maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', 'system', false],
            ['registration_enabled', 'true', 'boolean', 'Allow new user registrations', 'auth', true],
            ['email_verification_required', 'true', 'boolean', 'Require email verification for new users', 'auth', false],
            ['default_user_role', 'startup', 'string', 'Default role for new users', 'auth', false],
            ['session_timeout', '3600', 'number', 'Session timeout in seconds', 'auth', false],
            ['max_login_attempts', '5', 'number', 'Maximum login attempts before lockout', 'auth', false],
            ['lockout_duration', '900', 'number', 'Account lockout duration in seconds', 'auth', false],
            ['ai_enabled', 'true', 'boolean', 'Enable AI features', 'ai', true],
            ['ai_quota_per_user', '100', 'number', 'AI requests per user per month', 'ai', false],
            ['ai_model', 'gpt-3.5-turbo', 'string', 'Default AI model to use', 'ai', false],
            ['analytics_enabled', 'true', 'boolean', 'Enable analytics tracking', 'analytics', false],
            ['analytics_id', '', 'string', 'Google Analytics ID', 'analytics', false],
            ['backup_enabled', 'true', 'boolean', 'Enable automatic backups', 'backup', false],
            ['backup_frequency', 'daily', 'string', 'Backup frequency', 'backup', false],
            ['backup_retention_days', '30', 'number', 'Number of days to retain backups', 'backup', false]
        ];
        
        $stmt = $pdo->prepare("
            INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($defaultSettings as $setting) {
            $stmt->execute($setting);
        }
    }
    
    switch ($method) {
        case 'GET':
            // Get all system settings
            $stmt = $pdo->query("
                SELECT * FROM system_settings 
                ORDER BY category, setting_key
            ");
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format settings
            $formattedSettings = array_map(function($setting) {
                $value = $setting['setting_value'];
                
                // Convert value based on type
                switch ($setting['setting_type']) {
                    case 'number':
                        $value = is_numeric($value) ? (float)$value : 0;
                        break;
                    case 'boolean':
                        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                        break;
                    case 'json':
                        $value = json_decode($value, true);
                        break;
                    default:
                        $value = (string)$value;
                }
                
                return [
                    'id' => (int)$setting['id'],
                    'setting_key' => $setting['setting_key'],
                    'setting_value' => $value,
                    'setting_type' => $setting['setting_type'],
                    'description' => $setting['description'],
                    'category' => $setting['category'],
                    'is_public' => (bool)$setting['is_public'],
                    'created_at' => $setting['created_at'],
                    'updated_at' => $setting['updated_at']
                ];
            }, $settings);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedSettings
            ]);
            break;
            
        case 'POST':
            // Update system settings
            if (!$input || !isset($input['settings']) || !is_array($input['settings'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Settings array is required']);
                exit;
            }
            
            $updated = 0;
            $errors = [];
            
            foreach ($input['settings'] as $setting) {
                if (!isset($setting['setting_key']) || !isset($setting['setting_value'])) {
                    $errors[] = 'Setting key and value are required';
                    continue;
                }
                
                $key = $setting['setting_key'];
                $value = $setting['setting_value'];
                $type = $setting['setting_type'] ?? 'string';
                
                // Convert value based on type
                switch ($type) {
                    case 'number':
                        $value = is_numeric($value) ? (string)$value : '0';
                        break;
                    case 'boolean':
                        $value = $value ? 'true' : 'false';
                        break;
                    case 'json':
                        $value = is_string($value) ? $value : json_encode($value);
                        break;
                    default:
                        $value = (string)$value;
                }
                
                try {
                    $stmt = $pdo->prepare("
                        UPDATE system_settings 
                        SET setting_value = ?, setting_type = ?, updated_at = NOW() 
                        WHERE setting_key = ?
                    ");
                    $stmt->execute([$value, $type, $key]);
                    
                    if ($stmt->rowCount() > 0) {
                        $updated++;
                    } else {
                        // Insert if doesn't exist
                        $stmt = $pdo->prepare("
                            INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) 
                            VALUES (?, ?, ?, ?, ?, ?)
                        ");
                        $stmt->execute([
                            $key,
                            $value,
                            $type,
                            $setting['description'] ?? '',
                            $setting['category'] ?? 'general',
                            $setting['is_public'] ?? false
                        ]);
                        $updated++;
                    }
                } catch (PDOException $e) {
                    $errors[] = "Error updating {$key}: " . $e->getMessage();
                }
            }
            
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Some settings could not be updated',
                    'details' => $errors
                ]);
            } else {
                echo json_encode([
                    'success' => true,
                    'message' => "Updated {$updated} settings successfully"
                ]);
            }
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