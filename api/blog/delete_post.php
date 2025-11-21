<?php
header('Content-Type: application/json');

function require_admin_or_blog_manager(PDO $pdo): void {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!preg_match('/Bearer\s+(\S+)/', $auth)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Missing token']);
        exit;
    }
    $token = preg_replace('/^Bearer\s+/', '', $auth);
    $stmt = $pdo->prepare("SELECT u.id, u.role FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = :t LIMIT 1");
    $stmt->bindValue(':t', $token);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || !in_array($user['role'], ['admin','blog_manager'], true)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit;
    }
}

try {
    $config = require __DIR__ . '/../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );

    require_admin_or_blog_manager($pdo);

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'id is required']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM blog_posts WHERE id = :id");
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>




