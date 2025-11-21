<?php
header('Content-Type: application/json');
try {
    $config = require __DIR__ . '/../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $id = (int)($data['id'] ?? 0);
    $name = trim($data['name'] ?? '');
    $slug = trim($data['slug'] ?? '');
    if ($id <= 0 || $name === '' || $slug === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'id, name and slug are required']);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE blog_categories SET name=:name, slug=:slug, updated_at=NOW() WHERE id=:id");
    $stmt->bindValue(':name', $name);
    $stmt->bindValue(':slug', $slug);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>




