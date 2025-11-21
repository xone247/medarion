<?php
// Admin Dashboard API endpoints
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $config = require __DIR__ . '/../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // Route to appropriate endpoint
    if (isset($pathParts[2]) && $pathParts[2] === 'admin') {
        $endpoint = $pathParts[3] ?? '';
        
        switch ($endpoint) {
            case 'overview':
                handleOverview($pdo);
                break;
            case 'users':
                handleUsers($pdo);
                break;
            case 'settings':
                handleSettings($pdo);
                break;
            case 'modules':
                handleModules($pdo);
                break;
            case 'blog':
                handleBlog($pdo);
                break;
            case 'ads':
                handleAds($pdo);
                break;
            default:
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Invalid API path']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

function handleOverview($pdo) {
    try {
        // Get dashboard metrics from database
        $metrics = [];
        $stmt = $pdo->query("SELECT metric_name, metric_value, metric_string FROM dashboard_metrics");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $metrics[$row['metric_name']] = $row['metric_value'] ?: $row['metric_string'];
        }
        
        // Get real user statistics
        $userStats = [];
        
        // Total users
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE is_active = 1");
        $userStats['totalUsers'] = (int)$stmt->fetchColumn();
        
        // Active users (logged in within last 30 days)
        $stmt = $pdo->query("SELECT COUNT(DISTINCT user_id) as active FROM user_sessions WHERE expires_at > NOW()");
        $userStats['activeUsers'] = (int)$stmt->fetchColumn();
        
        // New users this month
        $stmt = $pdo->query("SELECT COUNT(*) as new FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        $userStats['newUsersThisMonth'] = (int)$stmt->fetchColumn();
        
        // Revenue data
        $revenueStats = [];
        $stmt = $pdo->query("SELECT SUM(amount) as total FROM revenue_data WHERE payment_status = 'completed'");
        $revenueStats['totalRevenue'] = (float)$stmt->fetchColumn();
        
        $stmt = $pdo->query("SELECT SUM(amount) as monthly FROM revenue_data WHERE payment_status = 'completed' AND payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        $revenueStats['monthlyRevenue'] = (float)$stmt->fetchColumn();
        
        // Blog statistics
        $blogStats = [];
        $stmt = $pdo->query("SELECT COUNT(*) as posts FROM blog_posts WHERE status = 'published'");
        $blogStats['blogPosts'] = (int)$stmt->fetchColumn();
        
        // User roles distribution
        $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users WHERE is_active = 1 GROUP BY role");
        $userRoles = [];
        $totalUsers = $userStats['totalUsers'];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $percentage = $totalUsers > 0 ? round(($row['count'] / $totalUsers) * 100, 1) : 0;
            $userRoles[] = [
                'role' => ucfirst(str_replace('_', ' ', $row['role'])),
                'count' => (int)$row['count'],
                'percentage' => $percentage
            ];
        }
        
        // Revenue by tier
        $stmt = $pdo->query("SELECT tier, SUM(amount) as revenue, COUNT(DISTINCT user_id) as users FROM revenue_data WHERE payment_status = 'completed' GROUP BY tier");
        $revenueByTier = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $revenueByTier[] = [
                'tier' => ucfirst($row['tier']),
                'revenue' => (float)$row['revenue'],
                'users' => (int)$row['users']
            ];
        }
        
        // Recent activity
        $stmt = $pdo->query("SELECT activity_type, activity_description, created_at FROM user_activity ORDER BY created_at DESC LIMIT 10");
        $recentActivity = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $timeAgo = timeAgo($row['created_at']);
            $recentActivity[] = [
                'type' => $row['activity_type'],
                'message' => $row['activity_description'] ?: 'User activity',
                'time' => $timeAgo,
                'icon' => 'Activity'
            ];
        }
        
        // User growth data (last 6 months)
        $stmt = $pdo->query("
            SELECT 
                DATE_FORMAT(created_at, '%b') as month,
                COUNT(*) as users
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY created_at ASC
        ");
        $userGrowth = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $userGrowth[] = [
                'month' => $row['month'],
                'users' => (int)$row['users']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'metrics' => $metrics,
                'userStats' => $userStats,
                'revenueStats' => $revenueStats,
                'blogStats' => $blogStats,
                'userRoles' => $userRoles,
                'revenueByTier' => $revenueByTier,
                'recentActivity' => $recentActivity,
                'userGrowth' => $userGrowth
            ]
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleUsers($pdo) {
    try {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 20;
        $search = $_GET['search'] ?? '';
        $role = $_GET['role'] ?? '';
        
        $offset = ($page - 1) * $limit;
        
        $whereConditions = ['is_active = 1'];
        $params = [];
        
        if ($search) {
            $whereConditions[] = "(first_name LIKE :search OR last_name LIKE :search OR email LIKE :search OR company_name LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        if ($role) {
            $whereConditions[] = "role = :role";
            $params[':role'] = $role;
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        // Get users
        $sql = "SELECT id, username, email, first_name, last_name, role, account_tier, company_name, 
                       phone, country, city, is_verified, created_at, updated_at
                FROM users 
                WHERE $whereClause 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM users WHERE $whereClause";
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'users' => $users,
                'pagination' => [
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ]
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleSettings($pdo) {
    try {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            // Get all settings
            $stmt = $pdo->query("SELECT * FROM system_settings ORDER BY category, setting_key");
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $settings
            ]);
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Update settings
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['settings'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }
            
            $pdo->beginTransaction();
            
            foreach ($input['settings'] as $setting) {
                $stmt = $pdo->prepare("
                    INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) 
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    setting_value = VALUES(setting_value),
                    updated_at = CURRENT_TIMESTAMP
                ");
                $stmt->execute([
                    $setting['setting_key'],
                    $setting['setting_value'],
                    $setting['setting_type'] ?? 'string',
                    $setting['description'] ?? '',
                    $setting['category'] ?? 'general',
                    $setting['is_public'] ?? false
                ]);
            }
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Settings updated successfully'
            ]);
        }
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleModules($pdo) {
    try {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            // Get module configurations
            $stmt = $pdo->query("SELECT * FROM module_configurations ORDER BY user_email");
            $configurations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $configurations
            ]);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleBlog($pdo) {
    try {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 20;
        $status = $_GET['status'] ?? '';
        
        $offset = ($page - 1) * $limit;
        
        $whereConditions = [];
        $params = [];
        
        if ($status) {
            $whereConditions[] = "status = :status";
            $params[':status'] = $status;
        }
        
        $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Get blog posts
        $sql = "SELECT id, title, slug, excerpt, author_id, featured_image, category, status, 
                       published_at, created_at, updated_at
                FROM blog_posts 
                $whereClause
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM blog_posts $whereClause";
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'posts' => $posts,
                'pagination' => [
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ]
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleAds($pdo) {
    try {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 20;
        $category = $_GET['category'] ?? '';
        
        $offset = ($page - 1) * $limit;
        
        $whereConditions = [];
        $params = [];
        
        if ($category) {
            $whereConditions[] = "category = :category";
            $params[':category'] = $category;
        }
        
        $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Get advertisements
        $sql = "SELECT id, title, advertiser, image_url, cta_text, target_url, category, 
                       placements, is_active, priority, created_at, updated_at
                FROM advertisements 
                $whereClause
                ORDER BY priority DESC, created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM advertisements $whereClause";
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'advertisements' => $ads,
                'pagination' => [
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ]
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function timeAgo($datetime) {
    $time = time() - strtotime($datetime);
    
    if ($time < 60) return 'just now';
    if ($time < 3600) return floor($time/60) . ' minutes ago';
    if ($time < 86400) return floor($time/3600) . ' hours ago';
    if ($time < 2592000) return floor($time/86400) . ' days ago';
    if ($time < 31536000) return floor($time/2592000) . ' months ago';
    return floor($time/31536000) . ' years ago';
}
?>
