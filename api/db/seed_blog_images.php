<?php
// Seed featured images for blog posts that are missing images
// Usage:
// - Run once in browser: /api/db/seed_blog_images.php
// - Optional: add ?force=1 to overwrite existing featured_image values

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) { $dsn .= ";port={$config['port']}"; }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);

    $force = isset($_GET['force']) && ($_GET['force'] === '1' || strtolower($_GET['force']) === 'true');

    // Category -> image mapping (stable Unsplash images)
    $CATEGORY_IMAGES = [
        'Telemedicine' => 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=1200&auto=format&fit=crop',
        'Pharma Supply Chain' => 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
        'AI Diagnostics' => 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop',
        'Health Insurance' => 'https://images.unsplash.com/photo-1605901309584-818e25960a8b?q=80&w=1200&auto=format&fit=crop',
        'Biotechnology' => 'https://images.unsplash.com/photo-1582719478250-04b4d3f2f6fd?q=80&w=1200&auto=format&fit=crop',
        'Medical Devices' => 'https://images.unsplash.com/photo-1582719478185-2f57b7c0a2ae?q=80&w=1200&auto=format&fit=crop',
        'Health Tech' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
        'Digital Health' => 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=1200&auto=format&fit=crop',
        'General' => 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop',
    ];

    // Fetch posts
    $stmt = $pdo->query("SELECT id, slug, category, featured_image FROM blog_posts ORDER BY created_at DESC");
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $updated = 0;
    $skipped = 0;
    $rows = [];

    $updateStmt = $pdo->prepare("UPDATE blog_posts SET featured_image = :img, updated_at = NOW() WHERE id = :id");

    foreach ($posts as $post) {
        $id = (int)$post['id'];
        $slug = (string)($post['slug'] ?? '');
        $category = (string)($post['category'] ?? 'General');
        $current = (string)($post['featured_image'] ?? '');

        if (!$force && $current !== '' && strlen(trim($current)) > 0) {
            $skipped++;
            $rows[] = ['id' => $id, 'action' => 'skipped', 'current' => $current];
            continue;
        }

        $catImg = $CATEGORY_IMAGES[$category] ?? '';
        $fallback = 'https://picsum.photos/seed/medarion-' . rawurlencode($slug !== '' ? $slug : (string)$id) . '/1200/800';
        $imageUrl = $catImg !== '' ? $catImg : $fallback;

        $updateStmt->execute([':img' => $imageUrl, ':id' => $id]);
        $updated++;
        $rows[] = ['id' => $id, 'action' => ($current ? 'overwritten' : 'updated'), 'image' => $imageUrl];
    }

    echo json_encode([
        'success' => true,
        'summary' => [
            'total' => count($posts),
            'updated' => $updated,
            'skipped' => $skipped,
            'force' => $force
        ],
        'rows' => $rows
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>

