<?php
// Admin Companies API - Full CRUD operations
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
    
    // Handle dynamic ID in URL path (e.g., /api/admin/companies/123)
    $companyId = null;
    
    // Check global variable set by router
    if (isset($GLOBALS['companyId'])) {
        $companyId = (int)$GLOBALS['companyId'];
    } else {
        // Fallback: extract from URL
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        
        if (in_array('companies', $pathParts)) {
            $companiesIndex = array_search('companies', $pathParts);
            if ($companiesIndex !== false && isset($pathParts[$companiesIndex + 1])) {
                $possibleId = $pathParts[$companiesIndex + 1];
                if (is_numeric($possibleId)) {
                    $companyId = (int)$possibleId;
                }
            }
        }
    }
    
    // GET - List all companies or get single company
    if ($method === 'GET') {
        if ($companyId) {
            // Get single company
            $stmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
            $stmt->execute([$companyId]);
            $company = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$company) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Company not found']);
                exit();
            }
            
            // Decode JSON fields
            if ($company['investors']) {
                $company['investors'] = json_decode($company['investors'], true) ?? [];
            }
            if ($company['products']) {
                $company['products'] = json_decode($company['products'], true) ?? [];
            }
            if ($company['markets']) {
                $company['markets'] = json_decode($company['markets'], true) ?? [];
            }
            if ($company['achievements']) {
                $company['achievements'] = json_decode($company['achievements'], true) ?? [];
            }
            if ($company['partnerships']) {
                $company['partnerships'] = json_decode($company['partnerships'], true) ?? [];
            }
            if ($company['awards']) {
                $company['awards'] = json_decode($company['awards'], true) ?? [];
            }
            
            echo json_encode(['success' => true, 'data' => $company]);
        } else {
            // List companies with pagination
            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
            $limit = isset($_GET['limit']) ? max(1, min(200, intval($_GET['limit']))) : 50;
            $offset = ($page - 1) * $limit;
            
            $search = $_GET['search'] ?? '';
            $industry = $_GET['industry'] ?? null;
            $stage = $_GET['stage'] ?? null;
            $sector = $_GET['sector'] ?? null;
            
            $sql = "SELECT id, name, description, website, industry, sector, stage, founded_year, 
                           employees_count, headquarters, country, funding_stage, total_funding, 
                           last_funding_date, logo_url, investors, products, markets, achievements, 
                           partnerships, awards, is_active, created_at, updated_at 
                    FROM companies";
            
            $params = [];
            $whereConditions = [];
            
            if ($search) {
                $whereConditions[] = "(name LIKE :search OR description LIKE :search)";
                $params[':search'] = "%{$search}%";
            }
            if ($industry) {
                $whereConditions[] = "industry = :industry";
                $params[':industry'] = $industry;
            }
            if ($stage) {
                $whereConditions[] = "stage = :stage";
                $params[':stage'] = $stage;
            }
            if ($sector) {
                $whereConditions[] = "sector = :sector";
                $params[':sector'] = $sector;
            }
            
            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(" AND ", $whereConditions);
            }
            
            // Get total count
            $countSql = "SELECT COUNT(*) FROM companies";
            if (!empty($whereConditions)) {
                $countSql .= " WHERE " . implode(" AND ", $whereConditions);
            }
            $countStmt = $pdo->prepare($countSql);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetchColumn();
            
            $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
            $stmt = $pdo->prepare($sql);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode JSON fields for each company
            foreach ($companies as &$company) {
                if ($company['investors']) {
                    $company['investors'] = json_decode($company['investors'], true) ?? [];
                }
                if ($company['products']) {
                    $company['products'] = json_decode($company['products'], true) ?? [];
                }
                if ($company['markets']) {
                    $company['markets'] = json_decode($company['markets'], true) ?? [];
                }
                if ($company['achievements']) {
                    $company['achievements'] = json_decode($company['achievements'], true) ?? [];
                }
                if ($company['partnerships']) {
                    $company['partnerships'] = json_decode($company['partnerships'], true) ?? [];
                }
                if ($company['awards']) {
                    $company['awards'] = json_decode($company['awards'], true) ?? [];
                }
            }
            
            echo json_encode([
                'success' => true,
                'data' => $companies,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $page,
                    'limit' => $limit,
                    'offset' => $offset,
                    'has_more' => ($offset + $limit) < $total
                ]
            ]);
        }
    }
    // POST - Create new company
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        
        // Validate required fields
        if (empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Company name is required']);
            exit();
        }
        
        // Prepare JSON fields
        $investors = isset($input['investors']) ? json_encode($input['investors']) : null;
        $products = isset($input['products']) ? json_encode($input['products']) : null;
        $markets = isset($input['markets']) ? json_encode($input['markets']) : null;
        $achievements = isset($input['achievements']) ? json_encode($input['achievements']) : null;
        $partnerships = isset($input['partnerships']) ? json_encode($input['partnerships']) : null;
        $awards = isset($input['awards']) ? json_encode($input['awards']) : null;
        
        $sql = "INSERT INTO companies (name, description, website, industry, sector, stage, 
                                      founded_year, employees_count, headquarters, country, 
                                      funding_stage, total_funding, last_funding_date, logo_url, 
                                      investors, products, markets, achievements, partnerships, awards, 
                                      is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $input['name'] ?? null,
            $input['description'] ?? null,
            $input['website'] ?? null,
            $input['industry'] ?? null,
            $input['sector'] ?? null,
            $input['stage'] ?? null,
            isset($input['founded_year']) ? (int)$input['founded_year'] : null,
            isset($input['employees_count']) ? (int)$input['employees_count'] : null,
            $input['headquarters'] ?? null,
            $input['country'] ?? null,
            $input['funding_stage'] ?? null,
            isset($input['total_funding']) ? floatval($input['total_funding']) : 0,
            $input['last_funding_date'] ?? null,
            $input['logo_url'] ?? null,
            $investors,
            $products,
            $markets,
            $achievements,
            $partnerships,
            $awards
        ]);
        
        $id = $pdo->lastInsertId();
        
        // Fetch the created company
        $fetch = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
        $fetch->execute([$id]);
        $company = $fetch->fetch(PDO::FETCH_ASSOC);
        
        // Decode JSON fields
        if ($company['investors']) {
            $company['investors'] = json_decode($company['investors'], true) ?? [];
        }
        if ($company['products']) {
            $company['products'] = json_decode($company['products'], true) ?? [];
        }
        if ($company['markets']) {
            $company['markets'] = json_decode($company['markets'], true) ?? [];
        }
        if ($company['achievements']) {
            $company['achievements'] = json_decode($company['achievements'], true) ?? [];
        }
        if ($company['partnerships']) {
            $company['partnerships'] = json_decode($company['partnerships'], true) ?? [];
        }
        if ($company['awards']) {
            $company['awards'] = json_decode($company['awards'], true) ?? [];
        }
        
        echo json_encode(['success' => true, 'data' => $company]);
    }
    // PUT/PATCH - Update company
    elseif ($method === 'PUT' || $method === 'PATCH') {
        $id = $companyId ?? (isset($_GET['id']) ? (int)$_GET['id'] : 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid ID']);
            exit();
        }
        
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $fields = [];
        $params = [];
        
        $allowedFields = [
            'name', 'description', 'website', 'industry', 'sector', 'stage',
            'founded_year', 'employees_count', 'headquarters', 'country',
            'funding_stage', 'total_funding', 'last_funding_date', 'logo_url',
            'is_active'
        ];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                $fields[] = "{$field} = ?";
                if ($field === 'founded_year' || $field === 'employees_count') {
                    $params[] = isset($input[$field]) ? (int)$input[$field] : null;
                } elseif ($field === 'total_funding') {
                    $params[] = isset($input[$field]) ? floatval($input[$field]) : null;
                } elseif ($field === 'is_active') {
                    $params[] = (int)!!$input[$field];
                } else {
                    $params[] = $input[$field] ?? null;
                }
            }
        }
        
        // Handle JSON fields
        if (array_key_exists('investors', $input)) {
            $fields[] = "investors = ?";
            $params[] = json_encode($input['investors']);
        }
        if (array_key_exists('products', $input)) {
            $fields[] = "products = ?";
            $params[] = json_encode($input['products']);
        }
        if (array_key_exists('markets', $input)) {
            $fields[] = "markets = ?";
            $params[] = json_encode($input['markets']);
        }
        if (array_key_exists('achievements', $input)) {
            $fields[] = "achievements = ?";
            $params[] = json_encode($input['achievements']);
        }
        if (array_key_exists('partnerships', $input)) {
            $fields[] = "partnerships = ?";
            $params[] = json_encode($input['partnerships']);
        }
        if (array_key_exists('awards', $input)) {
            $fields[] = "awards = ?";
            $params[] = json_encode($input['awards']);
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        
        $sql = "UPDATE companies SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Fetch the updated company
        $fetch = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
        $fetch->execute([$id]);
        $company = $fetch->fetch(PDO::FETCH_ASSOC);
        
        if (!$company) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Company not found']);
            exit();
        }
        
        // Decode JSON fields
        if ($company['investors']) {
            $company['investors'] = json_decode($company['investors'], true) ?? [];
        }
        if ($company['products']) {
            $company['products'] = json_decode($company['products'], true) ?? [];
        }
        if ($company['markets']) {
            $company['markets'] = json_decode($company['markets'], true) ?? [];
        }
        if ($company['achievements']) {
            $company['achievements'] = json_decode($company['achievements'], true) ?? [];
        }
        if ($company['partnerships']) {
            $company['partnerships'] = json_decode($company['partnerships'], true) ?? [];
        }
        if ($company['awards']) {
            $company['awards'] = json_decode($company['awards'], true) ?? [];
        }
        
        echo json_encode(['success' => true, 'data' => $company]);
    }
    // DELETE - Delete company
    elseif ($method === 'DELETE') {
        $id = $companyId ?? (isset($_GET['id']) ? (int)$_GET['id'] : 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid ID']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM companies WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Company deleted']);
    }
    else {
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

