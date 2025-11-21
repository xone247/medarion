<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $config = require __DIR__ . '/../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );

    // Create events table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS ad_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ad_id INT NOT NULL,
        event_type ENUM('view','click') NOT NULL,
        placement VARCHAR(64) DEFAULT NULL,
        category VARCHAR(64) DEFAULT NULL,
        user_agent TEXT NULL,
        ip_address VARCHAR(64) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (ad_id), INDEX (event_type), INDEX (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['ad_id']) || !isset($input['event_type'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing ad_id or event_type']);
        exit;
    }

    $adId = (int)$input['ad_id'];
    $eventType = $input['event_type'] === 'click' ? 'click' : 'view';
    $placement = isset($input['placement']) ? substr($input['placement'], 0, 64) : null;
    $category = isset($input['category']) ? substr($input['category'], 0, 64) : null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';

    $stmt = $pdo->prepare("INSERT INTO ad_events (ad_id, event_type, placement, category, user_agent, ip_address) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$adId, $eventType, $placement, $category, $userAgent, $ip]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>


