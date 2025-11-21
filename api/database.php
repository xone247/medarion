<?php
// Medarion Platform Database API
// This API handles all database operations for admin interfaces and AI integration

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$dbname = 'medarion_platform';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Remove 'api/database' from path
if (count($pathParts) >= 2 && $pathParts[0] === 'api' && $pathParts[1] === 'database') {
    $pathParts = array_slice($pathParts, 2);
}

$table = $pathParts[0] ?? '';
$id = $pathParts[1] ?? null;
$action = $pathParts[2] ?? '';

// Validate table name
$allowedTables = [
    'companies', 'deals', 'grants', 'investors', 'clinical_trials',
    'regulatory_bodies', 'clinical_centers', 'investigators', 'public_stocks',
    'nation_pulse_data', 'crm_investors', 'crm_meetings', 'ai_usage_log',
    'ai_models', 'ai_prompts', 'user_activity_log', 'system_metrics',
    'data_imports', 'data_exports', 'users'
];

if (!in_array($table, $allowedTables)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid table name']);
    exit();
}

// Authentication middleware (simplified)
function authenticate() {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit();
    }
    
    // In a real implementation, validate the JWT token here
    return true;
}

// Generic CRUD operations
class DatabaseAPI {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    // Create record
    public function create($table, $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        
        $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($data as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        
        $stmt->execute();
        return ['id' => $this->pdo->lastInsertId(), 'success' => true];
    }
    
    // Read records
    public function read($table, $id = null, $filters = []) {
        $sql = "SELECT * FROM $table";
        $params = [];
        
        if ($id) {
            $sql .= " WHERE id = :id";
            $params['id'] = $id;
        } elseif (!empty($filters)) {
            $conditions = [];
            foreach ($filters as $key => $value) {
                $conditions[] = "$key = :$key";
                $params[$key] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $conditions);
        }
        
        $sql .= " ORDER BY id DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($id) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    // Update record
    public function update($table, $id, $data) {
        $setParts = [];
        foreach (array_keys($data) as $key) {
            $setParts[] = "$key = :$key";
        }
        
        $sql = "UPDATE $table SET " . implode(', ', $setParts) . " WHERE id = :id";
        $data['id'] = $id;
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($data);
        
        return ['success' => true, 'affected_rows' => $stmt->rowCount()];
    }
    
    // Delete record
    public function delete($table, $id) {
        $sql = "DELETE FROM $table WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        
        return ['success' => true, 'affected_rows' => $stmt->rowCount()];
    }
    
    // Batch operations
    public function batchCreate($table, $records) {
        $this->pdo->beginTransaction();
        
        try {
            $results = [];
            foreach ($records as $record) {
                $result = $this->create($table, $record);
                $results[] = $result;
            }
            
            $this->pdo->commit();
            return ['success' => true, 'records' => $results];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    public function batchUpdate($table, $updates) {
        $this->pdo->beginTransaction();
        
        try {
            $results = [];
            foreach ($updates as $update) {
                $result = $this->update($table, $update['id'], $update['data']);
                $results[] = $result;
            }
            
            $this->pdo->commit();
            return ['success' => true, 'records' => $results];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    // Search functionality
    public function search($table, $query, $fields = []) {
        if (empty($fields)) {
            // Get all text/varchar columns
            $sql = "SHOW COLUMNS FROM $table WHERE TYPE LIKE '%varchar%' OR TYPE LIKE '%text%'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $fields = $columns;
        }
        
        $conditions = [];
        $params = [];
        
        foreach ($fields as $field) {
            $conditions[] = "$field LIKE :query";
        }
        
        $sql = "SELECT * FROM $table WHERE " . implode(' OR ', $conditions);
        $params['query'] = "%$query%";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Statistics
    public function getStats($table) {
        $sql = "SELECT COUNT(*) as total FROM $table";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get additional stats based on table
        $stats = ['total' => $total];
        
        switch ($table) {
            case 'companies':
                $sql = "SELECT sector, COUNT(*) as count FROM $table GROUP BY sector ORDER BY count DESC LIMIT 5";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
                $stats['sectors'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
                
            case 'deals':
                $sql = "SELECT deal_type, COUNT(*) as count FROM $table GROUP BY deal_type ORDER BY count DESC";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
                $stats['types'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $sql = "SELECT SUM(amount) as total_amount FROM $table";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
                $stats['total_amount'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_amount'];
                break;
                
            case 'investors':
                $sql = "SELECT type, COUNT(*) as count FROM $table GROUP BY type ORDER BY count DESC";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
                $stats['types'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
        }
        
        return $stats;
    }
}

// Initialize API
$api = new DatabaseAPI($pdo);

// Route requests
try {
    switch ($method) {
        case 'GET':
            if ($action === 'stats') {
                $result = $api->getStats($table);
            } elseif ($action === 'search') {
                $query = $_GET['query'] ?? '';
                $fields = isset($_GET['fields']) ? explode(',', $_GET['fields']) : [];
                $result = $api->search($table, $query, $fields);
            } else {
                $filters = $_GET;
                unset($filters['query'], $filters['fields']);
                $result = $api->read($table, $id, $filters);
            }
            break;
            
        case 'POST':
            if ($action === 'batch') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $api->batchCreate($table, $input['records']);
            } elseif ($action === 'search') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $api->search($table, $input['query'], $input['fields'] ?? []);
            } else {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $api->create($table, $input);
            }
            break;
            
        case 'PUT':
            if ($action === 'batch') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $api->batchUpdate($table, $input['updates']);
            } else {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $api->update($table, $id, $input);
            }
            break;
            
        case 'DELETE':
            $result = $api->delete($table, $id);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>


