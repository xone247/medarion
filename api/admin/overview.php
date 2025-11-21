<?php
// Admin Overview API endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Include database configuration
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    // Get authorization header
    $authHeader = '';
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    $authHeader = $authHeader ?: $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authorization token required']);
        exit;
    }
    
    $token = $matches[1];
    
    // Verify token (for development, accept test-token)
    if ($token === 'test-token' || $token === 'fa94514ca42c48cfa41169149682e998255606aef74c35fb1936cafb06b5a778') {
        // Verify admin user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND is_active = 1");
        $stmt->execute(['superadmin@medarion.com']);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Admin user not found']);
            exit;
        }
    } else {
        // For development, accept any token
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND is_active = 1");
        $stmt->execute([1]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid token']);
            exit;
        }
    }
    
    // Get user statistics
    $users = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $activeUsers = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE is_active = 1")->fetchColumn();
    $posts = (int)$pdo->query("SELECT COUNT(*) FROM blog_posts")->fetchColumn();
    $monthUsers = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetchColumn();
    
    // Get user roles distribution
    $stmt = $pdo->query("
        SELECT 
            role,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE is_active = 1), 1) as percentage
        FROM users 
        WHERE is_active = 1 
        GROUP BY role 
        ORDER BY count DESC
    ");
    $userRoles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get user growth for last 6 months
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(created_at, '%b') as month,
            COUNT(*) as users
        FROM users 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY created_at ASC
    ");
    $userGrowth = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get revenue statistics (placeholder for now)
    $totalRevenue = 0;
    $monthlyRevenue = 0;
    
    // Get revenue by tier
    $stmt = $pdo->query("
        SELECT 
            COALESCE(account_tier, 'free') as tier,
            COUNT(*) as users,
            COUNT(*) * 50 as revenue
        FROM users 
        WHERE is_active = 1 
        GROUP BY COALESCE(account_tier, 'free')
        ORDER BY revenue DESC
    ");
    $revenueByTier = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recent activity
    $stmt = $pdo->query("
        SELECT 
            'signup' as type,
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''), ' joined the platform') as message,
            created_at as time,
            'user' as icon
        FROM users 
        WHERE is_active = 1 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $recentActivity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Helper function to format time ago
    function timeAgo($datetime) {
        $time = time() - strtotime($datetime);
        if ($time < 60) return 'just now';
        if ($time < 3600) return floor($time/60) . ' minutes ago';
        if ($time < 86400) return floor($time/3600) . ' hours ago';
        if ($time < 2592000) return floor($time/86400) . ' days ago';
        if ($time < 31536000) return floor($time/2592000) . ' months ago';
        return floor($time/31536000) . ' years ago';
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'metrics' => ['system_ok' => true],
            'userStats' => [
                'totalUsers' => $users,
                'activeUsers' => $activeUsers,
                'newUsersThisMonth' => $monthUsers
            ],
            'revenueStats' => [
                'totalRevenue' => $totalRevenue,
                'monthlyRevenue' => $monthlyRevenue
            ],
            'blogStats' => [
                'blogPosts' => $posts
            ],
            'userRoles' => array_map(function($role) {
                return [
                    'role' => ucfirst(str_replace('_', ' ', $role['role'])),
                    'count' => (int)$role['count'],
                    'percentage' => (float)$role['percentage']
                ];
            }, $userRoles),
            'revenueByTier' => array_map(function($tier) {
                return [
                    'tier' => ucfirst($tier['tier']),
                    'revenue' => (float)$tier['revenue'],
                    'users' => (int)$tier['users']
                ];
            }, $revenueByTier),
            'recentActivity' => array_map(function($activity) {
                return [
                    'type' => $activity['type'],
                    'message' => $activity['message'],
                    'time' => timeAgo($activity['time']),
                    'icon' => $activity['icon']
                ];
            }, $recentActivity),
            'userGrowth' => array_map(function($growth) {
                return [
                    'month' => $growth['month'],
                    'users' => (int)$growth['users']
                ];
            }, $userGrowth)
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>