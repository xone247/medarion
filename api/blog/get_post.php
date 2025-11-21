<?php
// Get single blog post endpoint
// Returns a single blog post by ID or slug

try {
    $config = require __DIR__ . '/../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );
    
    // Get query parameters
    $id = $_GET['id'] ?? null;
    $slug = $_GET['slug'] ?? null;
    
    if (!$id && !$slug) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Either id or slug parameter is required'
        ]);
        exit;
    }
    
    // Build query with JOINs to get author and category information
    $sql = "SELECT bp.id, bp.title, bp.slug, bp.content, bp.excerpt, 
                   bp.featured_image, bp.status, bp.published_at, bp.category, bp.category_id,
                   bp.created_at, bp.updated_at,
                   u.first_name, u.last_name, u.username as author_username,
                   u.profile_image as author_image,
                   bc.id AS category_id_join, bc.name AS category_name, bc.slug AS category_slug
            FROM blog_posts bp
            LEFT JOIN users u ON bp.author_id = u.id
            LEFT JOIN blog_categories bc ON bp.category_id = bc.id
            WHERE bp.status = 'published'";
    
    $params = [];
    
    if ($id) {
        $sql .= " AND bp.id = :id";
        $params[':id'] = $id;
    } elseif ($slug) {
        $sql .= " AND bp.slug = :slug";
        $params[':slug'] = $slug;
    }
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();
    $post = $stmt->fetch();
    
    if (!$post) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Blog post not found'
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'post' => $post
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
