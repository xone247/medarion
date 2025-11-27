<?php
// Get CRM investors for a user
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
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get user from session token
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $userId = null;
    $isAdmin = false;
    $requestedUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

    if (preg_match('/Bearer\s+(\S+)/', $auth, $m)) {
        $token = $m[1];
        $stmt = $pdo->prepare("
            SELECT us.user_id, u.is_admin, u.role, u.app_roles 
            FROM user_sessions us 
            JOIN users u ON us.user_id = u.id 
            WHERE us.session_token = :token AND us.expires_at > NOW()
        ");
        $stmt->bindValue(':token', $token);
        $stmt->execute();
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($session) {
            $userId = $session['user_id'];
            // Check if user is admin (multiple ways: is_admin flag, role, or app_roles)
            $isAdmin = $session['is_admin'] == 1 || 
                      $session['role'] === 'admin' || 
                      $session['role'] === 'superadmin' ||
                      (is_string($session['app_roles']) && (strpos($session['app_roles'], 'super_admin') !== false || strpos($session['app_roles'], 'admin') !== false)) ||
                      (is_array($session['app_roles']) && (in_array('super_admin', $session['app_roles']) || in_array('admin', $session['app_roles'])));
        }
    }

    // If no auth, allow for development (will be required in production)
    if (!$userId && isset($_GET['user_id'])) {
        $userId = (int)$_GET['user_id'];
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }

    // Determine which user's data to fetch
    $targetUserId = $userId; // Default to current user
    if ($requestedUserId && $isAdmin) {
        // Admin can view any user's data
        $targetUserId = $requestedUserId;
    } elseif ($requestedUserId && !$isAdmin) {
        // Non-admin can only view their own data
        if ($requestedUserId != $userId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            exit();
        }
        $targetUserId = $requestedUserId;
    }

    ob_start();

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT ci.*, u.email as user_email, u.first_name, u.last_name 
            FROM crm_investors ci
            LEFT JOIN users u ON ci.user_id = u.id
            WHERE ci.user_id = :user_id 
            ORDER BY 
                CASE ci.pipeline_stage
                    WHEN 'Lead' THEN 1
                    WHEN 'Qualified' THEN 2
                    WHEN 'Meeting Set' THEN 3
                    WHEN 'Due Diligence' THEN 4
                    WHEN 'Term Sheet' THEN 5
                    WHEN 'Closed Won' THEN 6
                    WHEN 'Closed Lost' THEN 7
                    ELSE 8
                END,
                ci.created_at DESC
        ");
        $stmt->bindValue(':user_id', $targetUserId);
        $stmt->execute();
        $investors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        ob_clean();
        echo json_encode([
            'success' => true,
            'data' => $investors
        ]);
        ob_end_flush();
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Allow admin to create for other users if specified
        $createForUserId = $userId;
        if (isset($input['user_id']) && $isAdmin) {
            $createForUserId = (int)$input['user_id'];
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO crm_investors 
            (user_id, name, type, focus, email, phone, website, headquarters, pipeline_stage, notes, deal_size, timeline, probability_percent, next_action, next_action_date, last_contact)
            VALUES 
            (:user_id, :name, :type, :focus, :email, :phone, :website, :headquarters, :pipeline_stage, :notes, :deal_size, :timeline, :probability_percent, :next_action, :next_action_date, :last_contact)
        ");
        $stmt->execute([
            ':user_id' => $createForUserId,
            ':name' => $input['name'] ?? '',
            ':type' => $input['type'] ?? null,
            ':focus' => $input['focus'] ?? null,
            ':email' => $input['email'] ?? null,
            ':phone' => $input['phone'] ?? null,
            ':website' => $input['website'] ?? null,
            ':headquarters' => $input['headquarters'] ?? null,
            ':pipeline_stage' => $input['pipeline_stage'] ?? 'Lead',
            ':notes' => $input['notes'] ?? null,
            ':deal_size' => $input['deal_size'] ?? null,
            ':timeline' => $input['timeline'] ?? null,
            ':probability_percent' => $input['probability_percent'] ?? 0,
            ':next_action' => $input['next_action'] ?? null,
            ':next_action_date' => $input['next_action_date'] ?? null,
            ':last_contact' => $input['last_contact'] ?? null
        ]);

        ob_clean();
        echo json_encode([
            'success' => true,
            'data' => ['id' => $pdo->lastInsertId()]
        ]);
        ob_end_flush();
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID required']);
            exit();
        }

        // Check ownership or admin access
        $checkStmt = $pdo->prepare("SELECT user_id FROM crm_investors WHERE id = :id");
        $checkStmt->bindValue(':id', $id);
        $checkStmt->execute();
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Investor not found']);
            exit();
        }
        
        if (!$isAdmin && $existing['user_id'] != $userId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            exit();
        }

        $fields = [];
        $params = [':id' => $id];
        
        $allowedFields = ['name', 'type', 'focus', 'email', 'phone', 'website', 'headquarters', 'pipeline_stage', 'notes', 'deal_size', 'timeline', 'probability_percent', 'next_action', 'next_action_date', 'last_contact'];
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $input[$field];
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit();
        }

        $fields[] = "updated_at = NOW()";
        $sql = "UPDATE crm_investors SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        ob_clean();
        echo json_encode(['success' => true]);
        ob_end_flush();
    } elseif ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? $_GET['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID required']);
            exit();
        }

        // Check ownership or admin access
        $checkStmt = $pdo->prepare("SELECT user_id FROM crm_investors WHERE id = :id");
        $checkStmt->bindValue(':id', $id);
        $checkStmt->execute();
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Investor not found']);
            exit();
        }
        
        if (!$isAdmin && $existing['user_id'] != $userId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM crm_investors WHERE id = :id");
        $stmt->execute([':id' => $id]);

        ob_clean();
        echo json_encode(['success' => true]);
        ob_end_flush();
    }

} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
    ob_end_flush();
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
    ob_end_flush();
}

