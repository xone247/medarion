<?php
// Admin clinical trials endpoint - Full CRUD
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
    $trialId = null;
    
    if (isset($GLOBALS['trialId'])) {
        $trialId = (int)$GLOBALS['trialId'];
    } else {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        if (in_array('clinical-trials', $pathParts) || in_array('clinical_trials', $pathParts)) {
            $index = array_search('clinical-trials', $pathParts);
            if ($index === false) $index = array_search('clinical_trials', $pathParts);
            if ($index !== false && isset($pathParts[$index + 1])) {
                $possibleId = $pathParts[$index + 1];
                if (is_numeric($possibleId)) {
                    $trialId = (int)$possibleId;
                }
            }
        }
    }
    
    if ($method === 'GET') {
        if ($trialId) {
            $stmt = $pdo->prepare("SELECT * FROM clinical_trials WHERE id = :id");
            $stmt->bindValue(':id', $trialId, PDO::PARAM_INT);
            $stmt->execute();
            $trial = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($trial) {
                echo json_encode(['success' => true, 'data' => $trial]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Clinical trial not found']);
            }
        } else {
            $limit = $_GET['limit'] ?? 20;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';

            $sql = "SELECT id, title, description, phase, medical_condition, intervention, 
                           sponsor, location, country, start_date, end_date, status, nct_number, 
                           indication, created_at, updated_at 
                    FROM clinical_trials";
            $countSql = "SELECT COUNT(*) FROM clinical_trials";
            $whereConditions = [];
            $params = [];

            if ($search) {
                $whereConditions[] = "(title LIKE :search OR description LIKE :search OR medical_condition LIKE :search OR sponsor LIKE :search)";
                $params[':search'] = "%$search%";
            }

            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(" AND ", $whereConditions);
                $countSql .= " WHERE " . implode(" AND ", $whereConditions);
            }

            $sql .= " ORDER BY start_date DESC LIMIT :limit OFFSET :offset";

            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $trials = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countStmt = $pdo->prepare($countSql);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetchColumn();

            echo json_encode([
                'success' => true,
                'data' => $trials,
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
        
        if (empty($input['title'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Title is required']);
            exit();
        }
        
        $sql = "INSERT INTO clinical_trials (title, description, phase, medical_condition, intervention, 
                                            sponsor, location, country, start_date, end_date, status, 
                                            nct_number, indication, created_at, updated_at)
                VALUES (:title, :description, :phase, :medical_condition, :intervention, 
                        :sponsor, :location, :country, :start_date, :end_date, :status, 
                        :nct_number, :indication, NOW(), NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':title' => $input['title'] ?? null,
            ':description' => $input['description'] ?? null,
            ':phase' => $input['phase'] ?? null,
            ':medical_condition' => $input['medical_condition'] ?? null,
            ':intervention' => $input['intervention'] ?? null,
            ':sponsor' => $input['sponsor'] ?? null,
            ':location' => $input['location'] ?? null,
            ':country' => $input['country'] ?? null,
            ':start_date' => $input['start_date'] ?? null,
            ':end_date' => $input['end_date'] ?? null,
            ':status' => $input['status'] ?? 'recruiting',
            ':nct_number' => $input['nct_number'] ?? null,
            ':indication' => $input['indication'] ?? null,
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Clinical trial created', 'id' => $pdo->lastInsertId()]);
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$trialId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Trial ID is required']);
            exit();
        }
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [':id' => $trialId];

        foreach (['title', 'description', 'phase', 'medical_condition', 'intervention', 
                  'sponsor', 'location', 'country', 'start_date', 'end_date', 'status', 
                  'nct_number', 'indication'] as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $input[$field];
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }
        
        $fields[] = "updated_at = NOW()";
        $sql = "UPDATE clinical_trials SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Clinical trial updated']);
    } elseif ($method === 'DELETE') {
        if (!$trialId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Trial ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM clinical_trials WHERE id = :id");
        $stmt->bindValue(':id', $trialId, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Clinical trial deleted']);
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

