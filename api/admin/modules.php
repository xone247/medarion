<?php
// Admin modules endpoint - Full CRUD
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Authorization check
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = null;

if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
    $token = $matches[1];
}

// For GET requests, allow non-admin users but return empty/modules list
// For other methods, require admin
$isGetRequest = $_SERVER['REQUEST_METHOD'] === 'GET';
$allowNonAdmin = $isGetRequest; // Allow GET for all authenticated users

if (!$token && !$allowNonAdmin) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

try {
    // Set error reporting for debugging
    error_reporting(E_ALL);
    ini_set('display_errors', 0); // Don't display errors in output, but log them
    
    $configPath = __DIR__ . '/../../config/database.php';
    if (!file_exists($configPath)) {
        $configPath = __DIR__ . '/../config/database.php';
    }
    $config = require $configPath;
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );

    // Ensure modules table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        component VARCHAR(255),
        icon VARCHAR(50),
        category ENUM('core', 'data', 'tools', 'analytics', 'admin') DEFAULT 'core',
        required_tier ENUM('free', 'paid', 'academic', 'enterprise') DEFAULT 'free',
        required_roles JSON DEFAULT NULL,
        is_enabled BOOLEAN DEFAULT TRUE,
        is_core BOOLEAN DEFAULT FALSE,
        display_order INT DEFAULT 0,
        config_data JSON DEFAULT NULL,
        data_source VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_enabled (is_enabled),
        INDEX idx_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Seed default modules if table is empty
    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM modules");
    $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($countResult['count'] == 0) {
        // ONLY modules that have data management in Admin Dashboard Data Management tab
        $defaultModules = [
            // Core modules
            ['module_id' => 'dashboard', 'name' => 'Dashboard', 'description' => 'Main overview and KPIs', 'component' => 'Dashboard', 'icon' => 'BarChart3', 'category' => 'core', 'required_tier' => 'free', 'is_core' => true, 'display_order' => 1],
            ['module_id' => 'my_profile', 'name' => 'My Profile', 'description' => 'Manage your profile and company info', 'component' => 'MyProfile', 'icon' => 'User', 'category' => 'core', 'required_tier' => 'free', 'is_core' => true, 'display_order' => 2],
            
            // Data modules (database-backed - managed in Admin Dashboard Data Management tab)
            ['module_id' => 'companies', 'name' => 'Companies', 'description' => 'Healthcare company profiles and data', 'component' => 'Companies', 'icon' => 'Building2', 'category' => 'data', 'required_tier' => 'free', 'display_order' => 3],
            ['module_id' => 'deals', 'name' => 'Deals', 'description' => 'Track M&A, licensing, and deal activity', 'component' => 'Deals', 'icon' => 'TrendingUp', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 4],
            ['module_id' => 'grants', 'name' => 'Grants', 'description' => 'Monitor grants and funding opportunities', 'component' => 'Grants', 'icon' => 'DollarSign', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 5],
            ['module_id' => 'investors', 'name' => 'Investors', 'description' => 'Investor profiles and activity', 'component' => 'Investors', 'icon' => 'Users', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 6],
            ['module_id' => 'clinical_trials', 'name' => 'Clinical Trials', 'description' => 'Clinical research and trials data', 'component' => 'ClinicalTrials', 'icon' => 'Microscope', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 7],
            ['module_id' => 'regulatory', 'name' => 'Regulatory', 'description' => 'Regulatory approvals and compliance', 'component' => 'Regulatory', 'icon' => 'FileCheck', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 8],
            ['module_id' => 'regulatory_ecosystem', 'name' => 'Regulatory Ecosystem', 'description' => 'Regulatory bodies across Africa', 'component' => 'RegulatoryEcosystem', 'icon' => 'FileCheck', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 9],
            ['module_id' => 'public_markets', 'name' => 'Public Markets', 'description' => 'Comprehensive financial data hub', 'component' => 'PublicMarkets', 'icon' => 'LineChart', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 10],
            ['module_id' => 'clinical_centers', 'name' => 'Clinical Centers', 'description' => 'Centers conducting clinical trials', 'component' => 'ClinicalCenters', 'icon' => 'Microscope', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 11],
            ['module_id' => 'investigators', 'name' => 'Investigators', 'description' => 'Clinical trial investigators and physicians', 'component' => 'Investigators', 'icon' => 'Users', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 12],
            
            // Analytics modules (database-backed - managed in Admin Dashboard Data Management tab)
            ['module_id' => 'nation_pulse', 'name' => 'Nation Pulse', 'description' => 'Health and economic indicators', 'component' => 'NationPulse', 'icon' => 'Activity', 'category' => 'analytics', 'required_tier' => 'free', 'display_order' => 13],
            
            // Tools modules (database-backed - managed in Admin Dashboard Data Management tab)
            ['module_id' => 'fundraising_crm', 'name' => 'Fundraising CRM', 'description' => 'Manage investor relationships', 'component' => 'FundraisingCRM', 'icon' => 'MessageSquare', 'category' => 'tools', 'required_tier' => 'paid', 'display_order' => 14],
            ['module_id' => 'ai_tools', 'name' => 'AI Tools', 'description' => 'AI-assisted analysis and copilots', 'component' => 'AITools', 'icon' => 'Bot', 'category' => 'tools', 'required_tier' => 'paid', 'display_order' => 15],
        ];

        $insertSql = "INSERT INTO modules (module_id, name, description, component, icon, category, required_tier, required_roles, is_enabled, is_core, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertSql);
        
        foreach ($defaultModules as $module) {
            $stmt->execute([
                $module['module_id'],
                $module['name'],
                $module['description'],
                $module['component'],
                $module['icon'],
                $module['category'],
                $module['required_tier'],
                $module['required_roles'] ?? null,
                $module['is_enabled'] ?? true,
                $module['is_core'] ?? false,
                $module['display_order']
            ]);
        }
    }

    $requestMethod = $_SERVER['REQUEST_METHOD'];
    $requestUri = $_SERVER['REQUEST_URI'];
    
    // Get module ID from global (set by router) or parse from URL
    $moduleId = $GLOBALS['moduleId'] ?? null;
    
    if (!$moduleId) {
        // Fallback: parse from URL if not set by router
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        $pathParts = array_values(array_filter($pathParts, function($part) { return !empty($part); }));
        
        // Get module ID from URL if present (e.g., /api/admin/modules/123)
        // Path structure: [medarion, api, admin, modules, id?] or [api, admin, modules, id?]
        $modulesIndex = -1;
        for ($i = 0; $i < count($pathParts); $i++) {
            if ($pathParts[$i] === 'modules') {
                $modulesIndex = $i;
                break;
            }
        }
        
        // If modules is found and there's a part after it, it might be an ID
        if ($modulesIndex >= 0 && isset($pathParts[$modulesIndex + 1])) {
            $potentialId = $pathParts[$modulesIndex + 1];
            if (is_numeric($potentialId)) {
                $moduleId = intval($potentialId);
            } elseif (!empty($potentialId) && !in_array(strtolower($potentialId), ['index.php', 'schema.php'])) {
                // Could be module_id string, but ignore known files
                $moduleId = $potentialId;
            }
        }
    }

    // GET - List all modules or get single module
    if ($requestMethod === 'GET') {
        if ($moduleId) {
            // Get single module by ID or module_id
            if (is_numeric($moduleId)) {
                $stmt = $pdo->prepare("SELECT * FROM modules WHERE id = ?");
                $stmt->execute([$moduleId]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM modules WHERE module_id = ?");
                $stmt->execute([$moduleId]);
            }
            $module = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$module) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Module not found']);
                exit();
            }
            
            // Parse JSON fields
            if ($module['required_roles']) {
                $module['required_roles'] = json_decode($module['required_roles'], true);
            }
            if ($module['config_data']) {
                $module['config_data'] = json_decode($module['config_data'], true);
            }
            
            echo json_encode(['success' => true, 'data' => $module]);
        } else {
            // Get all modules with filtering and pagination
            $search = $_GET['search'] ?? '';
            $category = $_GET['category'] ?? '';
            $enabled = $_GET['enabled'] ?? '';
            $page = intval($_GET['page'] ?? 1);
            $limit = intval($_GET['limit'] ?? 50);
            $offset = ($page - 1) * $limit;
            
            $where = [];
            $params = [];
            
            if ($search) {
                $where[] = "(name LIKE ? OR description LIKE ? OR module_id LIKE ?)";
                $searchTerm = "%{$search}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            if ($category) {
                $where[] = "category = ?";
                $params[] = $category;
            }
            
            if ($enabled !== '') {
                $where[] = "is_enabled = ?";
                $params[] = $enabled === 'true' ? 1 : 0;
            }
            
            $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // Get total count
            $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM modules $whereClause");
            $countStmt->execute($params);
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get modules
            $sql = "SELECT * FROM modules $whereClause ORDER BY display_order ASC, name ASC LIMIT ? OFFSET ?";
            $stmt = $pdo->prepare($sql);
            $allParams = array_merge($params, [$limit, $offset]);
            $stmt->execute($allParams);
        $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
            // Parse JSON fields
        foreach ($modules as &$module) {
                if ($module['required_roles']) {
                    $module['required_roles'] = json_decode($module['required_roles'], true);
                }
                if ($module['config_data']) {
                    $module['config_data'] = json_decode($module['config_data'], true);
                }
            }
            
            echo json_encode([
                'success' => true,
                'data' => $modules,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => intval($total),
                    'pages' => ceil($total / $limit)
                ]
            ]);
        }
    }
    
    // POST - Create new module
    elseif ($requestMethod === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (empty($input['module_id']) || empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'module_id and name are required']);
            exit();
        }
        
        // Check if module_id already exists
        $checkStmt = $pdo->prepare("SELECT id FROM modules WHERE module_id = ?");
        $checkStmt->execute([$input['module_id']]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Module ID already exists']);
            exit();
        }
        
        $sql = "INSERT INTO modules (module_id, name, description, component, icon, category, required_tier, required_roles, is_enabled, is_core, display_order, config_data, data_source) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
            $input['module_id'],
            $input['name'],
            $input['description'] ?? null,
            $input['component'] ?? null,
            $input['icon'] ?? null,
            $input['category'] ?? 'core',
            $input['required_tier'] ?? 'free',
            isset($input['required_roles']) ? json_encode($input['required_roles']) : null,
            isset($input['is_enabled']) ? ($input['is_enabled'] ? 1 : 0) : 1,
            isset($input['is_core']) ? ($input['is_core'] ? 1 : 0) : 0,
            $input['display_order'] ?? 0,
            isset($input['config_data']) ? json_encode($input['config_data']) : null,
            $input['data_source'] ?? null
        ]);
        
        $newId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM modules WHERE id = ?");
        $stmt->execute([$newId]);
        $module = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($module['required_roles']) {
            $module['required_roles'] = json_decode($module['required_roles'], true);
        }
        if ($module['config_data']) {
            $module['config_data'] = json_decode($module['config_data'], true);
        }
        
        http_response_code(201);
        echo json_encode(['success' => true, 'data' => $module, 'message' => 'Module created successfully']);
    }
    
    // PUT - Update module
    elseif ($requestMethod === 'PUT') {
        if (!$moduleId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Module ID is required']);
            exit();
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check if module exists
        if (is_numeric($moduleId)) {
            $checkStmt = $pdo->prepare("SELECT id, is_core FROM modules WHERE id = ?");
            $checkStmt->execute([$moduleId]);
        } else {
            $checkStmt = $pdo->prepare("SELECT id, is_core FROM modules WHERE module_id = ?");
            $checkStmt->execute([$moduleId]);
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $moduleId = $result['id'];
            }
        }
        
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Module not found']);
            exit();
        }
        
        // Build update query dynamically
        $updates = [];
        $params = [];
        
        $allowedFields = ['name', 'description', 'component', 'icon', 'category', 'required_tier', 'required_roles', 'is_enabled', 'display_order', 'config_data', 'data_source'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                if ($field === 'required_roles' || $field === 'config_data') {
                    $updates[] = "$field = ?";
                    $params[] = is_array($input[$field]) ? json_encode($input[$field]) : $input[$field];
                } elseif ($field === 'is_enabled') {
                    $updates[] = "$field = ?";
                    $params[] = $input[$field] ? 1 : 0;
                } else {
                    $updates[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }
        
        $params[] = $moduleId;
        $sql = "UPDATE modules SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Return updated module
        $stmt = $pdo->prepare("SELECT * FROM modules WHERE id = ?");
        $stmt->execute([$moduleId]);
        $module = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($module['required_roles']) {
            $module['required_roles'] = json_decode($module['required_roles'], true);
        }
        if ($module['config_data']) {
            $module['config_data'] = json_decode($module['config_data'], true);
        }
        
        echo json_encode(['success' => true, 'data' => $module, 'message' => 'Module updated successfully']);
    }
    
    // DELETE - Delete module (unless it's core)
    elseif ($requestMethod === 'DELETE') {
        if (!$moduleId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Module ID is required']);
            exit();
        }
        
        // Check if module exists and is core
        if (is_numeric($moduleId)) {
            $checkStmt = $pdo->prepare("SELECT id, is_core FROM modules WHERE id = ?");
            $checkStmt->execute([$moduleId]);
        } else {
            $checkStmt = $pdo->prepare("SELECT id, is_core FROM modules WHERE module_id = ?");
            $checkStmt->execute([$moduleId]);
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $moduleId = $result['id'];
                $isCore = $result['is_core'];
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Module not found']);
                exit();
            }
        }
        
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Module not found']);
            exit();
        }
        
        if ($existing['is_core']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Core modules cannot be deleted']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM modules WHERE id = ?");
        $stmt->execute([$moduleId]);
        
        echo json_encode(['success' => true, 'message' => 'Module deleted successfully']);
    }
    
    // Bulk operations
    elseif ($requestMethod === 'PATCH') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        $moduleIds = $input['module_ids'] ?? [];
        
        if (empty($moduleIds) || !is_array($moduleIds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'module_ids array is required']);
            exit();
        }
        
        $placeholders = implode(',', array_fill(0, count($moduleIds), '?'));
        
        if ($action === 'enable') {
            $stmt = $pdo->prepare("UPDATE modules SET is_enabled = 1 WHERE id IN ($placeholders)");
            $stmt->execute($moduleIds);
            echo json_encode(['success' => true, 'message' => count($moduleIds) . ' modules enabled']);
        } elseif ($action === 'disable') {
            // Don't disable core modules
            $stmt = $pdo->prepare("UPDATE modules SET is_enabled = 0 WHERE id IN ($placeholders) AND is_core = 0");
            $stmt->execute($moduleIds);
            echo json_encode(['success' => true, 'message' => 'Modules disabled (core modules excluded)']);
        } elseif ($action === 'delete') {
            // Don't delete core modules
            $stmt = $pdo->prepare("DELETE FROM modules WHERE id IN ($placeholders) AND is_core = 0");
            $stmt->execute($moduleIds);
            echo json_encode(['success' => true, 'message' => 'Modules deleted (core modules excluded)']);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action. Use: enable, disable, or delete']);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()]);
}
?>
