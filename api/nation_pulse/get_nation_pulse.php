<?php
// Get nation pulse data endpoint
// Returns health and economic indicators from the database

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $config = require_once __DIR__ . '/../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}" . (!empty($config['port']) ? ";port={$config['port']}" : ''),
        $config['username'],
        $config['password'],
        $config['options']
    );
    
    // Get query parameters
    $country = $_GET['country'] ?? null;
    $data_type = $_GET['data_type'] ?? null;
    $year = isset($_GET['year']) ? (int)$_GET['year'] : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Build query - Check which schema exists by trying to get columns
    $checkColumns = $pdo->query("SHOW COLUMNS FROM nation_pulse_data LIKE 'data_type'");
    $hasDataType = $checkColumns->rowCount() > 0;
    
    // Use the correct column names based on table schema
    if ($hasDataType) {
        // Old schema: data_type, metric_name, metric_value, metric_unit
        $sql = "SELECT id, country, data_type, metric_name, metric_value, metric_unit, 
                       year, source, notes, created_at, updated_at 
                FROM nation_pulse_data";
    } else {
        // New schema: indicator_type, indicator_name, value, unit
        $sql = "SELECT id, country, indicator_type as data_type, indicator_name as metric_name, 
                       value as metric_value, unit as metric_unit,
                       year, source, NULL as notes, created_at, updated_at 
                FROM nation_pulse_data";
    }
    
    $params = [];
    $whereConditions = [];
    
    if ($country) {
        $whereConditions[] = "country = :country";
        $params[':country'] = $country;
    }
    
    if ($data_type) {
        $columnName = $hasDataType ? 'data_type' : 'indicator_type';
        $whereConditions[] = "$columnName = :data_type";
        $params[':data_type'] = $data_type;
    }
    
    if ($year) {
        $whereConditions[] = "year = :year";
        $params[':year'] = $year;
    }
    
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " ORDER BY country ASC, year DESC, metric_name ASC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group by country and data type for easier frontend consumption
    $grouped = [];
    foreach ($data as $row) {
        $key = $row['country'] . '_' . $row['data_type'];
        if (!isset($grouped[$key])) {
            $grouped[$key] = [
                'country' => $row['country'],
                'data_type' => $row['data_type'],
                'metrics' => []
            ];
        }
        $grouped[$key]['metrics'][] = [
            'name' => $row['metric_name'],
            'value' => $row['metric_value'],
            'unit' => $row['metric_unit'],
            'year' => $row['year'],
            'source' => $row['source']
        ];
    }
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM nation_pulse_data";
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
        'data' => array_values($grouped),
        'raw_data' => $data, // Also provide raw data for flexibility
        'pagination' => [
            'total' => (int)$total,
            'limit' => $limit,
            'offset' => $offset,
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

