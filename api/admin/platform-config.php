<?php
// Admin Platform Config API endpoint
// Handles platform configuration management

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
    
    // Check if platform_config table exists, if not create it
    $stmt = $pdo->query("SHOW TABLES LIKE 'platform_config'");
    if (!$stmt->fetch()) {
        $createTableSql = "
            CREATE TABLE platform_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(255) UNIQUE NOT NULL,
                config_value TEXT,
                config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ";
        $pdo->exec($createTableSql);
        
        // Insert default config
        $defaultConfig = [
            ['data_mode', 'live', 'string', 'Data mode: demo or live'],
            ['ai_mode', 'live', 'string', 'AI mode: demo or live'],
            ['ollama_url', 'http://localhost:11434', 'string', 'Ollama server URL'],
            ['ollama_model', 'mistral', 'string', 'Ollama model name'],
            ['ads_enabled', 'true', 'boolean', 'Enable advertisements'],
            ['maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'],
            ['registration_enabled', 'true', 'boolean', 'Allow new user registrations']
        ];
        
        $stmt = $pdo->prepare("
            INSERT INTO platform_config (config_key, config_value, config_type, description) 
            VALUES (?, ?, ?, ?)
        ");
        
        foreach ($defaultConfig as $config) {
            $stmt->execute($config);
        }
    }
    
    switch ($method) {
        case 'GET':
            // Get platform configuration
            $stmt = $pdo->query("SELECT * FROM platform_config ORDER BY config_key");
            $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format config
            $formattedConfig = [];
            foreach ($configs as $config) {
                $value = $config['config_value'];
                
                // Convert value based on type
                $configType = $config['config_type'] ?? 'string';
                switch ($configType) {
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
                
                $formattedConfig[$config['config_key']] = $value;
            }
            
            echo json_encode([
                'success' => true,
                'config' => $formattedConfig
            ]);
            break;
            
        case 'PUT':
            // Update platform configuration
            if (!$input || !isset($input['config'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Config object is required']);
                exit;
            }
            
            $updated = 0;
            $errors = [];
            
            foreach ($input['config'] as $key => $value) {
                // Determine type
                $type = 'string';
                if (is_numeric($value)) {
                    $type = 'number';
                } elseif (is_bool($value)) {
                    $type = 'boolean';
                } elseif (is_array($value) || is_object($value)) {
                    $type = 'json';
                    $value = json_encode($value);
                }
                
                try {
                    $stmt = $pdo->prepare("
                        UPDATE platform_config 
                        SET config_value = ?, config_type = ?, updated_at = NOW() 
                        WHERE config_key = ?
                    ");
                    $stmt->execute([$value, $type, $key]);
                    
                    if ($stmt->rowCount() > 0) {
                        $updated++;
                    } else {
                        // Insert if doesn't exist
                        $stmt = $pdo->prepare("
                            INSERT INTO platform_config (config_key, config_value, config_type, description) 
                            VALUES (?, ?, ?, ?)
                        ");
                        $stmt->execute([$key, $value, $type, '']);
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
                    'error' => 'Some config values could not be updated',
                    'details' => $errors
                ]);
            } else {
                echo json_encode([
                    'success' => true,
                    'message' => "Updated {$updated} config values successfully"
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