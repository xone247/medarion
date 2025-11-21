<?php
// Get sponsored ads
header('Content-Type: application/json');

try {
    $config = require __DIR__ . '/../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );

    // Ensure table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS sponsored_ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        image_url VARCHAR(255) NULL,
        link_url VARCHAR(255) NULL,
        position ENUM('blog_grid','blog_sidebar','blog_inline') NOT NULL DEFAULT 'blog_grid',
        priority INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (position), INDEX (is_active), INDEX (priority)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $position = $_GET['position'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

    $sql = "SELECT id, title, description, image_url, link_url, position, priority
            FROM sponsored_ads
            WHERE is_active = 1";
    $params = [];
    if ($position) { $sql .= " AND position = :position"; $params[':position'] = $position; }
    $sql .= " ORDER BY priority DESC, id DESC LIMIT :limit";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'ads' => $ads]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>




