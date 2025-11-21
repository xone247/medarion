<?php
// Get regulatory approvals endpoint
// Returns regulatory approvals from company_regulatory table

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
    $status = $_GET['status'] ?? null;
    $body = $_GET['body'] ?? null;
    $company_id = $_GET['company_id'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Check which schema we're using - try to detect if regulatory_body_id exists
    $checkColumn = $pdo->query("SHOW COLUMNS FROM company_regulatory LIKE 'regulatory_body_id'")->fetch();
    
    if ($checkColumn) {
        // Old schema: has regulatory_body_id (INT) - use JOIN
        $sql = "SELECT cr.id, cr.company_id, cr.regulatory_body_id, cr.approval_type, 
                       cr.approval_date, cr.status, cr.validity_period, cr.notes, 
                       cr.data_source, cr.created_at, cr.updated_at,
                       c.name as company_name, c.sector, c.country,
                       rb.name as body_name, rb.country as body_country, rb.website as body_website
                FROM company_regulatory cr
                LEFT JOIN companies c ON cr.company_id = c.id
                LEFT JOIN regulatory_bodies rb ON cr.regulatory_body_id = rb.id";
    } else {
        // New schema: has regulatory_body (VARCHAR) - no JOIN needed
        $sql = "SELECT cr.id, cr.company_id, cr.regulatory_body as regulatory_body_name, 
                       cr.product as product_name, cr.approval_date, cr.status, 
                       cr.region, cr.notes, cr.created_at, cr.updated_at,
                       c.name as company_name, c.sector, c.country,
                       cr.regulatory_body as body_name, cr.region as body_country, NULL as body_website
                FROM company_regulatory cr
                LEFT JOIN companies c ON cr.company_id = c.id";
    }
    
    $params = [];
    $whereConditions = [];
    
    if ($status) {
        $whereConditions[] = "cr.status = :status";
        $params[':status'] = $status;
    }
    
    if ($body) {
        if ($checkColumn) {
            $whereConditions[] = "rb.name LIKE :body";
        } else {
            $whereConditions[] = "cr.regulatory_body LIKE :body";
        }
        $params[':body'] = "%$body%";
    }
    
    if ($company_id) {
        $whereConditions[] = "cr.company_id = :company_id";
        $params[':company_id'] = $company_id;
    }
    
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " ORDER BY cr.approval_date DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $regulatory = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count for pagination
    if ($checkColumn) {
        $countSql = "SELECT COUNT(*) FROM company_regulatory cr";
        if (!empty($whereConditions)) {
            $countSql .= " LEFT JOIN companies c ON cr.company_id = c.id";
            $countSql .= " LEFT JOIN regulatory_bodies rb ON cr.regulatory_body_id = rb.id";
            $countSql .= " WHERE " . implode(" AND ", $whereConditions);
        }
    } else {
        $countSql = "SELECT COUNT(*) FROM company_regulatory cr";
        if (!empty($whereConditions)) {
            $countSql .= " LEFT JOIN companies c ON cr.company_id = c.id";
            $countSql .= " WHERE " . implode(" AND ", $whereConditions);
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
        'data' => $regulatory,
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

