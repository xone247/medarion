<?php
// Seed demo sponsored ads
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
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $ads = [
        ['Medarion Pro', 'Upgrade for deeper data and AI', 'https://picsum.photos/seed/ad-pro/800/400', 'https://medarion.com/pricing', 'blog_grid', 10],
        ['Clinical Trials Map', 'Explore live trials and investigators', 'https://picsum.photos/seed/ad-trials/800/400', 'https://medarion.com/clinical-trials', 'blog_sidebar', 9],
        ['Investor CRM', 'Track conversations with warm intros', 'https://picsum.photos/seed/ad-crm/800/400', 'https://medarion.com/crm', 'blog_inline', 8]
    ];

    $created = 0; $updated = 0;
    foreach ($ads as $a) {
        [$title, $desc, $img, $link, $pos, $prio] = $a;
        $sel = $pdo->prepare("SELECT id FROM sponsored_ads WHERE title = :title AND position = :position");
        $sel->bindValue(':title', $title);
        $sel->bindValue(':position', $pos);
        $sel->execute();
        $row = $sel->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $upd = $pdo->prepare("UPDATE sponsored_ads SET description=:d, image_url=:i, link_url=:l, priority=:p, is_active=1, updated_at=NOW() WHERE id=:id");
            $upd->bindValue(':d', $desc);
            $upd->bindValue(':i', $img);
            $upd->bindValue(':l', $link);
            $upd->bindValue(':p', $prio, PDO::PARAM_INT);
            $upd->bindValue(':id', (int)$row['id'], PDO::PARAM_INT);
            $upd->execute();
            $updated++;
        } else {
            $ins = $pdo->prepare("INSERT INTO sponsored_ads (title, description, image_url, link_url, position, priority) VALUES (:t,:d,:i,:l,:pos,:p)");
            $ins->bindValue(':t', $title);
            $ins->bindValue(':d', $desc);
            $ins->bindValue(':i', $img);
            $ins->bindValue(':l', $link);
            $ins->bindValue(':pos', $pos);
            $ins->bindValue(':p', $prio, PDO::PARAM_INT);
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




