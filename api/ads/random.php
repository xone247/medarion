<?php
// Random Ad API endpoint
// Serves random ads based on placement and user tier

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
    $config = require __DIR__ . '/../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    $placement = $_GET['placement'] ?? 'sidebar';
    $tier = $_GET['tier'] ?? 'free';
    
    // Get random ad for the specified placement and tier
    $stmt = $pdo->prepare("
        SELECT * FROM advertisements 
        WHERE is_active = 1 
        AND (target_tier = ? OR target_tier = 'all')
        AND JSON_CONTAINS(placements, ?)
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
        ORDER BY RAND() 
        LIMIT 1
    ");
    
    $stmt->execute([
        $tier,
        json_encode($placement)
    ]);
    
    $ad = $stmt->fetch();
    
    if ($ad) {
        echo json_encode([
            'success' => true,
            'ad' => $ad
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No ads available'
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>




















