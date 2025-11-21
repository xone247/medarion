<?php
// Ad Impression Tracking API
// Tracks ad impressions for analytics

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $config = require __DIR__ . '/../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['ad_id']) || !isset($input['placement'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit;
    }
    
    // Get campaign ID for the ad
    $stmt = $pdo->prepare("SELECT campaign_id FROM advertisements WHERE id = ?");
    $stmt->execute([$input['ad_id']]);
    $ad = $stmt->fetch();
    $campaignId = $ad['campaign_id'] ?? null;
    
    // Record impression
    $stmt = $pdo->prepare("
        INSERT INTO ad_impressions (ad_id, campaign_id, user_id, placement, page_url, ip_address, user_agent, clicked) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    ");
    
    $stmt->execute([
        $input['ad_id'],
        $campaignId,
        $input['user_id'] ?? null,
        $input['placement'],
        $input['page_url'] ?? null,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);
    
    // Update ad impression count
    $stmt = $pdo->prepare("UPDATE advertisements SET impressions_count = impressions_count + 1 WHERE id = ?");
    $stmt->execute([$input['ad_id']]);
    
    echo json_encode(['success' => true, 'message' => 'Impression recorded']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>




















