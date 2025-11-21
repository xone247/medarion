<?php
// Get deals endpoint
// Returns a list of deals from the database

try {
    $config = require_once '../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );
    
    // Get query parameters
    $deal_type = $_GET['deal_type'] ?? null;
    $status = $_GET['status'] ?? null;
    $company_id = $_GET['company_id'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    
    // Build query with JOIN to get company information
    $sql = "SELECT d.id, d.company_id, d.deal_type, d.amount, d.valuation, 
                   d.lead_investor, d.participants, d.deal_date, d.status, 
                   d.description, d.created_at, d.updated_at, d.sector,
                   c.name as company_name, c.industry, c.stage, c.country, c.headquarters
            FROM deals d
            LEFT JOIN companies c ON d.company_id = c.id";
    
    $params = [];
    $whereConditions = [];
    
    if ($deal_type) {
        $whereConditions[] = "d.deal_type = :deal_type";
        $params[':deal_type'] = $deal_type;
    }
    
    if ($status) {
        $whereConditions[] = "d.status = :status";
        $params[':status'] = $status;
    }
    
    if ($company_id) {
        $whereConditions[] = "d.company_id = :company_id";
        $params[':company_id'] = $company_id;
    }
    
    if (!empty($whereConditions)) {
        $sql .= " WHERE " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " ORDER BY d.deal_date DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $deals = $stmt->fetchAll();
    
    // Ensure company_name and country have fallbacks for each deal
    foreach ($deals as &$deal) {
        if (empty($deal['company_name'])) {
            $deal['company_name'] = !empty($deal['lead_investor']) ? $deal['lead_investor'] . ' Deal' : 'Unnamed Company';
        }
        if (empty($deal['country'])) {
            $deal['country'] = 'Unknown';
        }
        // Decode participants if it's a JSON string
        if (isset($deal['participants']) && is_string($deal['participants'])) {
            $deal['participants'] = json_decode($deal['participants'], true) ?? [];
        }
    }
    unset($deal); // Break reference
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM deals d";
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
        'data' => $deals,
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
