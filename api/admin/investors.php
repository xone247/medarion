<?php
// Start output buffering to prevent premature output
ob_start();

// Admin investors endpoint - Full CRUD
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Basic authorization check (in production, verify JWT token)
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$isAuthorized = strpos($authHeader, 'Bearer') !== false || strpos($authHeader, 'test-token') !== false;

if (!$isAuthorized) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

try {
    $configPath = __DIR__ . '/../../config/database.php';
    if (!file_exists($configPath)) {
        throw new Exception("Database config file not found: {$configPath}");
    }
    $config = require $configPath;
    if (!is_array($config)) {
        if ($config === true) {
            unset($config);
            $config = include $configPath;
        }
        if (!is_array($config)) {
            throw new Exception("Database config is invalid");
        }
    }
    $charset = $config['charset'] ?? 'utf8mb4';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']}";
    try {
        $dsn .= ";charset={$charset}";
    } catch (Exception $e) {
        // Fallback without charset in DSN
    }
    
    $pdo = new PDO(
        $dsn,
        $config['username'],
        $config['password'],
        $config['options'] ?? []
    );
    $pdo->exec("SET NAMES {$charset}");
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Handle dynamic ID in URL path
    $investorId = null;
    if (isset($GLOBALS['investorId'])) {
        $investorId = (int)$GLOBALS['investorId'];
    } else {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        if (in_array('investors', $pathParts)) {
            $investorsIndex = array_search('investors', $pathParts);
            if ($investorsIndex !== false && isset($pathParts[$investorsIndex + 1])) {
                $possibleId = $pathParts[$investorsIndex + 1];
                if (is_numeric($possibleId)) {
                    $investorId = (int)$possibleId;
                }
            }
        }
    }
    
    // GET - List all investors or get single investor
    if ($method === 'GET') {
        if ($investorId) {
            // Get single investor
            $stmt = $pdo->prepare("SELECT * FROM investors WHERE id = :id");
            $stmt->bindValue(':id', $investorId, PDO::PARAM_INT);
            $stmt->execute();
            $investor = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($investor) {
                // Decode JSON fields
                $jsonFields = ['focus_sectors', 'investment_stages', 'portfolio_companies', 'countries', 'social_media', 'recent_investments', 'investment_criteria', 'portfolio_exits'];
                foreach ($jsonFields as $field) {
                    if (isset($investor[$field])) {
                        $investor[$field] = json_decode($investor[$field], true) ?? [];
                    }
                }
                echo json_encode(['success' => true, 'data' => $investor]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Investor not found']);
            }
        } else {
            // List all investors with pagination and search
            $limit = $_GET['limit'] ?? 20;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';

            // Select columns - use SELECT * to avoid column mismatch errors
            // We'll handle missing columns in the data processing
            $sql = "SELECT * FROM investors";
            $countSql = "SELECT COUNT(*) FROM investors";
            $whereConditions = [];
            $params = [];

            if ($search) {
                $whereConditions[] = "(name LIKE :search OR description LIKE :search OR type LIKE :search OR headquarters LIKE :search)";
                $params[':search'] = "%$search%";
            }

            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(" AND ", $whereConditions);
                $countSql .= " WHERE " . implode(" AND ", $whereConditions);
            }

            $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $investors = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countStmt = $pdo->prepare($countSql);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetchColumn();
            
            // Ensure total is numeric
            if (!is_numeric($total)) {
                $total = 0;
            }
            
            // Ensure investors is an array
            if (!is_array($investors)) {
                $investors = [];
            }

            // Clear any output before JSON
            ob_clean();
            
            echo json_encode([
                'success' => true,
                'data' => $investors,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'has_more' => ($offset + $limit) < $total
                ]
            ]);
        }
    } 
    // POST - Create new investor
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name is required']);
            exit();
        }
        
        // Check which columns exist in the table
        $columnsStmt = $pdo->query("SHOW COLUMNS FROM investors");
        $existingColumns = [];
        while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = $row['Field'];
        }
        
        $jsonFields = ['focus_sectors', 'investment_stages', 'portfolio_companies', 'countries', 'social_media', 'recent_investments', 'investment_criteria', 'portfolio_exits'];
        $jsonData = [];
        foreach ($jsonFields as $field) {
            $jsonData[$field] = isset($input[$field]) ? json_encode($input[$field]) : null;
        }
        
        // Build dynamic INSERT query based on existing columns
        $insertFields = [];
        $insertValues = [];
        $insertParams = [];
        
        $allowedFields = ['name', 'logo', 'description', 'type', 'headquarters', 'founded', 
                         'assets_under_management', 'website', 'focus_sectors', 'investment_stages',
                         'portfolio_companies', 'total_investments', 'average_investment', 
                         'countries', 'team_size', 'contact_email', 'social_media', 
                         'recent_investments', 'investment_criteria', 'portfolio_exits', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (in_array($field, $existingColumns)) {
                $insertFields[] = $field;
                $insertValues[] = ":$field";
                if (in_array($field, $jsonFields)) {
                    $insertParams[":$field"] = $jsonData[$field];
                } else {
                    $insertParams[":$field"] = $input[$field] ?? ($field === 'is_active' ? 1 : null);
                }
            }
        }
        
        // Always include created_at and updated_at if they exist
        if (in_array('created_at', $existingColumns)) {
            $insertFields[] = 'created_at';
            $insertValues[] = 'NOW()';
        }
        if (in_array('updated_at', $existingColumns)) {
            $insertFields[] = 'updated_at';
            $insertValues[] = 'NOW()';
        }
        
        $sql = "INSERT INTO investors (" . implode(', ', $insertFields) . ") VALUES (" . implode(', ', $insertValues) . ")";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($insertParams);
        
        echo json_encode(['success' => true, 'message' => 'Investor created', 'id' => $pdo->lastInsertId()]);
    }
    // PUT/PATCH - Update investor
    elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$investorId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Investor ID is required']);
            exit();
        }
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check which columns exist in the table
        $columnsStmt = $pdo->query("SHOW COLUMNS FROM investors");
        $existingColumns = [];
        while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = $row['Field'];
        }
        
        $fields = [];
        $params = [':id' => $investorId];

        $allowedFields = ['name', 'logo', 'description', 'type', 'headquarters', 'founded', 
                          'assets_under_management', 'website', 'total_investments', 
                          'average_investment', 'team_size', 'contact_email', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (in_array($field, $existingColumns) && isset($input[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $input[$field];
            }
        }

        // Handle JSON fields
        $jsonFields = ['focus_sectors', 'investment_stages', 'portfolio_companies', 'countries', 'social_media', 'recent_investments', 'investment_criteria', 'portfolio_exits'];
        foreach ($jsonFields as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = json_encode($input[$field]);
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }
        
        $fields[] = "updated_at = NOW()";
        $sql = "UPDATE investors SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Investor updated']);
    }
    // DELETE - Delete investor
    elseif ($method === 'DELETE') {
        if (!$investorId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Investor ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM investors WHERE id = :id");
        $stmt->bindValue(':id', $investorId, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Investor deleted']);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
ob_end_flush();
?>

