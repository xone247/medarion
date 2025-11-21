<?php
// Public endpoint for regulatory bodies - Read-only
// Start output buffering to prevent premature output
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ob_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options'] ?? []);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if is_active column exists
    $columnsStmt = $pdo->query("SHOW COLUMNS FROM regulatory_bodies");
    $existingColumns = [];
    while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
        $existingColumns[] = $row['Field'];
    }
    $hasIsActive = in_array('is_active', $existingColumns);

    $limit = $_GET['limit'] ?? 100;
    $offset = $_GET['offset'] ?? 0;
    $country = $_GET['country'] ?? '';
    $search = $_GET['search'] ?? '';

    $sql = "SELECT * FROM regulatory_bodies" . ($hasIsActive ? " WHERE is_active = 1" : "");
    $countSql = "SELECT COUNT(*) FROM regulatory_bodies" . ($hasIsActive ? " WHERE is_active = 1" : "");
    $params = [];

    if ($country) {
        $sql .= " AND country = :country";
        $countSql .= " AND country = :country";
        $params[':country'] = $country;
    }

    if ($search) {
        $sql .= " AND (name LIKE :search OR country LIKE :search OR abbreviation LIKE :search OR description LIKE :search)";
        $countSql .= " AND (name LIKE :search OR country LIKE :search OR abbreviation LIKE :search OR description LIKE :search)";
        $params[':search'] = "%$search%";
    }

    $sql .= " ORDER BY country ASC, name ASC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    $stmt->execute();
    $bodies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode JSON fields
    foreach ($bodies as &$body) {
        if (isset($body['contact_info']) && $body['contact_info']) {
            $decoded = json_decode($body['contact_info'], true);
            $body['contact_info'] = $decoded !== null ? $decoded : [];
        }
        if (isset($body['requirements']) && $body['requirements']) {
            $decoded = json_decode($body['requirements'], true);
            $body['requirements'] = $decoded !== null ? $decoded : [];
        }
    }

    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();

    if (!is_numeric($total)) {
        $total = 0;
    }

    if (!is_array($bodies)) {
        $bodies = [];
    }

    ob_clean();
    echo json_encode([
        'success' => true,
        'data' => $bodies,
        'pagination' => [
            'total' => (int)$total,
            'limit' => (int)$limit,
            'offset' => (int)$offset,
            'has_more' => ($offset + $limit) < $total
        ]
    ]);

} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
} finally {
    ob_end_flush();
}

