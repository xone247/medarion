<?php
// Start output buffering to prevent premature output
ob_start();

// Admin grants endpoint - Full CRUD
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
    
    // Handle dynamic ID in URL path (e.g., /api/admin/grants/123)
    $grantId = null;
    
    // Check global variable set by router
    if (isset($GLOBALS['grantId'])) {
        $grantId = (int)$GLOBALS['grantId'];
    } else {
        // Fallback: extract from URL
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        
        if (in_array('grants', $pathParts)) {
            $grantsIndex = array_search('grants', $pathParts);
            if ($grantsIndex !== false && isset($pathParts[$grantsIndex + 1])) {
                $possibleId = $pathParts[$grantsIndex + 1];
                if (is_numeric($possibleId)) {
                    $grantId = (int)$possibleId;
                }
            }
        }
    }
    
    // GET - List all grants or get single grant
    if ($method === 'GET') {
        if ($grantId) {
            // Get single grant
            $stmt = $pdo->prepare("SELECT * FROM grants WHERE id = :id");
            $stmt->bindValue(':id', $grantId, PDO::PARAM_INT);
            $stmt->execute();
            $grant = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($grant) {
                // Decode JSON fields
                if ($grant['funders']) {
                    $grant['funders'] = json_decode($grant['funders'], true) ?? [];
                }

                echo json_encode(['success' => true, 'data' => $grant]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Grant not found']);
            }
        } else {
            // List all grants with pagination and search
            $limit = $_GET['limit'] ?? 20;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';

            // Select columns - match the working get_grants.php query first
            // Start with basic columns, then try to add country/sector if they exist
            $sql = "SELECT id, title, description, funding_agency, amount, grant_type, 
                           application_deadline, award_date, status, requirements, 
                           contact_email, website, created_at, updated_at 
                    FROM grants";
            $countSql = "SELECT COUNT(*) FROM grants";
            $whereConditions = [];
            $params = [];

            if ($search) {
                $whereConditions[] = "(title LIKE :search OR description LIKE :search OR funding_agency LIKE :search OR grant_type LIKE :search)";
                $params[':search'] = "%$search%";
            }

            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(" AND ", $whereConditions);
                $countSql .= " WHERE " . implode(" AND ", $whereConditions);
            }

            $sql .= " ORDER BY application_deadline DESC LIMIT :limit OFFSET :offset";

            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $grants = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Ensure grants is an array
            if (!is_array($grants)) {
                $grants = [];
            }

            // Decode funders JSON for each grant (if funders column exists)
            foreach ($grants as $key => $grant) {
                if (isset($grant['funders']) && $grant['funders']) {
                    $grants[$key]['funders'] = json_decode($grant['funders'], true) ?? [];
                }
            }

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

            // Clear any output before JSON
            ob_clean();
            
            echo json_encode([
                'success' => true,
                'data' => $grants,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'has_more' => ($offset + $limit) < $total
                ]
            ]);
        }
    } 
    // POST - Create new grant
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (empty($input['title']) || empty($input['amount'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Title and amount are required']);
            exit();
        }
        
        $sql = "INSERT INTO grants (title, description, funding_agency, amount, grant_type, 
                                   application_deadline, award_date, status, requirements, 
                                   contact_email, website, country, sector, duration, funders, 
                                   created_at, updated_at)
                VALUES (:title, :description, :funding_agency, :amount, :grant_type, 
                        :application_deadline, :award_date, :status, :requirements, 
                        :contact_email, :website, :country, :sector, :duration, :funders, 
                        NOW(), NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':title' => $input['title'] ?? null,
            ':description' => $input['description'] ?? null,
            ':funding_agency' => $input['funding_agency'] ?? null,
            ':amount' => $input['amount'] ?? 0,
            ':grant_type' => $input['grant_type'] ?? null,
            ':application_deadline' => $input['application_deadline'] ?? null,
            ':award_date' => $input['award_date'] ?? null,
            ':status' => $input['status'] ?? 'open',
            ':requirements' => $input['requirements'] ?? null,
            ':contact_email' => $input['contact_email'] ?? null,
            ':website' => $input['website'] ?? null,
            ':country' => $input['country'] ?? null,
            ':sector' => $input['sector'] ?? null,
            ':duration' => $input['duration'] ?? null,
            ':funders' => isset($input['funders']) ? json_encode($input['funders']) : null,
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Grant created', 'id' => $pdo->lastInsertId()]);
    }
    // PUT/PATCH - Update grant
    elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$grantId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Grant ID is required']);
            exit();
        }
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [':id' => $grantId];

        foreach ([
            'title', 'description', 'funding_agency', 'amount', 'grant_type', 
            'application_deadline', 'award_date', 'status', 'requirements', 
            'contact_email', 'website', 'country', 'sector', 'duration'
        ] as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = :$field";
                if (in_array($field, ['amount'])) {
                    $params[":$field"] = isset($input[$field]) ? floatval($input[$field]) : null;
                } else {
                    $params[":$field"] = $input[$field];
                }
            }
        }

        // Handle funders JSON field
        if (isset($input['funders'])) {
            $fields[] = "funders = :funders";
            $params[":funders"] = json_encode($input['funders']);
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }
        
        $fields[] = "updated_at = NOW()";
        $sql = "UPDATE grants SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Grant updated']);
    }
    // DELETE - Delete grant
    elseif ($method === 'DELETE') {
        if (!$grantId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Grant ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM grants WHERE id = :id");
        $stmt->bindValue(':id', $grantId, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Grant deleted']);
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

