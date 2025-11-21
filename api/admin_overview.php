<?php
// Admin Dashboard Overview endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
