<?php
// Admin advertisements endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // Pagination and optional category filter
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;
        $category = isset($_GET['category']) ? trim($_GET['category']) : '';

        $where = '';
        $params = [];
        if ($category !== '') {
            $where = 'WHERE category = :category';
            $params[':category'] = $category;
        }

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM advertisements {$where}");
        foreach ($params as $k => $v) { $countStmt->bindValue($k, $v); }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT id, title, advertiser, image_url, cta_text, target_url, category, placements, is_active, priority, created_at, updated_at FROM advertisements {$where} ORDER BY priority DESC, created_at DESC LIMIT :limit OFFSET :offset");
        foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode placements JSON if needed
        $ads = array_map(function($ad) {
            $ad['placements'] = json_decode($ad['placements'] ?? '[]', true) ?: [];
            $ad['is_active'] = (bool)$ad['is_active'];
            $ad['priority'] = (int)$ad['priority'];
            return $ad;
        }, $rows);

        echo json_encode([
            'success' => true,
            'advertisements' => $ads,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int)ceil($total / $limit)
            ]
        ]);
    } elseif ($method === 'POST') {
        // Create new advertisement
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
            exit;
        }
        
        $sql = "INSERT INTO advertisements (title, advertiser, image_url, cta_text, target_url, category, placements, is_active, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        $stmt = $pdo->prepare($sql);
        $placements = $input['placements'] ?? [];
        if (!is_array($placements)) { $placements = [$placements]; }
        $stmt->execute([
            $input['title'] ?? '',
            $input['advertiser'] ?? 'Medarion',
            $input['image_url'] ?? '',
            $input['cta_text'] ?? 'Learn More',
            $input['target_url'] ?? '#',
            $input['category'] ?? 'dashboard_personalized',
            json_encode($placements),
            isset($input['is_active']) ? (int)!!$input['is_active'] : 1,
            isset($input['priority']) ? (int)$input['priority'] : 0
        ]);
        
        $id = (int)$pdo->lastInsertId();
        $fetch = $pdo->prepare("SELECT id, title, advertiser, image_url, cta_text, target_url, category, placements, is_active, priority, created_at, updated_at FROM advertisements WHERE id = ?");
        $fetch->execute([$id]);
        $ad = $fetch->fetch(PDO::FETCH_ASSOC);
        if ($ad) {
            $ad['placements'] = json_decode($ad['placements'] ?? '[]', true) ?: [];
            $ad['is_active'] = (bool)$ad['is_active'];
            $ad['priority'] = (int)$ad['priority'];
        }
        echo json_encode([
            'success' => true,
            'ad' => $ad
        ]);
    } elseif ($method === 'PUT') {
        // Update advertisement
        $input = json_decode(file_get_contents('php://input'), true);
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid ID']);
            exit;
        }

        // Build dynamic SQL
        $fields = [];
        $params = [];
        $map = [
            'title' => 'title',
            'advertiser' => 'advertiser',
            'image_url' => 'image_url',
            'cta_text' => 'cta_text',
            'target_url' => 'target_url',
            'category' => 'category',
            'is_active' => 'is_active',
            'priority' => 'priority'
        ];
        foreach ($map as $inKey => $col) {
            if (array_key_exists($inKey, $input)) {
                $fields[] = "$col = ?";
                if ($inKey === 'is_active') {
                    $params[] = (int)!!$input[$inKey];
                } elseif ($inKey === 'priority') {
                    $params[] = (int)$input[$inKey];
                } else {
                    $params[] = $input[$inKey];
                }
            }
        }
        if (array_key_exists('placements', $input)) {
            $fields[] = 'placements = ?';
            $placements = $input['placements'];
            if (!is_array($placements)) { $placements = [$placements]; }
            $params[] = json_encode($placements);
        }
        if (empty($fields)) {
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit;
        }
        $fields[] = 'updated_at = NOW()';
        $params[] = $id;
        $sql = 'UPDATE advertisements SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $fetch = $pdo->prepare("SELECT id, title, advertiser, image_url, cta_text, target_url, category, placements, is_active, priority, created_at, updated_at FROM advertisements WHERE id = ?");
        $fetch->execute([$id]);
        $ad = $fetch->fetch(PDO::FETCH_ASSOC);
        if ($ad) {
            $ad['placements'] = json_decode($ad['placements'] ?? '[]', true) ?: [];
            $ad['is_active'] = (bool)$ad['is_active'];
            $ad['priority'] = (int)$ad['priority'];
        }
        echo json_encode(['success' => true, 'ad' => $ad]);
    } elseif ($method === 'DELETE') {
        // Delete advertisement
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid ID']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM advertisements WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
