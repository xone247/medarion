<?php
// Get clinical centers endpoint
// Returns clinical trial centers from the database

// Start output buffering to prevent premature output
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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
    
    // Ensure charset is set properly (fix for "Unknown character set" error)
    $charset = $config['charset'] ?? 'utf8mb4';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']}";
    try {
        $dsn .= ";charset={$charset}";
    } catch (Exception $e) {
        // Fallback without charset in DSN
    }
    
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    
    $options = $config['options'] ?? [];
    // Set charset via PDO options if charset param doesn't work
    $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES {$charset} COLLATE {$charset}_unicode_ci";
    
    $pdo = new PDO($dsn, $config['username'] ?? 'root', $config['password'] ?? '', $options);
    $pdo->exec("SET NAMES {$charset}");
    
    // Get query parameters
    $country = $_GET['country'] ?? null;
    $city = $_GET['city'] ?? null;
    $specialization = $_GET['specialization'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Build query - match actual database schema
    $sql = "SELECT id, name, type, address, city, country, contact_phone as phone, 
                   contact_email as email, website, specializations, certifications, 
                   active_trials_count, total_trials_completed, contact_name, 
                   created_at, updated_at 
            FROM clinical_centers";
    
    $params = [];
    $whereConditions = [];
    
    if ($country) {
        $whereConditions[] = "country = :country";
        $params[':country'] = $country;
    }
    
    if ($city) {
        $whereConditions[] = "city LIKE :city";
        $params[':city'] = "%$city%";
    }
    
    if ($specialization) {
        $whereConditions[] = "specializations LIKE :specialization";
        $params[':specialization'] = "%$specialization%";
    }
    
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " ORDER BY country ASC, city ASC, name ASC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $centers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Ensure centers is always an array (prevent array access warnings)
    if (!is_array($centers)) {
        $centers = [];
    }
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM clinical_centers";
    if (!empty($whereConditions)) {
        $countSql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();
    
    // Ensure total is a number
    if (!is_numeric($total)) {
        $total = 0;
    }
    
    // Clear any output before JSON
    ob_clean();
    
    echo json_encode([
        'success' => true,
        'data' => $centers,
        'pagination' => [
            'total' => (int)$total,
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + $limit) < $total
        ]
    ]);
    
} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
ob_end_flush();
?>

