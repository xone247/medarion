<?php
// Get investigators endpoint
// Returns clinical trial investigators from the database

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
    $specialization = $_GET['specialization'] ?? null;
    $country = $_GET['country'] ?? null;
    $affiliation = $_GET['affiliation'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Check which schema we're using - try to detect if credentials column exists
    $checkColumn = $pdo->query("SHOW COLUMNS FROM investigators LIKE 'credentials'")->fetch();
    
    if ($checkColumn) {
        // Old schema: has credentials, research_interests, first_name, last_name
        $sql = "SELECT id, first_name, last_name, title, specialization, affiliation, 
                       email, phone, country, city, credentials, research_interests, 
                       publications_count, trials_count, created_at, updated_at 
                FROM investigators";
    } else {
        // New schema: has name, specialties (instead of specialization), therapeutic_areas (instead of research_interests)
        // Check if name column exists
        $checkNameColumn = $pdo->query("SHOW COLUMNS FROM investigators LIKE 'name'")->fetch();
        if ($checkNameColumn) {
            $sql = "SELECT id, name, title, specialties, affiliation, 
                           email, phone, country, city, therapeutic_areas as research_interests, 
                           trial_count as trials_count, created_at, updated_at,
                           NULL as first_name, NULL as last_name, NULL as credentials, 
                           0 as publications_count
                    FROM investigators";
        } else {
            // Fallback: try first_name/last_name without credentials
            $sql = "SELECT id, first_name, last_name, title, specialization, affiliation, 
                           email, phone, country, city, NULL as credentials, NULL as research_interests, 
                           0 as publications_count, 0 as trials_count, created_at, updated_at 
                    FROM investigators";
        }
    }
    
    $params = [];
    $whereConditions = [];
    
    if ($specialization) {
        $whereConditions[] = "specialization LIKE :specialization";
        $params[':specialization'] = "%$specialization%";
    }
    
    if ($country) {
        $whereConditions[] = "country = :country";
        $params[':country'] = $country;
    }
    
    if ($affiliation) {
        $whereConditions[] = "affiliation LIKE :affiliation";
        $params[':affiliation'] = "%$affiliation%";
    }
    
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " ORDER BY last_name ASC, first_name ASC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $investigators = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM investigators";
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
        'data' => $investigators,
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

