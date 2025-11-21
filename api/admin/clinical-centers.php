<?php
// Start output buffering to prevent premature output
ob_start();

// Admin clinical centers endpoint - Full CRUD
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
    $centerId = null;
    
    if (isset($GLOBALS['centerId'])) {
        $centerId = (int)$GLOBALS['centerId'];
    } else {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        if ((in_array('clinical-centers', $pathParts) || in_array('clinical_centers', $pathParts))) {
            $index = array_search('clinical-centers', $pathParts);
            if ($index === false) $index = array_search('clinical_centers', $pathParts);
            if ($index !== false && isset($pathParts[$index + 1])) {
                $possibleId = $pathParts[$index + 1];
                if (is_numeric($possibleId)) {
                    $centerId = (int)$possibleId;
                }
            }
        }
    }
    
    if ($method === 'GET') {
        if ($centerId) {
            $stmt = $pdo->prepare("SELECT * FROM clinical_centers WHERE id = :id");
            $stmt->bindValue(':id', $centerId, PDO::PARAM_INT);
            $stmt->execute();
            $center = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($center) {
                // Decode JSON fields
                $jsonFields = ['specialties', 'phases_supported', 'accreditation', 'contact_info', 'facilities'];
                foreach ($jsonFields as $field) {
                    if (isset($center[$field])) {
                        $center[$field] = json_decode($center[$field], true) ?? [];
                    }
                }
                echo json_encode(['success' => true, 'data' => $center]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Clinical center not found']);
            }
        } else {
            $limit = $_GET['limit'] ?? 20;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';

            // Use SELECT * to avoid column mismatch errors
            $sql = "SELECT * FROM clinical_centers";
            $countSql = "SELECT COUNT(*) FROM clinical_centers";
            $whereConditions = [];
            $params = [];

            if ($search) {
                $whereConditions[] = "(name LIKE :search OR description LIKE :search OR city LIKE :search OR country LIKE :search)";
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
            $centers = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
            
            // Ensure centers is an array
            if (!is_array($centers)) {
                $centers = [];
            }

            // Clear any output before JSON
            ob_clean();
            
            echo json_encode([
                'success' => true,
                'data' => $centers,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'has_more' => ($offset + $limit) < $total
                ]
            ]);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name is required']);
            exit();
        }
        
        $jsonFields = ['specialties', 'phases_supported', 'accreditation', 'contact_info', 'facilities'];
        $jsonData = [];
        foreach ($jsonFields as $field) {
            $jsonData[$field] = isset($input[$field]) ? json_encode($input[$field]) : null;
        }
        
        // Check which columns exist in the table
        $columnsStmt = $pdo->query("SHOW COLUMNS FROM clinical_centers");
        $existingColumns = [];
        while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = $row['Field'];
        }
        
        // Build dynamic INSERT query based on existing columns
        $insertFields = [];
        $insertValues = [];
        $insertParams = [];
        
        $allowedFields = ['name', 'country', 'city', 'address', 'website', 'description', 'specialties', 'phases_supported', 'capacity_patients', 'established_year', 'accreditation', 'contact_info', 'facilities', 'is_active'];
        foreach ($allowedFields as $field) {
            if (in_array($field, $existingColumns)) {
                $insertFields[] = $field;
                $insertValues[] = ":$field";
                if (in_array($field, $jsonFields)) {
                    $insertParams[":$field"] = $jsonData[$field];
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
        
        $sql = "INSERT INTO clinical_centers (" . implode(', ', $insertFields) . ") VALUES (" . implode(', ', $insertValues) . ")";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($insertParams);
        
        $newId = $pdo->lastInsertId();
        
        ob_clean();
        echo json_encode(['success' => true, 'message' => 'Clinical center created', 'id' => $newId]);
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$centerId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Center ID is required']);
            exit();
        }
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [':id' => $centerId];

        foreach (['name', 'country', 'city', 'address', 'website', 'description', 
                  'capacity_patients', 'established_year', 'is_active'] as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $input[$field];
            }
        }

        // Handle JSON fields
        $jsonFields = ['specialties', 'phases_supported', 'accreditation', 'contact_info', 'facilities'];
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
        $sql = "UPDATE clinical_centers SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Clinical center updated']);
    } elseif ($method === 'DELETE') {
        if (!$centerId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Center ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM clinical_centers WHERE id = :id");
        $stmt->bindValue(':id', $centerId, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Clinical center deleted']);
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

