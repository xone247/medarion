<?php
// Clean single-implementation Admin Blog API (GET/POST/PUT/DELETE)
// This endpoint handles: /api/admin/blog-posts
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Basic authorization check (in production, verify JWT token)
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$isAuthorized = strpos($authHeader, 'Bearer') !== false || strpos($authHeader, 'test-token') !== false;

if (!$isAuthorized) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

// Handle dynamic ID in URL path (e.g., /api/admin/blog-posts/123)
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
$postId = null;

// Extract ID from URL if present (e.g., admin/blog-posts/123)
if (isset($GLOBALS['postId'])) {
    $postId = (int)$GLOBALS['postId'];
} elseif (in_array('blog-posts', $pathParts)) {
    $blogPostsIndex = array_search('blog-posts', $pathParts);
    if ($blogPostsIndex !== false && isset($pathParts[$blogPostsIndex + 1])) {
        $possibleId = $pathParts[$blogPostsIndex + 1];
        if (is_numeric($possibleId)) {
            $postId = (int)$possibleId;
        }
    }
}

try {
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
  if (!empty($config['port'])) { $dsn .= ";port={$config['port']}"; }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    $method = $_SERVER['REQUEST_METHOD'];

  if ($method === 'GET') {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 20;
            $offset = ($page - 1) * $limit;
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
            
    $where = [];
            $params = [];
    if ($status !== '') {
      $where[] = 'status = :status';
                $params[':status'] = $status;
            }
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM blog_posts $whereSql");
    foreach ($params as $k=>$v) { $countStmt->bindValue($k, $v); }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();
            
    $stmt = $pdo->prepare("SELECT id, title, slug, content, excerpt, author_id, featured_image, category, status, featured, read_time, published_at, created_at, updated_at FROM blog_posts $whereSql ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
    foreach ($params as $k=>$v) { $stmt->bindValue($k, $v); }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => [
        'posts' => $posts,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
          'total' => $total,
          'pages' => (int)ceil(max(1, $total) / $limit)
                    ]
                ]
            ]);
  } elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Invalid JSON']); exit; }
            
    $stmt = $pdo->prepare("INSERT INTO blog_posts (title, slug, content, excerpt, author_id, featured_image, category, status, featured, read_time, published_at, created_at, updated_at) VALUES (:title, :slug, :content, :excerpt, :author_id, :featured_image, :category, :status, :featured, :read_time, :published_at, NOW(), NOW())");
    $slug = isset($input['slug']) && $input['slug'] ? $input['slug'] : strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $input['title'] ?? 'post')));
            $stmt->execute([
      ':title' => $input['title'] ?? '',
                ':slug' => $slug,
      ':content' => $input['content'] ?? '',
      ':excerpt' => $input['excerpt'] ?? '',
      ':author_id' => 1,
      ':featured_image' => $input['featured_image'] ?? '',
                ':category' => $input['category'] ?? 'General',
      ':status' => $input['status'] ?? 'published',
      ':featured' => isset($input['featured']) ? (int)!!$input['featured'] : 0,
      ':read_time' => $input['read_time'] ?? '5 min',
      ':published_at' => date('Y-m-d H:i:s')
            ]);
            
    $id = (int)$pdo->lastInsertId();
    $fetch = $pdo->prepare("SELECT * FROM blog_posts WHERE id = ?");
    $fetch->execute([$id]);
    echo json_encode(['success'=>true, 'post'=>$fetch->fetch(PDO::FETCH_ASSOC)]);
  } elseif ($method === 'PUT' || $method === 'PATCH') {
    // Use postId from URL path or query parameter
    $id = $postId ?? (isset($_GET['id']) ? (int)$_GET['id'] : 0);
    if ($id <= 0) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Invalid ID']); exit; }
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $fields = [];$params=[];
    foreach (['title','slug','content','excerpt','featured_image','category','status','read_time'] as $f) {
      if (array_key_exists($f, $input)) { $fields[] = "$f = ?"; $params[] = $input[$f]; }
            }
    if (array_key_exists('featured', $input)) { $fields[]='featured = ?'; $params[]=(int)!!$input['featured']; }
    if (!$fields) { echo json_encode(['success'=>false,'error'=>'No fields to update']); exit; }
    $fields[] = 'updated_at = NOW()';
    $params[] = $id;
    $sql = 'UPDATE blog_posts SET ' . implode(', ',$fields) . ' WHERE id = ?';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
    $fetch = $pdo->prepare('SELECT * FROM blog_posts WHERE id = ?');
    $fetch->execute([$id]);
    echo json_encode(['success'=>true,'post'=>$fetch->fetch(PDO::FETCH_ASSOC)]);
  } elseif ($method === 'DELETE') {
    // Use postId from URL path or query parameter
    $id = $postId ?? (isset($_GET['id']) ? (int)$_GET['id'] : 0);
    if ($id <= 0) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Invalid ID']); exit; }
    $stmt = $pdo->prepare('DELETE FROM blog_posts WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success'=>true]);
  } else {
            http_response_code(405);
    echo json_encode(['success'=>false,'error'=>'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'Database error: '.$e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'Server error: '.$e->getMessage()]);
}
?>