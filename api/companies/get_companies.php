<?php
// Get companies endpoint
// Returns a list of companies from the database

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
    $industry = $_GET['industry'] ?? null;
    $stage = $_GET['stage'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    
    // Build query
    $sql = "SELECT id, name, description, website, industry, stage, founded_year, 
                   employees_count, headquarters, funding_stage, total_funding, 
                   logo_url, created_at, updated_at 
            FROM companies";
    
    $params = [];
    $whereConditions = [];
    
    if ($industry) {
        $whereConditions[] = "industry = :industry";
        $params[':industry'] = $industry;
    }
    
    if ($stage) {
        $whereConditions[] = "stage = :stage";
        $params[':stage'] = $stage;
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
    $companies = $stmt->fetchAll();
    
    // Get total count for pagination
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
    
    echo json_encode([
        'success' => true,
        'data' => $companies,
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
