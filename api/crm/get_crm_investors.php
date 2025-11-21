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

    if (preg_match('/Bearer\s+(\S+)/', $auth, $m)) {
        $token = $m[1];
        $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE session_token = :token AND expires_at > NOW()");
        $stmt->bindValue(':token', $token);
        $stmt->execute();
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($session) {
            $userId = $session['user_id'];
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

    ob_start();

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT * FROM crm_investors 
            WHERE user_id = :user_id 
            ORDER BY 
                CASE pipeline_stage
                    WHEN 'Not Contacted' THEN 1
                    WHEN 'Contacted' THEN 2
                    WHEN 'Meeting Set' THEN 3
                    WHEN 'Proposal' THEN 4
                    WHEN 'Negotiation' THEN 5
                    WHEN 'Closed Won' THEN 6
                    WHEN 'Closed Lost' THEN 7
                    ELSE 8
                END,
                created_at DESC
        ");
        $stmt->bindValue(':user_id', $userId);
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
        
        $stmt = $pdo->prepare("
            INSERT INTO crm_investors 
            (user_id, name, type, focus, email, phone, pipeline_stage, notes, deal_size, timeline)
            VALUES 
            (:user_id, :name, :type, :focus, :email, :phone, :pipeline_stage, :notes, :deal_size, :timeline)
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':name' => $input['name'] ?? '',
            ':type' => $input['type'] ?? null,
            ':focus' => $input['focus'] ?? null,
            ':email' => $input['email'] ?? null,
            ':phone' => $input['phone'] ?? null,
            ':pipeline_stage' => $input['pipeline_stage'] ?? 'Not Contacted',
            ':notes' => $input['notes'] ?? null,
            ':deal_size' => $input['deal_size'] ?? null,
            ':timeline' => $input['timeline'] ?? null
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

        $fields = [];
        $params = [':id' => $id, ':user_id' => $userId];
        
        $allowedFields = ['name', 'type', 'focus', 'email', 'phone', 'pipeline_stage', 'notes', 'deal_size', 'timeline', 'probability_percent', 'next_action', 'next_action_date', 'last_contact'];
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
        $sql = "UPDATE crm_investors SET " . implode(', ', $fields) . " WHERE id = :id AND user_id = :user_id";
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

        $stmt = $pdo->prepare("DELETE FROM crm_investors WHERE id = :id AND user_id = :user_id");
        $stmt->execute([':id' => $id, ':user_id' => $userId]);

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

