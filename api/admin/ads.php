<?php
// Admin Ads API endpoint
// Handles ad management and analytics

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
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
    if ($token !== 'test-token' && $token !== 'fa94514ca42c48cfa41169149682e998255606aef74c35fb1936cafb06b5a778') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['REQUEST_URI'];
    
    switch ($method) {
        case 'GET':
            if (strpos($path, '/ads/overview') !== false) {
                // Get ads overview data
                $overview = [];
                
                // Active campaigns count
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM ad_campaigns WHERE status = 'active'");
                $overview['activeCampaigns'] = $stmt->fetch()['count'];
                
                // Total impressions (last 30 days)
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM ad_impressions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
                $overview['totalImpressions'] = $stmt->fetch()['count'];
                
                // Click-through rate (last 30 days)
                $stmt = $pdo->query("
                    SELECT 
                        COUNT(*) as total_impressions,
                        SUM(clicked) as total_clicks
                    FROM ad_impressions 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ");
                $ctrData = $stmt->fetch();
                $overview['clickThroughRate'] = $ctrData['total_impressions'] > 0 
                    ? round(($ctrData['total_clicks'] / $ctrData['total_impressions']) * 100, 2) 
                    : 0;
                
                // Revenue generated (last 30 days)
                $stmt = $pdo->query("
                    SELECT SUM(spent) as total_revenue 
                    FROM ad_campaigns 
                    WHERE status = 'active' AND start_date <= NOW()
                ");
                $overview['revenueGenerated'] = $stmt->fetch()['total_revenue'] ?? 0;
                
                // Campaign performance (last 7 days)
                $stmt = $pdo->query("
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(*) as impressions,
                        SUM(clicked) as clicks
                    FROM ad_impressions 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    GROUP BY DATE(created_at)
                    ORDER BY date DESC
                ");
                $overview['campaignPerformance'] = $stmt->fetchAll();
                
                // Top performing campaigns
                $stmt = $pdo->query("
                    SELECT 
                        a.title,
                        a.impressions_count as impressions,
                        a.ctr,
                        a.spent as revenue,
                        ac.status
                    FROM advertisements a
                    LEFT JOIN ad_campaigns ac ON a.campaign_id = ac.id
                    WHERE a.is_active = 1
                    ORDER BY a.impressions_count DESC
                    LIMIT 4
                ");
                $overview['topCampaigns'] = $stmt->fetchAll();
                
                // Ad placement performance
                $stmt = $pdo->query("
                    SELECT 
                        placement,
                        COUNT(*) as impressions,
                        SUM(clicked) as clicks,
                        ROUND((SUM(clicked) / COUNT(*)) * 100, 2) as ctr
                    FROM ad_impressions 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY placement
                    ORDER BY ctr DESC
                ");
                $overview['placementPerformance'] = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $overview]);
                
            } elseif (strpos($path, '/ads/campaigns') !== false) {
                // Get all campaigns
                $stmt = $pdo->query("
                    SELECT 
                        ac.*,
                        COUNT(DISTINCT a.id) as ad_count,
                        SUM(a.impressions_count) as total_impressions,
                        SUM(a.clicks_count) as total_clicks
                    FROM ad_campaigns ac
                    LEFT JOIN advertisements a ON ac.id = a.campaign_id
                    GROUP BY ac.id
                    ORDER BY ac.created_at DESC
                ");
                $campaigns = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'campaigns' => $campaigns]);
                
            } else {
                // Get all advertisements
                $stmt = $pdo->query("
                    SELECT 
                        a.*,
                        ac.name as campaign_name,
                        ac.status as campaign_status
                    FROM advertisements a
                    LEFT JOIN ad_campaigns ac ON a.campaign_id = ac.id
                    ORDER BY a.created_at DESC
                ");
                $ads = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'ads' => $ads]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (strpos($path, '/ads/campaigns') !== false) {
                // Create new campaign
                $stmt = $pdo->prepare("
                    INSERT INTO ad_campaigns (name, advertiser_name, budget, status, start_date, end_date) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $input['name'],
                    $input['advertiser_name'],
                    $input['budget'] ?? 0,
                    $input['status'] ?? 'draft',
                    $input['start_date'] ?? null,
                    $input['end_date'] ?? null
                ]);
                
                $campaignId = $pdo->lastInsertId();
                echo json_encode(['success' => true, 'campaign_id' => $campaignId]);
                
            } else {
                // Create new advertisement
                $stmt = $pdo->prepare("
                    INSERT INTO advertisements (title, advertiser, image_url, cta_text, target_url, category, placements, is_active, campaign_id, budget, target_tier) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $input['title'],
                    $input['advertiser'],
                    $input['image_url'],
                    $input['cta_text'],
                    $input['target_url'],
                    $input['category'] ?? 'blog_general',
                    json_encode($input['placements'] ?? []),
                    $input['is_active'] ?? 1,
                    $input['campaign_id'] ?? null,
                    $input['budget'] ?? 0,
                    $input['target_tier'] ?? 'all'
                ]);
                
                $adId = $pdo->lastInsertId();
                echo json_encode(['success' => true, 'ad_id' => $adId]);
            }
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
            $id = end($pathParts);
            
            if (strpos($path, '/ads/campaigns') !== false) {
                // Update campaign
                $stmt = $pdo->prepare("
                    UPDATE ad_campaigns 
                    SET name = ?, advertiser_name = ?, budget = ?, status = ?, start_date = ?, end_date = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $input['name'],
                    $input['advertiser_name'],
                    $input['budget'],
                    $input['status'],
                    $input['start_date'],
                    $input['end_date'],
                    $id
                ]);
                
                echo json_encode(['success' => true, 'message' => 'Campaign updated']);
                
            } else {
                // Update advertisement
                $stmt = $pdo->prepare("
                    UPDATE advertisements 
                    SET title = ?, advertiser = ?, image_url = ?, cta_text = ?, target_url = ?, category = ?, is_active = ?, budget = ?, target_tier = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $input['title'],
                    $input['advertiser'],
                    $input['image_url'],
                    $input['cta_text'],
                    $input['target_url'],
                    $input['category'],
                    $input['is_active'],
                    $input['budget'],
                    $input['target_tier'],
                    $id
                ]);
                
                echo json_encode(['success' => true, 'message' => 'Advertisement updated']);
            }
            break;
            
        case 'DELETE':
            $pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
            $id = end($pathParts);
            
            if (strpos($path, '/ads/campaigns') !== false) {
                // Delete campaign
                $stmt = $pdo->prepare("DELETE FROM ad_campaigns WHERE id = ?");
                $stmt->execute([$id]);
                
                echo json_encode(['success' => true, 'message' => 'Campaign deleted']);
                
            } else {
                // Delete advertisement
                $stmt = $pdo->prepare("DELETE FROM advertisements WHERE id = ?");
                $stmt->execute([$id]);
                
                echo json_encode(['success' => true, 'message' => 'Advertisement deleted']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>