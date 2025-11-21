<?php
// Admin investigators endpoint - Full CRUD
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
    
    // Check schema - detect if credentials exists (old) or name exists (new)
    $checkCredentials = $pdo->query("SHOW COLUMNS FROM investigators LIKE 'credentials'")->fetch();
    $checkName = $pdo->query("SHOW COLUMNS FROM investigators LIKE 'name'")->fetch();
    $useOldSchema = (bool)$checkCredentials;
    $useNameSchema = (bool)$checkName && !$useOldSchema;
    
    $method = $_SERVER['REQUEST_METHOD'];
    $investigatorId = null;
    
    if (isset($GLOBALS['investigatorId'])) {
        $investigatorId = (int)$GLOBALS['investigatorId'];
    } else {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
        if (in_array('investigators', $pathParts)) {
            $index = array_search('investigators', $pathParts);
            if ($index !== false && isset($pathParts[$index + 1])) {
                $possibleId = $pathParts[$index + 1];
                if (is_numeric($possibleId)) {
                    $investigatorId = (int)$possibleId;
                }
            }
        }
    }
    
    if ($method === 'GET') {
        if ($investigatorId) {
            $stmt = $pdo->prepare("SELECT * FROM investigators WHERE id = :id");
            $stmt->bindValue(':id', $investigatorId, PDO::PARAM_INT);
            $stmt->execute();
            $investigator = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($investigator) {
                // Decode JSON fields
                $jsonFields = ['specialties', 'therapeutic_areas', 'education', 'certifications', 'languages'];
                foreach ($jsonFields as $field) {
                    if (isset($investigator[$field])) {
                        $investigator[$field] = json_decode($investigator[$field], true) ?? [];
                    }
                }
                echo json_encode(['success' => true, 'data' => $investigator]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Investigator not found']);
            }
        } else {
            $limit = $_GET['limit'] ?? 20;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';

            if ($useOldSchema) {
                $sql = "SELECT id, first_name, last_name, title, specialization, affiliation, 
                               email, phone, country, city, credentials, research_interests, 
                               publications_count, trials_count, created_at, updated_at 
                        FROM investigators";
            } elseif ($useNameSchema) {
                $sql = "SELECT id, name, title, specialties, affiliation, 
                               email, phone, country, city, therapeutic_areas, 
                               trial_count as trials_count, created_at, updated_at 
                        FROM investigators";
            } else {
                $sql = "SELECT id, first_name, last_name, title, specialization, affiliation, 
                               email, phone, country, city, created_at, updated_at 
                        FROM investigators";
            }
            
            $countSql = "SELECT COUNT(*) FROM investigators";
            $whereConditions = [];
            $params = [];

            if ($search) {
                if ($useOldSchema) {
                    $whereConditions[] = "(first_name LIKE :search OR last_name LIKE :search OR affiliation LIKE :search OR specialization LIKE :search)";
                } elseif ($useNameSchema) {
                    $whereConditions[] = "(name LIKE :search OR affiliation LIKE :search)";
                } else {
                    $whereConditions[] = "(first_name LIKE :search OR last_name LIKE :search OR affiliation LIKE :search)";
                }
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
            $investigators = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countStmt = $pdo->prepare($countSql);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetchColumn();

            echo json_encode([
                'success' => true,
                'data' => $investigators,
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
        
        if (empty($input['name']) && (empty($input['first_name']) || empty($input['last_name']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name is required']);
            exit();
        }
        
        $jsonFields = ['specialties', 'therapeutic_areas', 'education', 'certifications', 'languages'];
        $jsonData = [];
        foreach ($jsonFields as $field) {
            $jsonData[$field] = isset($input[$field]) ? json_encode($input[$field]) : null;
        }
        
        if ($useOldSchema) {
            $sql = "INSERT INTO investigators (first_name, last_name, title, specialization, affiliation, 
                                              email, phone, country, city, credentials, research_interests, 
                                              publications_count, trials_count, created_at, updated_at)
                    VALUES (:first_name, :last_name, :title, :specialization, :affiliation, 
                            :email, :phone, :country, :city, :credentials, :research_interests, 
                            :publications_count, :trials_count, NOW(), NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':first_name' => $input['first_name'] ?? null,
                ':last_name' => $input['last_name'] ?? null,
                ':title' => $input['title'] ?? null,
                ':specialization' => $input['specialization'] ?? null,
                ':affiliation' => $input['affiliation'] ?? null,
                ':email' => $input['email'] ?? null,
                ':phone' => $input['phone'] ?? null,
                ':country' => $input['country'] ?? null,
                ':city' => $input['city'] ?? null,
                ':credentials' => $input['credentials'] ?? null,
                ':research_interests' => $jsonData['therapeutic_areas'] ?? null,
                ':publications_count' => $input['publications_count'] ?? 0,
                ':trials_count' => $input['trials_count'] ?? 0,
            ]);
        } elseif ($useNameSchema) {
            $sql = "INSERT INTO investigators (name, title, specialties, affiliation, 
                                              email, phone, country, city, therapeutic_areas, 
                                              trial_count, created_at, updated_at)
                    VALUES (:name, :title, :specialties, :affiliation, 
                            :email, :phone, :country, :city, :therapeutic_areas, 
                            :trial_count, NOW(), NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':name' => $input['name'] ?? null,
                ':title' => $input['title'] ?? null,
                ':specialties' => $jsonData['specialties'],
                ':affiliation' => $input['affiliation'] ?? null,
                ':email' => $input['email'] ?? null,
                ':phone' => $input['phone'] ?? null,
                ':country' => $input['country'] ?? null,
                ':city' => $input['city'] ?? null,
                ':therapeutic_areas' => $jsonData['therapeutic_areas'],
                ':trial_count' => $input['trial_count'] ?? 0,
            ]);
        } else {
            $sql = "INSERT INTO investigators (first_name, last_name, title, specialization, affiliation, 
                                              email, phone, country, city, created_at, updated_at)
                    VALUES (:first_name, :last_name, :title, :specialization, :affiliation, 
                            :email, :phone, :country, :city, NOW(), NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':first_name' => $input['first_name'] ?? null,
                ':last_name' => $input['last_name'] ?? null,
                ':title' => $input['title'] ?? null,
                ':specialization' => $input['specialization'] ?? null,
                ':affiliation' => $input['affiliation'] ?? null,
                ':email' => $input['email'] ?? null,
                ':phone' => $input['phone'] ?? null,
                ':country' => $input['country'] ?? null,
                ':city' => $input['city'] ?? null,
            ]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Investigator created', 'id' => $pdo->lastInsertId()]);
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        if (!$investigatorId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Investigator ID is required']);
            exit();
        }
        $input = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [':id' => $investigatorId];

        if ($useOldSchema) {
            foreach (['first_name', 'last_name', 'title', 'specialization', 'affiliation', 
                      'email', 'phone', 'country', 'city', 'credentials', 'research_interests', 
                      'publications_count', 'trials_count'] as $field) {
                if (isset($input[$field])) {
                    $fields[] = "$field = :$field";
                    if ($field === 'research_interests' && isset($input['therapeutic_areas'])) {
                        $params[":$field"] = json_encode($input['therapeutic_areas']);
                    } else {
                        $params[":$field"] = $input[$field];
                    }
                }
            }
        } elseif ($useNameSchema) {
            foreach (['name', 'title', 'affiliation', 'email', 'phone', 'country', 'city', 'trial_count'] as $field) {
                if (isset($input[$field])) {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $input[$field];
                }
            }
            if (isset($input['specialties'])) {
                $fields[] = "specialties = :specialties";
                $params[":specialties"] = json_encode($input['specialties']);
            }
            if (isset($input['therapeutic_areas'])) {
                $fields[] = "therapeutic_areas = :therapeutic_areas";
                $params[":therapeutic_areas"] = json_encode($input['therapeutic_areas']);
            }
        } else {
            foreach (['first_name', 'last_name', 'title', 'specialization', 'affiliation', 
                      'email', 'phone', 'country', 'city'] as $field) {
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
        $sql = "UPDATE investigators SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Investigator updated']);
    } elseif ($method === 'DELETE') {
        if (!$investigatorId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Investigator ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM investigators WHERE id = :id");
        $stmt->bindValue(':id', $investigatorId, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Investigator deleted']);
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

