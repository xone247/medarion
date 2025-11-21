<?php
// Admin Active Advertisements API endpoint
// Returns only active advertisements for display

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
    $config = require __DIR__ . '/../../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    // Get authorization header
    $authHeader = '';
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    $authHeader = $authHeader ?: $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authorization token required']);
        exit;
    }
    
    $token = $matches[1];
    
    // Verify token and get user (for development, accept any token)
    if ($token === 'test-token' || $token === 'fa94514ca42c48cfa41169149682e998255606aef74c35fb1936cafb06b5a778') {
        // Get admin user
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND is_active = 1");
        $stmt->execute(['superadmin@medarion.com']);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Admin user not found']);
            exit;
        }
    } else {
        // For any other token, try to find the user by token (if you have a token-based auth system)
        // For now, just accept any token for development
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND is_active = 1");
        $stmt->execute([1]); // Default to user ID 1 for development
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid token']);
            exit;
        }
    }
    
    // Get query parameters
    $placement = $_GET['placement'] ?? '';
    $category = $_GET['category'] ?? '';
    
    // Build query for active advertisements
    $whereConditions = ['is_active = 1'];
    $params = [];
    
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
    $sql = "SELECT * FROM advertisements WHERE {$whereClause} ORDER BY priority DESC, created_at DESC";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
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
            'priority' => (int)$ad['priority'],
            'click_count' => (int)($ad['click_count'] ?? 0),
            'impression_count' => (int)($ad['impression_count'] ?? 0),
            'start_date' => $ad['start_date'] ?? null,
            'end_date' => $ad['end_date'] ?? null,
            'created_at' => $ad['created_at'],
            'updated_at' => $ad['updated_at']
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