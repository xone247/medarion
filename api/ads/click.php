<?php
// Ad Click Tracking API
// Tracks ad clicks for analytics

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
    
    // Record click
    $stmt = $pdo->prepare("
        INSERT INTO ad_clicks (ad_id, campaign_id, user_id, placement, ip_address, user_agent) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $input['ad_id'],
        $campaignId,
        $input['user_id'] ?? null,
        $input['placement'],
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);
    
    // Update ad click count
    $stmt = $pdo->prepare("UPDATE advertisements SET clicks_count = clicks_count + 1 WHERE id = ?");
    $stmt->execute([$input['ad_id']]);
    
    // Update CTR
    $stmt = $pdo->prepare("
        UPDATE advertisements 
        SET ctr = ROUND((clicks_count / impressions_count) * 100, 2) 
        WHERE id = ? AND impressions_count > 0
    ");
    $stmt->execute([$input['ad_id']]);
    
    echo json_encode(['success' => true, 'message' => 'Click recorded']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>




















