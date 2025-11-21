<?php
// Start output buffering to prevent premature output
ob_start();

// Admin regulatory bodies endpoint - Full CRUD
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$isAuthorized = strpos($authHeader, 'Bearer') !== false || strpos($authHeader, 'test-token') !== false;

if (!$isAuthorized) {
    ob_clean();
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
    } catch (Exception $e) {}
    
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options'] ?? []);
    $pdo->exec("SET NAMES {$charset}");
    
    $method = $_SERVER['REQUEST_METHOD'];
    $bodyId = null;
    
    if (isset($GLOBALS['regulatoryBodyId'])) {
        $bodyId = (int)$GLOBALS['regulatoryBodyId'];
    } else {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        
        if ((in_array('regulatory-bodies', $pathParts) || in_array('regulatory_bodies', $pathParts))) {
            $index = array_search('regulatory-bodies', $pathParts);
            if ($index === false) $index = array_search('regulatory_bodies', $pathParts);
            if ($index !== false && isset($pathParts[$index + 1])) {
                $possibleId = $pathParts[$index + 1];
                if (is_numeric($possibleId)) {
                    $bodyId = (int)$possibleId;
                }
            }
        }
    }
    
    // GET - List all regulatory bodies or get single body
    if ($method === 'GET') {
        if ($bodyId) {
            $stmt = $pdo->prepare("SELECT * FROM regulatory_bodies WHERE id = :id");
            $stmt->bindValue(':id', $bodyId, PDO::PARAM_INT);
            $stmt->execute();
            $body = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($body) {
                // Decode JSON fields
                if (isset($body['contact_info']) && $body['contact_info']) {
                    $body['contact_info'] = json_decode($body['contact_info'], true) ?? [];
                }
                if (isset($body['requirements']) && $body['requirements']) {
                    $body['requirements'] = json_decode($body['requirements'], true) ?? [];
                }
                
                ob_clean();
                echo json_encode(['success' => true, 'data' => $body]);
            } else {
                ob_clean();
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Regulatory body not found']);
            }
        } else {
            $limit = $_GET['limit'] ?? 20;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';
            
            // Use SELECT * to avoid column mismatch errors
            $sql = "SELECT * FROM regulatory_bodies";
            $countSql = "SELECT COUNT(*) FROM regulatory_bodies";
            $whereConditions = [];
            $params = [];
            
            if ($search) {
                $whereConditions[] = "(name LIKE :search OR country LIKE :search OR abbreviation LIKE :search OR description LIKE :search)";
                $params[':search'] = "%$search%";
            }
            
            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(" AND ", $whereConditions);
                $countSql .= " WHERE " . implode(" AND ", $whereConditions);
            }
            
            $sql .= " ORDER BY country ASC, name ASC LIMIT :limit OFFSET :offset";
            
            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $bodies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode JSON fields for each body
            foreach ($bodies as &$body) {
                if (isset($body['contact_info']) && $body['contact_info']) {
                    $body['contact_info'] = json_decode($body['contact_info'], true) ?? [];
                }
                if (isset($body['requirements']) && $body['requirements']) {
                    $body['requirements'] = json_decode($body['requirements'], true) ?? [];
                }
            }
            
            $countStmt = $pdo->prepare($countSql);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetchColumn();
            
            if (!is_numeric($total)) {
                $total = 0;
            }
            
            if (!is_array($bodies)) {
                $bodies = [];
            }
            
            ob_clean();
            echo json_encode([
                'success' => true,
                'data' => $bodies,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'has_more' => ($offset + $limit) < $total
                ]
            ]);
            ob_end_flush();
            exit();
        }
    } 
    // POST - Create new regulatory body
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['name']) || empty($input['country'])) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name and country are required']);
            exit();
        }
        
        // Encode JSON fields
        $contactInfo = isset($input['contact_info']) ? (is_array($input['contact_info']) ? json_encode($input['contact_info']) : $input['contact_info']) : null;
        $requirements = isset($input['requirements']) ? (is_array($input['requirements']) ? json_encode($input['requirements']) : $input['requirements']) : null;
        
        // Check which columns exist in the table
        $columnsStmt = $pdo->query("SHOW COLUMNS FROM regulatory_bodies");
        $existingColumns = [];
        while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = $row['Field'];
        }
        
        // Build dynamic INSERT query based on existing columns
        $insertFields = [];
        $insertValues = [];
        $insertParams = [];
        
        $allowedFields = ['name', 'country', 'abbreviation', 'website', 'description', 'jurisdiction', 'contact_info', 'regulatory_framework', 'approval_process', 'fees_structure', 'is_active'];
        foreach ($allowedFields as $field) {
            if (in_array($field, $existingColumns)) {
                $insertFields[] = $field;
                $insertValues[] = ":$field";
                if ($field === 'contact_info') {
                    $insertParams[":$field"] = $contactInfo;
                } elseif ($field === 'is_active') {
                    $insertParams[":$field"] = isset($input['is_active']) ? ($input['is_active'] ? 1 : 0) : 1;
                } else {
                    $insertParams[":$field"] = $input[$field] ?? null;
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
        
        $sql = "INSERT INTO regulatory_bodies (" . implode(', ', $insertFields) . ") VALUES (" . implode(', ', $insertValues) . ")";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($insertParams);
        
        $newId = $pdo->lastInsertId();
        
        ob_clean();
        echo json_encode(['success' => true, 'data' => ['id' => $newId], 'message' => 'Regulatory body created successfully']);
    } 
    // PUT/PATCH - Update regulatory body
    elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$bodyId) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Regulatory body ID is required']);
            exit();
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check which columns exist in the table
        $columnsStmt = $pdo->query("SHOW COLUMNS FROM regulatory_bodies");
        $existingColumns = [];
        while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = $row['Field'];
        }
        
        // Build update query dynamically
        $updates = [];
        $params = [':id' => $bodyId];
        
        $allowedFields = ['name', 'country', 'abbreviation', 'website', 'description', 'jurisdiction', 'contact_info', 'regulatory_framework', 'approval_process', 'fees_structure', 'is_active'];
        foreach ($allowedFields as $field) {
            if (in_array($field, $existingColumns) && isset($input[$field])) {
                $updates[] = "$field = :$field";
                if ($field === 'contact_info') {
                    $params[":$field"] = is_array($input[$field]) ? json_encode($input[$field]) : $input[$field];
                } elseif ($field === 'is_active') {
                    $params[":$field"] = $input[$field] ? 1 : 0;
                } else {
                    $params[":$field"] = $input[$field];
                }
            }
        }
        
        if (empty($updates)) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }
        
        $updates[] = 'updated_at = NOW()';
        $sql = "UPDATE regulatory_bodies SET " . implode(', ', $updates) . " WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        ob_clean();
        echo json_encode(['success' => true, 'message' => 'Regulatory body updated successfully']);
    } 
    // DELETE - Delete regulatory body
    elseif ($method === 'DELETE') {
        if (!$bodyId) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Regulatory body ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM regulatory_bodies WHERE id = :id");
        $stmt->bindValue(':id', $bodyId, PDO::PARAM_INT);
        $stmt->execute();
        
        ob_clean();
        echo json_encode(['success' => true, 'message' => 'Regulatory body deleted successfully']);
    }
    
} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
ob_end_flush();
?>


