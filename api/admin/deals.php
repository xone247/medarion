<?php
// Admin deals endpoint - Full CRUD
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
    
    // Handle dynamic ID in URL path (e.g., /api/admin/deals/123)
    $dealId = null;
    
    // Check global variable set by router
    if (isset($GLOBALS['dealId'])) {
        $dealId = (int)$GLOBALS['dealId'];
    } else {
        // Fallback: extract from URL
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        
        if (in_array('deals', $pathParts)) {
            $dealsIndex = array_search('deals', $pathParts);
            if ($dealsIndex !== false && isset($pathParts[$dealsIndex + 1])) {
                $possibleId = $pathParts[$dealsIndex + 1];
                if (is_numeric($possibleId)) {
                    $dealId = (int)$possibleId;
                }
            }
        }
    }
    
    // GET - List all deals or get single deal
    if ($method === 'GET') {
        if ($dealId) {
            // Get single deal with company info
            $stmt = $pdo->prepare("
                SELECT d.*, c.name as company_name, c.industry, c.sector as company_sector, c.country as company_country
                FROM deals d
                LEFT JOIN companies c ON d.company_id = c.id
                WHERE d.id = :id
            ");
            $stmt->bindValue(':id', $dealId, PDO::PARAM_INT);
            $stmt->execute();
            $deal = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($deal) {
                // Decode JSON fields
                if ($deal['participants']) {
                    $deal['participants'] = json_decode($deal['participants'], true) ?? [];
                }

                echo json_encode(['success' => true, 'data' => $deal]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Deal not found']);
            }
        } else {
            // List all deals with pagination and search
            $limit = $_GET['limit'] ?? 20;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';

            $sql = "
                SELECT d.id, d.company_id, d.deal_type, d.amount, d.valuation, 
                       d.lead_investor, d.participants, d.deal_date, d.status, 
                       d.description, d.sector, d.created_at, d.updated_at,
                       c.name as company_name, c.industry, c.sector as company_sector, c.country
                FROM deals d
                LEFT JOIN companies c ON d.company_id = c.id
            ";
            $countSql = "SELECT COUNT(*) FROM deals d";
            $whereConditions = [];
            $params = [];

            if ($search) {
                $whereConditions[] = "(c.name LIKE :search OR d.description LIKE :search OR d.deal_type LIKE :search OR d.lead_investor LIKE :search)";
                $params[':search'] = "%$search%";
            }

            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(" AND ", $whereConditions);
                $countSql .= " WHERE " . implode(" AND ", $whereConditions);
            }

            $sql .= " ORDER BY d.deal_date DESC LIMIT :limit OFFSET :offset";

            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode participants JSON for each deal and ensure company_name is set
            foreach ($deals as &$deal) {
                if ($deal['participants']) {
                    $deal['participants'] = json_decode($deal['participants'], true) ?? [];
                }
                // Ensure company_name has a proper fallback if NULL
                // Only use fallback if company_id exists but company was not found (NULL from JOIN)
                // If company_id is NULL, show "No Company" instead of misleading names
                if (empty($deal['company_name'])) {
                    if (!empty($deal['company_id'])) {
                        // Company ID exists but JOIN returned NULL - company was deleted or doesn't exist
                        $deal['company_name'] = 'Company Not Found';
                    } else {
                        // No company_id set - deal is not linked to a company
                        $deal['company_name'] = 'No Company';
                    }
                }
                // Ensure country has a fallback
                if (empty($deal['country'])) {
                    $deal['country'] = $deal['company_country'] ?? 'Unknown';
                }
            }

            $countStmt = $pdo->prepare($countSql);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetchColumn();

            echo json_encode([
                'success' => true,
                'data' => $deals,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'has_more' => ($offset + $limit) < $total
                ]
            ]);
        }
    } 
    // POST - Create new deal
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (empty($input['deal_type']) || empty($input['amount'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Deal type and amount are required']);
            exit();
        }
        
        $sql = "INSERT INTO deals (company_id, deal_type, amount, valuation, lead_investor, participants, deal_date, status, description, sector, created_at, updated_at)
                VALUES (:company_id, :deal_type, :amount, :valuation, :lead_investor, :participants, :deal_date, :status, :description, :sector, NOW(), NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':company_id' => $input['company_id'] ?? null,
            ':deal_type' => $input['deal_type'],
            ':amount' => $input['amount'] ?? 0,
            ':valuation' => $input['valuation'] ?? null,
            ':lead_investor' => $input['lead_investor'] ?? null,
            ':participants' => isset($input['participants']) ? json_encode($input['participants']) : null,
            ':deal_date' => $input['deal_date'] ?? date('Y-m-d'),
            ':status' => $input['status'] ?? 'closed',
            ':description' => $input['description'] ?? null,
            ':sector' => $input['sector'] ?? null,
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Deal created', 'id' => $pdo->lastInsertId()]);
    }
    // PUT/PATCH - Update deal
    elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$dealId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Deal ID is required']);
            exit();
        }
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [':id' => $dealId];

        foreach ([
            'company_id', 'deal_type', 'amount', 'valuation', 'lead_investor', 
            'deal_date', 'status', 'description', 'sector'
        ] as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = :$field";
                if ($field === 'company_id' && $input[$field]) {
                    $params[":$field"] = (int)$input[$field];
                } elseif (in_array($field, ['amount', 'valuation'])) {
                    $params[":$field"] = isset($input[$field]) ? floatval($input[$field]) : null;
                } else {
                    $params[":$field"] = $input[$field];
                }
            }
        }

        // Handle participants JSON field
        if (isset($input['participants'])) {
            $fields[] = "participants = :participants";
            $params[":participants"] = json_encode($input['participants']);
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }
        
        $fields[] = "updated_at = NOW()";
        $sql = "UPDATE deals SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Deal updated']);
    }
    // DELETE - Delete deal
    elseif ($method === 'DELETE') {
        if (!$dealId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Deal ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM deals WHERE id = :id");
        $stmt->bindValue(':id', $dealId, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Deal deleted']);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>

