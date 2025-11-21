<?php
// Start output buffering to prevent premature output
ob_start();

// Admin public markets endpoint - Full CRUD
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
    $stockId = null;
    
    if (isset($GLOBALS['stockId'])) {
        $stockId = (int)$GLOBALS['stockId'];
    } else {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        if ((in_array('public-markets', $pathParts) || in_array('public_markets', $pathParts))) {
            $index = array_search('public-markets', $pathParts);
            if ($index === false) $index = array_search('public_markets', $pathParts);
            if ($index !== false && isset($pathParts[$index + 1])) {
                $possibleId = $pathParts[$index + 1];
                if (is_numeric($possibleId)) {
                    $stockId = (int)$possibleId;
                }
            }
        }
    }
    
    if ($method === 'GET') {
        if ($stockId) {
            $stmt = $pdo->prepare("SELECT * FROM public_stocks WHERE id = :id");
            $stmt->bindValue(':id', $stockId, PDO::PARAM_INT);
            $stmt->execute();
            $stock = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($stock) {
                echo json_encode(['success' => true, 'data' => $stock]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Stock not found']);
            }
        } else {
            $limit = $_GET['limit'] ?? 20;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';

            // Use SELECT * to avoid column mismatch errors
            $sql = "SELECT * FROM public_stocks";
            $countSql = "SELECT COUNT(*) FROM public_stocks";
            $whereConditions = [];
            $params = [];

            if ($search) {
                $whereConditions[] = "(company_name LIKE :search OR ticker LIKE :search OR exchange LIKE :search)";
                $params[':search'] = "%$search%";
            }

            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(" AND ", $whereConditions);
                $countSql .= " WHERE " . implode(" AND ", $whereConditions);
            }

            $sql .= " ORDER BY last_updated DESC LIMIT :limit OFFSET :offset";

            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $stocks = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
            
            // Ensure stocks is an array
            if (!is_array($stocks)) {
                $stocks = [];
            }

            // Clear any output before JSON
            ob_clean();
            
            echo json_encode([
                'success' => true,
                'data' => $stocks,
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
        
        if (empty($input['company_name']) || empty($input['ticker'])) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Company name and ticker are required']);
            exit();
        }
        
        // Check which columns exist in the table
        $columnsStmt = $pdo->query("SHOW COLUMNS FROM public_stocks");
        $existingColumns = [];
        while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = $row['Field'];
        }
        
        // Build dynamic INSERT query based on existing columns
        $insertFields = [];
        $insertValues = [];
        $insertParams = [];
        
        $allowedFields = ['company_name', 'ticker', 'exchange', 'price', 'market_cap', 'currency', 'sector', 'country'];
        foreach ($allowedFields as $field) {
            if (in_array($field, $existingColumns)) {
                $insertFields[] = $field;
                $insertValues[] = ":$field";
                $insertParams[":$field"] = $input[$field] ?? ($field === 'currency' ? 'USD' : null);
            }
        }
        
        // Always include last_updated and created_at if they exist
        if (in_array('last_updated', $existingColumns)) {
            $insertFields[] = 'last_updated';
            $insertValues[] = 'NOW()';
        }
        if (in_array('created_at', $existingColumns)) {
            $insertFields[] = 'created_at';
            $insertValues[] = 'NOW()';
        }
        
        $sql = "INSERT INTO public_stocks (" . implode(', ', $insertFields) . ") 
                VALUES (" . implode(', ', $insertValues) . ")";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($insertParams);
        
        ob_clean();
        echo json_encode(['success' => true, 'message' => 'Stock created', 'id' => $pdo->lastInsertId()]);
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$stockId) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Stock ID is required']);
            exit();
        }
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check which columns exist in the table
        $columnsStmt = $pdo->query("SHOW COLUMNS FROM public_stocks");
        $existingColumns = [];
        while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = $row['Field'];
        }
        
        $fields = [];
        $params = [':id' => $stockId];

        // Only update fields that exist in the table and are provided in the input
        $allowedFields = ['company_name', 'ticker', 'exchange', 'price', 'market_cap', 
                          'currency', 'sector', 'country'];
        foreach ($allowedFields as $field) {
            if (in_array($field, $existingColumns) && isset($input[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $input[$field];
            }
        }
        
        if (empty($fields)) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }
        
        // Always update last_updated if the column exists
        if (in_array('last_updated', $existingColumns)) {
            $fields[] = "last_updated = NOW()";
        }
        
        $sql = "UPDATE public_stocks SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        ob_clean();
        echo json_encode(['success' => true, 'message' => 'Stock updated']);
    } elseif ($method === 'DELETE') {
        if (!$stockId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Stock ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM public_stocks WHERE id = :id");
        $stmt->bindValue(':id', $stockId, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Stock deleted']);
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

