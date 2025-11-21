<?php
// Create blog post endpoint
// Accepts JSON body and inserts a new blog post

header('Content-Type: application/json');

function require_admin_or_blog_manager(PDO $pdo): array {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!preg_match('/Bearer\s+(\S+)/', $auth, $m)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Missing token']);
        exit;
    }
    $token = $m[1];
    $stmt = $pdo->prepare("SELECT u.id, u.email, u.role FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.session_token = :t LIMIT 1");
    $stmt->bindValue(':t', $token);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }
    // Ensure user_roles exists and check blog_manager
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_roles (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, role VARCHAR(50) NOT NULL, UNIQUE KEY uk_user_role(user_id, role)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    $hasBlogMgr = false;
    try {
        $rs = $pdo->prepare("SELECT 1 FROM user_roles WHERE user_id = :uid AND role = 'blog_manager' LIMIT 1");
        $rs->bindValue(':uid', (int)$user['id'], PDO::PARAM_INT);
        $rs->execute();
        $hasBlogMgr = (bool)$rs->fetch();
    } catch (Exception $e) { $hasBlogMgr = false; }
    if ($user['role'] !== 'admin' && !$hasBlogMgr) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit;
    }
    return $user;
}

try {
    $config = require_once __DIR__ . '/../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );

    // Ensure table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS blog_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content MEDIUMTEXT NULL,
        excerpt TEXT NULL,
        featured_image VARCHAR(255) NULL,
        category VARCHAR(50) NULL,
        category_id INT NULL,
        status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
        author_id INT NULL,
        published_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (status),
        INDEX (published_at),
        INDEX (category_id),
        CONSTRAINT fk_blog_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Ensure categories table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS blog_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(120) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // auth
    require_admin_or_blog_manager($pdo);

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) { $data = []; }

    $title = trim($data['title'] ?? '');
    $slug = trim($data['slug'] ?? '');
    $content = $data['content'] ?? '';
    $excerpt = $data['excerpt'] ?? '';
    $featured_image = $data['featured_image'] ?? '';
    $status = $data['status'] ?? 'draft';
    $author_id = $data['author_id'] ?? null;
    $published_at = $data['published_at'] ?? null;
    $category = trim($data['category'] ?? '');
    $category_id = isset($data['category_id']) ? (int)$data['category_id'] : null;

    if ($title === '' || $slug === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'title and slug are required']);
        exit;
    }

    // Resolve category_id if category provided
    if (!$category_id && $category !== '') {
        $slugCat = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $category));
        $ins = $pdo->prepare("INSERT IGNORE INTO blog_categories (name, slug) VALUES (:n, :s)");
        $ins->bindValue(':n', $category);
        $ins->bindValue(':s', $slugCat);
        $ins->execute();
        $sel = $pdo->prepare("SELECT id FROM blog_categories WHERE slug = :s LIMIT 1");
        $sel->bindValue(':s', $slugCat);
        $sel->execute();
        $row = $sel->fetch(PDO::FETCH_ASSOC);
        if ($row) $category_id = (int)$row['id'];
    }

    $stmt = $pdo->prepare("INSERT INTO blog_posts (title, slug, content, excerpt, featured_image, category, category_id, status, author_id, published_at)
                           VALUES (:title, :slug, :content, :excerpt, :featured_image, :category, :category_id, :status, :author_id, :published_at)");
    $stmt->bindValue(':title', $title);
    $stmt->bindValue(':slug', $slug);
    $stmt->bindValue(':content', $content);
    $stmt->bindValue(':excerpt', $excerpt);
    $stmt->bindValue(':featured_image', $featured_image);
    $stmt->bindValue(':category', $category !== '' ? $category : null, $category !== '' ? PDO::PARAM_STR : PDO::PARAM_NULL);
    if ($category_id) { $stmt->bindValue(':category_id', $category_id, PDO::PARAM_INT); } else { $stmt->bindValue(':category_id', null, PDO::PARAM_NULL); }
    $stmt->bindValue(':status', $status);
    if ($author_id) { $stmt->bindValue(':author_id', (int)$author_id, PDO::PARAM_INT); } else { $stmt->bindValue(':author_id', null, PDO::PARAM_NULL); }
    if ($published_at) { $stmt->bindValue(':published_at', $published_at); } else { $stmt->bindValue(':published_at', null, PDO::PARAM_NULL); }
    $stmt->execute();

    $id = (int)$pdo->lastInsertId();
    echo json_encode(['success' => true, 'data' => ['id' => $id]]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>


