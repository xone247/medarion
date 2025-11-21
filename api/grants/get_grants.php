<?php
// Get grants endpoint
// Returns a list of grants from the database

try {
    $configPath = __DIR__ . '/../../config/database.php';
    if (!file_exists($configPath)) {
        throw new Exception("Database config file not found: {$configPath}");
    }
    // Use require (not require_once) to ensure we get the array, not a cached boolean
    $config = require $configPath;
    if (!is_array($config)) {
        // If config was already included and returns true, re-include it
        if ($config === true) {
            unset($config);
            $config = include $configPath;
        }
        if (!is_array($config)) {
            throw new Exception("Database config is invalid");
        }
    }
    $charset = $config['charset'] ?? 'utf8mb4';
    // Build DSN without charset if it causes issues
    $dsn = "mysql:host={$config['host']};dbname={$config['database']}";
    // Only add charset if MySQL version supports it
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
    // Set charset after connection
    $pdo->exec("SET NAMES {$charset}");
    
    // Get query parameters
    $grant_type = $_GET['grant_type'] ?? null;
    $status = $_GET['status'] ?? null;
    $funding_agency = $_GET['funding_agency'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    
    // Build query
    $sql = "SELECT id, title, description, funding_agency, amount, grant_type, 
                   application_deadline, award_date, status, requirements, 
                   contact_email, website, created_at, updated_at 
            FROM grants";
    
    $params = [];
    $whereConditions = [];
    
    if ($grant_type) {
        $whereConditions[] = "grant_type = :grant_type";
        $params[':grant_type'] = $grant_type;
    }
    
    if ($status) {
        $whereConditions[] = "status = :status";
        $params[':status'] = $status;
    }
    
    if ($funding_agency) {
        $whereConditions[] = "funding_agency LIKE :funding_agency";
        $params[':funding_agency'] = "%$funding_agency%";
    }
    
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $grants = $stmt->fetchAll();
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM grants";
    if (!empty($whereConditions)) {
        $countSql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'data' => $grants,
        'pagination' => [
            'total' => (int)$total,
            'limit' => (int)$limit,
            'offset' => (int)$offset,
            'has_more' => ($offset + $limit) < $total
        ]
    ]);
    
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
