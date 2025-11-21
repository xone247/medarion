<?php
// Admin regulatory endpoint - Full CRUD
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
    
    // Check schema - detect if regulatory_body_id exists (old) or regulatory_body (new)
    $checkColumn = $pdo->query("SHOW COLUMNS FROM company_regulatory LIKE 'regulatory_body_id'")->fetch();
    $useOldSchema = (bool)$checkColumn;
    
    $method = $_SERVER['REQUEST_METHOD'];
    $regulatoryId = null;
    
    if (isset($GLOBALS['regulatoryId'])) {
        $regulatoryId = (int)$GLOBALS['regulatoryId'];
    } else {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        if (in_array('regulatory', $pathParts)) {
            $index = array_search('regulatory', $pathParts);
            if ($index !== false && isset($pathParts[$index + 1])) {
                $possibleId = $pathParts[$index + 1];
                if (is_numeric($possibleId)) {
                    $regulatoryId = (int)$possibleId;
                }
            }
        }
    }
    
    if ($method === 'GET') {
        if ($regulatoryId) {
            if ($useOldSchema) {
                $stmt = $pdo->prepare("
                    SELECT cr.*, c.name as company_name, rb.name as regulatory_body_name
                    FROM company_regulatory cr
                    LEFT JOIN companies c ON cr.company_id = c.id
                    LEFT JOIN regulatory_bodies rb ON cr.regulatory_body_id = rb.id
                    WHERE cr.id = :id
                ");
            } else {
                $stmt = $pdo->prepare("
                    SELECT cr.*, c.name as company_name
                    FROM company_regulatory cr
                    LEFT JOIN companies c ON cr.company_id = c.id
                    WHERE cr.id = :id
                ");
            }
            $stmt->bindValue(':id', $regulatoryId, PDO::PARAM_INT);
            $stmt->execute();
            $regulatory = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($regulatory) {
                echo json_encode(['success' => true, 'data' => $regulatory]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Regulatory record not found']);
            }
        } else {
            $limit = $_GET['limit'] ?? 20;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';

            if ($useOldSchema) {
                $sql = "SELECT cr.id, cr.company_id, cr.regulatory_body_id, cr.approval_type, 
                               cr.approval_date, cr.status, cr.validity_period, cr.notes, 
                               cr.created_at, cr.updated_at,
                               c.name as company_name,
                               rb.name as regulatory_body_name
                        FROM company_regulatory cr
                        LEFT JOIN companies c ON cr.company_id = c.id
                        LEFT JOIN regulatory_bodies rb ON cr.regulatory_body_id = rb.id";
            } else {
                $sql = "SELECT cr.id, cr.company_id, cr.regulatory_body, cr.product, 
                               cr.approval_date, cr.status, cr.region, cr.notes, 
                               cr.created_at, cr.updated_at,
                               c.name as company_name
                        FROM company_regulatory cr
                        LEFT JOIN companies c ON cr.company_id = c.id";
            }
            $countSql = "SELECT COUNT(*) FROM company_regulatory cr";
            $whereConditions = [];
            $params = [];

            if ($search) {
                $whereConditions[] = "(c.name LIKE :search OR cr.notes LIKE :search)";
                $params[':search'] = "%$search%";
            }

            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(" AND ", $whereConditions);
                $countSql .= " WHERE " . implode(" AND ", $whereConditions);
            }

            $sql .= " ORDER BY cr.approval_date DESC LIMIT :limit OFFSET :offset";

            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countStmt = $pdo->prepare($countSql);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetchColumn();

            echo json_encode([
                'success' => true,
                'data' => $records,
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
        
        if (empty($input['company_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Company ID is required']);
            exit();
        }
        
        if ($useOldSchema) {
            $sql = "INSERT INTO company_regulatory (company_id, regulatory_body_id, approval_type, 
                                                    approval_date, status, validity_period, notes, 
                                                    created_at, updated_at)
                    VALUES (:company_id, :regulatory_body_id, :approval_type, :approval_date, 
                            :status, :validity_period, :notes, NOW(), NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':company_id' => $input['company_id'],
                ':regulatory_body_id' => $input['regulatory_body_id'] ?? null,
                ':approval_type' => $input['approval_type'] ?? null,
                ':approval_date' => $input['approval_date'] ?? null,
                ':status' => $input['status'] ?? 'pending',
                ':validity_period' => $input['validity_period'] ?? null,
                ':notes' => $input['notes'] ?? null,
            ]);
        } else {
            $sql = "INSERT INTO company_regulatory (company_id, regulatory_body, product, 
                                                    approval_date, status, region, notes, 
                                                    created_at, updated_at)
                    VALUES (:company_id, :regulatory_body, :product, :approval_date, 
                            :status, :region, :notes, NOW(), NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':company_id' => $input['company_id'],
                ':regulatory_body' => $input['regulatory_body'] ?? null,
                ':product' => $input['product'] ?? null,
                ':approval_date' => $input['approval_date'] ?? null,
                ':status' => $input['status'] ?? 'pending',
                ':region' => $input['region'] ?? null,
                ':notes' => $input['notes'] ?? null,
            ]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Regulatory record created', 'id' => $pdo->lastInsertId()]);
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$regulatoryId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Regulatory ID is required']);
            exit();
        }
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [':id' => $regulatoryId];

        if ($useOldSchema) {
            foreach (['company_id', 'regulatory_body_id', 'approval_type', 'approval_date', 
                      'status', 'validity_period', 'notes'] as $field) {
                if (isset($input[$field])) {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $input[$field];
                }
            }
        } else {
            foreach (['company_id', 'regulatory_body', 'product', 'approval_date', 
                      'status', 'region', 'notes'] as $field) {
                if (isset($input[$field])) {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $input[$field];
                }
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }
        
        $fields[] = "updated_at = NOW()";
        $sql = "UPDATE company_regulatory SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Regulatory record updated']);
    } elseif ($method === 'DELETE') {
        if (!$regulatoryId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Regulatory ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM company_regulatory WHERE id = :id");
        $stmt->bindValue(':id', $regulatoryId, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Regulatory record deleted']);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>

