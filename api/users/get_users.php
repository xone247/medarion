<?php
// Get users endpoint
// Returns a list of users from the database

try {
    $config = require_once '../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );
    
    // Get query parameters
    $role = $_GET['role'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    
    // Build query
    $sql = "SELECT id, username, email, first_name, last_name, role, company_name, 
                   phone, country, city, bio, profile_image, is_verified, is_active, 
                   created_at, updated_at 
            FROM users 
            WHERE is_active = 1";
    
    $params = [];
    
    if ($role) {
        $sql .= " AND role = :role";
        $params[':role'] = $role;
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM users WHERE is_active = 1";
    if ($role) {
        $countSql .= " AND role = :role";
    }
    
    $countStmt = $pdo->prepare($countSql);
    if ($role) {
        $countStmt->bindValue(':role', $role);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'data' => $users,
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
