<?php
// Get public markets endpoint
// Returns public stock data from the database

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
    $config = require_once __DIR__ . '/../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}" . (!empty($config['port']) ? ";port={$config['port']}" : ''),
        $config['username'],
        $config['password'],
        $config['options']
    );
    
    // Get query parameters
    $exchange = $_GET['exchange'] ?? null;
    $sector = $_GET['sector'] ?? null;
    $country = $_GET['country'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Build query - Use SELECT * to avoid column mismatch errors
    $sql = "SELECT * FROM public_stocks";
    
    $params = [];
    $whereConditions = [];
    
    if ($exchange) {
        $whereConditions[] = "exchange = :exchange";
        $params[':exchange'] = $exchange;
    }
    
    // Note: sector column may not exist in all table versions
    // Only filter by sector if the column exists (handled via try-catch if needed)
    if ($sector) {
        // Check if sector column exists before filtering
        try {
            $checkStmt = $pdo->query("SHOW COLUMNS FROM public_stocks LIKE 'sector'");
            if ($checkStmt->rowCount() > 0) {
                $whereConditions[] = "sector = :sector";
                $params[':sector'] = $sector;
            }
        } catch (PDOException $e) {
            // Sector column doesn't exist, skip filter
        }
    }
    
    if ($country) {
        $whereConditions[] = "country = :country";
        $params[':country'] = $country;
    }
    
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " ORDER BY market_cap DESC, last_updated DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $stocks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM public_stocks";
    if (!empty($whereConditions)) {
        $countSql .= " WHERE " . implode(" AND ", $whereConditions);
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
    
    // Ensure stocks is an array
    if (!is_array($stocks)) {
        $stocks = [];
    }
    
    // Clear any output before JSON
    ob_clean();
    
    echo json_encode([
        'success' => true,
        'data' => $stocks,
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

