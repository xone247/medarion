<?php
// Get investors endpoint
// Returns a list of investors from the database

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
    $type = $_GET['type'] ?? null;
    $country = $_GET['country'] ?? null;
    $sector = $_GET['sector'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Build query - only select columns that exist in the table
    $sql = "SELECT id, name, logo, description, type, headquarters, 
                   assets_under_management, website, focus_sectors, investment_stages, 
                   portfolio_companies, total_investments, average_investment, countries, 
                   team_size, contact_email, social_media, recent_investments, 
                   investment_criteria, portfolio_exits, 
                   created_at, updated_at 
            FROM investors";
    
    $params = [];
    $whereConditions = [];
    
    if ($type) {
        $whereConditions[] = "type = :type";
        $params[':type'] = $type;
    }
    
    if ($country) {
        $whereConditions[] = "JSON_SEARCH(countries, 'one', :country) IS NOT NULL";
        $params[':country'] = $country;
    }
    
    if ($sector) {
        $whereConditions[] = "JSON_SEARCH(focus_sectors, 'one', :sector) IS NOT NULL";
        $params[':sector'] = $sector;
    }
    
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " ORDER BY assets_under_management DESC, created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $investors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Decode JSON fields
    foreach ($investors as &$investor) {
        if (isset($investor['focus_sectors'])) {
            $investor['focus_sectors'] = json_decode($investor['focus_sectors'], true) ?? [];
        }
        if (isset($investor['investment_stages'])) {
            $investor['investment_stages'] = json_decode($investor['investment_stages'], true) ?? [];
        }
        if (isset($investor['portfolio_companies'])) {
            $investor['portfolio_companies'] = json_decode($investor['portfolio_companies'], true) ?? [];
        }
        if (isset($investor['countries'])) {
            $investor['countries'] = json_decode($investor['countries'], true) ?? [];
        }
        if (isset($investor['social_media'])) {
            $investor['social_media'] = json_decode($investor['social_media'], true) ?? [];
        }
        if (isset($investor['recent_investments'])) {
            $investor['recent_investments'] = json_decode($investor['recent_investments'], true) ?? [];
        }
        if (isset($investor['investment_criteria'])) {
            $investor['investment_criteria'] = json_decode($investor['investment_criteria'], true) ?? [];
        }
        if (isset($investor['portfolio_exits'])) {
            $investor['portfolio_exits'] = json_decode($investor['portfolio_exits'], true) ?? [];
        }
    }
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM investors";
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
        'data' => $investors,
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

