<?php
// Seed demo blog posts (idempotent based on slug)
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
    $pdo->exec("CREATE TABLE IF NOT EXISTS blog_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content MEDIUMTEXT NULL,
        excerpt TEXT NULL,
        featured_image VARCHAR(255) NULL,
        category VARCHAR(50) NULL,
        status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
        author_id INT NULL,
        published_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (status),
        INDEX (published_at),
        CONSTRAINT fk_blog_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Choose any demo author (fallback to null)
    $authorId = null;
    $authorStmt = $pdo->query("SELECT id FROM users ORDER BY id LIMIT 1");
    if ($row = $authorStmt->fetch(PDO::FETCH_ASSOC)) {
        $authorId = (int)$row['id'];
    }

    $now = date('Y-m-d H:i:s');
    $channels = [
        'Telemedicine', 'AI Diagnostics', 'Clinical Trials', 'Medical Devices', 'Grants',
        'Regulatory', 'Clinical Centers', 'Investors & Finance', 'Nation Pulse', 'Health Tech'
    ];
    $posts = [];
    foreach ($channels as $channel) {
        // Ensure category exists and fetch id
        $slugCat = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $channel));
        $pdo->exec("CREATE TABLE IF NOT EXISTS blog_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            slug VARCHAR(120) NOT NULL UNIQUE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        $ins = $pdo->prepare("INSERT IGNORE INTO blog_categories (name, slug) VALUES (:n, :s)");
        $ins->bindValue(':n', $channel);
        $ins->bindValue(':s', $slugCat);
        $ins->execute();
        $selC = $pdo->prepare("SELECT id FROM blog_categories WHERE slug = :s LIMIT 1");
        $selC->bindValue(':s', $slugCat);
        $selC->execute();
        $cid = (int)($selC->fetch(PDO::FETCH_ASSOC)['id'] ?? 0);

        for ($i = 1; $i <= 6; $i++) {
            $base = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $channel));
            $slug = $base . '-insights-' . $i;
            $title = $channel . ' Insights #' . $i;
            $excerpt = 'Latest insights and analysis in ' . $channel . ' (issue ' . $i . ').';
            $img = 'https://picsum.photos/seed/medarion-' . rawurlencode($base . '-' . $i) . '/1200/800';
            // Rich HTML content with image and paragraphs
            $content = '<p>This is a demo article for ' . htmlspecialchars($channel) . ' covering trends, data, and context.</p>'
                . '<p>We explore recent developments, key players, and market signals across regions. This includes grants, investments, regulatory updates, and emerging clinical evidence.</p>'
                . '<figure style="margin: 16px 0;">'
                . '<img src="' . $img . '" alt="' . htmlspecialchars($title, ENT_QUOTES) . '" style="width:100%;height:auto;border-radius:8px;" />'
                . '<figcaption style="font-size:12px;color:#666;margin-top:6px;">Illustration: ' . htmlspecialchars($title, ENT_QUOTES) . '</figcaption>'
                . '</figure>'
                . '<p>Looking ahead, we anticipate further momentum in ' . htmlspecialchars($channel) . ' as operators scale and partnerships deepen. Subscribe to our newsletter for weekly insights.</p>';
            $posts[] = [
                'title' => $title,
                'slug' => $slug,
                'excerpt' => $excerpt,
                'content' => $content,
                'featured_image' => $img,
                'category' => $channel,
                'category_id' => $cid ?: null,
                'status' => 'published',
                'published_at' => $now
            ];
        }
    }

    $created = 0; $updated = 0;
    foreach ($posts as $p) {
        // Upsert by slug
        $stmt = $pdo->prepare("SELECT id FROM blog_posts WHERE slug = :slug");
        $stmt->bindValue(':slug', $p['slug']);
        $stmt->execute();
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($existing) {
            $upd = $pdo->prepare("UPDATE blog_posts SET title=:title, content=:content, excerpt=:excerpt, featured_image=:featured_image, category=:category, category_id=:category_id, status=:status, author_id=:author_id, published_at=:published_at, updated_at=NOW() WHERE id=:id");
            $upd->bindValue(':title', $p['title']);
            $upd->bindValue(':content', $p['content']);
            $upd->bindValue(':excerpt', $p['excerpt']);
            $upd->bindValue(':featured_image', $p['featured_image']);
            $upd->bindValue(':category', $p['category']);
            if (!empty($p['category_id'])) { $upd->bindValue(':category_id', (int)$p['category_id'], PDO::PARAM_INT); } else { $upd->bindValue(':category_id', null, PDO::PARAM_NULL); }
            $upd->bindValue(':status', $p['status']);
            if ($authorId) { $upd->bindValue(':author_id', $authorId, PDO::PARAM_INT); } else { $upd->bindValue(':author_id', null, PDO::PARAM_NULL); }
            $upd->bindValue(':published_at', $p['published_at']);
            $upd->bindValue(':id', (int)$existing['id'], PDO::PARAM_INT);
            $upd->execute();
            $updated++;
        } else {
            $ins = $pdo->prepare("INSERT INTO blog_posts (title, slug, content, excerpt, featured_image, category, category_id, status, author_id, published_at)
                                   VALUES (:title, :slug, :content, :excerpt, :featured_image, :category, :category_id, :status, :author_id, :published_at)");
            $ins->bindValue(':title', $p['title']);
            $ins->bindValue(':slug', $p['slug']);
            $ins->bindValue(':content', $p['content']);
            $ins->bindValue(':excerpt', $p['excerpt']);
            $ins->bindValue(':featured_image', $p['featured_image']);
            $ins->bindValue(':category', $p['category']);
            if (!empty($p['category_id'])) { $ins->bindValue(':category_id', (int)$p['category_id'], PDO::PARAM_INT); } else { $ins->bindValue(':category_id', null, PDO::PARAM_NULL); }
            $ins->bindValue(':status', $p['status']);
            if ($authorId) { $ins->bindValue(':author_id', $authorId, PDO::PARAM_INT); } else { $ins->bindValue(':author_id', null, PDO::PARAM_NULL); }
            $ins->bindValue(':published_at', $p['published_at']);
            $ins->execute();
            $created++;
        }
    }

    echo json_encode(['success' => true, 'created' => $created, 'updated' => $updated]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>


