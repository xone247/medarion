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
    $pdo->exec("CREATE TABLE IF NOT EXISTS blog_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(120) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $name = trim($data['name'] ?? '');
    $slug = trim($data['slug'] ?? '');
    if ($name === '' || $slug === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'name and slug are required']);
        exit;
    }
    $stmt = $pdo->prepare("INSERT INTO blog_categories (name, slug) VALUES (:name, :slug)");
    $stmt->bindValue(':name', $name);
    $stmt->bindValue(':slug', $slug);
    $stmt->execute();
    echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>




