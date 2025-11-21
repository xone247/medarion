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

    // Ensure categories table
    $pdo->exec("CREATE TABLE IF NOT EXISTS blog_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(120) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Ensure blog_posts has category and category_id columns (for older seeds)
    try {
        $colCat = $pdo->query("SHOW COLUMNS FROM blog_posts LIKE 'category'");
        $hasCat = $colCat && $colCat->fetch(PDO::FETCH_ASSOC);
        if (!$hasCat) {
            $pdo->exec("ALTER TABLE blog_posts ADD COLUMN category VARCHAR(50) NULL AFTER featured_image");
        }
    } catch (Exception $e) { /* ignore */ }

    // Ensure blog_posts has category_id column
    $colStmt = $pdo->query("SHOW COLUMNS FROM blog_posts LIKE 'category_id'");
    $hasCategoryId = $colStmt && $colStmt->fetch(PDO::FETCH_ASSOC);
    if (!$hasCategoryId) {
        $pdo->exec("ALTER TABLE blog_posts ADD COLUMN category_id INT NULL AFTER category");
        $pdo->exec("ALTER TABLE blog_posts ADD INDEX (category_id)");
        $pdo->exec("ALTER TABLE blog_posts ADD CONSTRAINT fk_blog_category FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL");
    }

    // Migrate distinct text categories into blog_categories and map ids
    $cats = $pdo->query("SELECT DISTINCT category FROM blog_posts WHERE category IS NOT NULL AND category <> ''")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($cats as $name) {
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
        $ins = $pdo->prepare("INSERT IGNORE INTO blog_categories (name, slug) VALUES (:n, :s)");
        $ins->bindValue(':n', $name);
        $ins->bindValue(':s', $slug);
        $ins->execute();

        // Update posts with this category to set category_id
        $sel = $pdo->prepare("SELECT id FROM blog_categories WHERE name = :n LIMIT 1");
        $sel->bindValue(':n', $name);
        $sel->execute();
        $cid = $sel->fetch(PDO::FETCH_ASSOC)['id'] ?? null;
        if ($cid) {
            $upd = $pdo->prepare("UPDATE blog_posts SET category_id = :cid WHERE category = :n");
            $upd->bindValue(':cid', (int)$cid, PDO::PARAM_INT);
            $upd->bindValue(':n', $name);
            $upd->execute();
        }
    }

    echo json_encode(['success' => true, 'migrated' => count($cats)]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>


