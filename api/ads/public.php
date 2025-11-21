<?php
// Public Advertisements API endpoint
// Returns active advertisements for public display (no authentication required)

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Include database configuration
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    // Get query parameters
    $placement = $_GET['placement'] ?? '';
    $category = $_GET['category'] ?? '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    
    // Build query for active advertisements
    $whereConditions = ['is_active = 1'];
    $params = [];
    
    // Check date range
    $whereConditions[] = "(start_date IS NULL OR start_date <= NOW())";
    $whereConditions[] = "(end_date IS NULL OR end_date >= NOW())";
    
    if (!empty($placement)) {
        $whereConditions[] = "JSON_CONTAINS(placements, :placement)";
        $params[':placement'] = json_encode($placement);
    }
    
    if (!empty($category)) {
        $whereConditions[] = "category = :category";
        $params[':category'] = $category;
    }
    
    $whereClause = implode(' AND ', $whereConditions);
    
    // Get active advertisements
    $sql = "SELECT * FROM advertisements WHERE {$whereClause} ORDER BY priority DESC, RAND() LIMIT :limit";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format advertisements
    $formattedAds = array_map(function($ad) {
        return [
            'id' => (int)$ad['id'],
            'title' => $ad['title'],
            'advertiser' => $ad['advertiser'],
            'image_url' => $ad['image_url'],
            'cta_text' => $ad['cta_text'],
            'target_url' => $ad['target_url'],
            'category' => $ad['category'],
            'placements' => json_decode($ad['placements'] ?? '[]', true),
            'is_active' => (bool)$ad['is_active'],
            'priority' => (int)$ad['priority']
        ];
    }, $ads);
    
    echo json_encode([
        'success' => true,
        'ads' => $formattedAds
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>



