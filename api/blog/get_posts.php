<?php
// Get blog posts endpoint
// Returns a list of blog posts from the database

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
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );
    
    // Get query parameters
    $status = $_GET['status'] ?? 'published';
    $author_id = $_GET['author_id'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    $search = $_GET['search'] ?? null;
    
    // Build query with JOINs to get author and category information
    $sql = "SELECT bp.id, bp.title, bp.slug, bp.content, bp.excerpt, 
                   bp.featured_image, bp.status, bp.published_at, bp.category, bp.category_id,
                   bp.created_at, bp.updated_at,
                   u.first_name, u.last_name, u.username as author_username,
                   bc.name AS category_name, bc.slug AS category_slug
            FROM blog_posts bp
            LEFT JOIN users u ON bp.author_id = u.id
            LEFT JOIN blog_categories bc ON bp.category_id = bc.id";
    
    $params = [];
    $whereConditions = [];
    
    if ($status) {
        $whereConditions[] = "bp.status = :status";
        $params[':status'] = $status;
    }
    
    if ($author_id) {
        $whereConditions[] = "bp.author_id = :author_id";
        $params[':author_id'] = $author_id;
    }
    
    if ($search) {
        $whereConditions[] = "(bp.title LIKE :search OR bp.content LIKE :search OR bp.excerpt LIKE :search)";
        $params[':search'] = "%$search%";
    }
    
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " ORDER BY bp.published_at DESC, bp.created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $posts = $stmt->fetchAll();
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM blog_posts bp";
    if (!empty($whereConditions)) {
        $countSql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'posts' => $posts,
        'pagination' => [
            'total' => (int)$total,
            'limit' => (int)$limit,
            'offset' => (int)$offset,
            'has_more' => ($offset + $limit) < $total
        ]
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
