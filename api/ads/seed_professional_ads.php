<?php
// Script to seed the database with professional ads
// This script creates comprehensive ad campaigns for the blog system

header('Content-Type: application/json');

try {
    // Include database configuration
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    // Clear existing ads
    $pdo->exec("DELETE FROM advertisements");
    $pdo->exec("DELETE FROM sponsored_ads");
    
    // Define professional ads
    $advertisements = [
        [
            'title' => 'Healthcare Analytics Report 2025',
            'advertiser' => 'Insight Partners',
            'image_url' => 'https://images.unsplash.com/photo-1638913974023-588fb0598605?w=400&h=200&fit=crop&auto=format',
            'cta_text' => 'Download Report',
            'target_url' => 'https://insightpartners.com/healthcare-report-2025',
            'category' => 'blog_general',
            'placements' => json_encode(['blog_top', 'blog_inline']),
            'is_active' => 1,
            'priority' => 10,
            'target_tier' => 'all',
            'budget' => 5000.00,
            'spent' => 1250.00,
            'impressions_count' => 15420,
            'clicks_count' => 342,
            'ctr' => 2.22,
            'start_date' => '2025-01-01 00:00:00',
            'end_date' => '2025-12-31 23:59:59'
        ],
        [
            'title' => 'AI-Powered Healthcare Analytics',
            'advertiser' => 'Medarion AI',
            'image_url' => 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&auto=format',
            'cta_text' => 'Learn More',
            'target_url' => '/ai-tools',
            'category' => 'blog_general',
            'placements' => json_encode(['blog_sidebar']),
            'is_active' => 1,
            'priority' => 9,
            'target_tier' => 'all',
            'budget' => 3000.00,
            'spent' => 567.00,
            'impressions_count' => 8920,
            'clicks_count' => 156,
            'ctr' => 1.75,
            'start_date' => '2025-01-01 00:00:00',
            'end_date' => '2025-12-31 23:59:59'
        ],
        [
            'title' => 'Investment Opportunities in African Healthcare',
            'advertiser' => 'Medarion Investment Network',
            'image_url' => 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&auto=format',
            'cta_text' => 'Explore Deals',
            'target_url' => '/deals',
            'category' => 'blog_general',
            'placements' => json_encode(['blog_top', 'blog_sidebar']),
            'is_active' => 1,
            'priority' => 8,
            'target_tier' => 'all',
            'budget' => 4000.00,
            'spent' => 890.00,
            'impressions_count' => 12340,
            'clicks_count' => 289,
            'ctr' => 2.34,
            'start_date' => '2025-01-01 00:00:00',
            'end_date' => '2025-12-31 23:59:59'
        ],
        [
            'title' => 'Healthcare Innovation Summit 2025',
            'advertiser' => 'Medarion Events',
            'image_url' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=200&fit=crop&auto=format',
            'cta_text' => 'Register Now',
            'target_url' => '/events/summit-2025',
            'category' => 'blog_general',
            'placements' => json_encode(['blog_sidebar']),
            'is_active' => 1,
            'priority' => 7,
            'target_tier' => 'all',
            'budget' => 3500.00,
            'spent' => 678.00,
            'impressions_count' => 7890,
            'clicks_count' => 167,
            'ctr' => 2.12,
            'start_date' => '2025-01-01 00:00:00',
            'end_date' => '2025-06-30 23:59:59'
        ],
        [
            'title' => 'Digital Health Accelerator Program',
            'advertiser' => 'Medarion Accelerator',
            'image_url' => 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&auto=format',
            'cta_text' => 'Apply Today',
            'target_url' => '/accelerator',
            'category' => 'blog_general',
            'placements' => json_encode(['blog_inline']),
            'is_active' => 1,
            'priority' => 6,
            'target_tier' => 'all',
            'budget' => 2800.00,
            'spent' => 456.00,
            'impressions_count' => 5670,
            'clicks_count' => 123,
            'ctr' => 2.17,
            'start_date' => '2025-01-01 00:00:00',
            'end_date' => '2025-03-31 23:59:59'
        ],
        [
            'title' => 'Premium Healthcare Market Intelligence',
            'advertiser' => 'Medarion Premium',
            'image_url' => 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&auto=format',
            'cta_text' => 'Upgrade Now',
            'target_url' => '/pricing',
            'category' => 'dashboard_personalized',
            'placements' => json_encode(['dashboard_sidebar', 'dashboard_inline']),
            'is_active' => 1,
            'priority' => 5,
            'target_tier' => 'free',
            'budget' => 2000.00,
            'spent' => 234.00,
            'impressions_count' => 4560,
            'clicks_count' => 98,
            'ctr' => 2.15,
            'start_date' => '2025-01-01 00:00:00',
            'end_date' => '2025-12-31 23:59:59'
        ],
        [
            'title' => 'Weekly Market Brief Newsletter',
            'advertiser' => 'Medarion',
            'image_url' => 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=200&fit=crop&auto=format',
            'cta_text' => 'Subscribe',
            'target_url' => '/newsletter',
            'category' => 'newsletter_general',
            'placements' => json_encode(['newsletter']),
            'is_active' => 1,
            'priority' => 4,
            'target_tier' => 'all',
            'budget' => 1500.00,
            'spent' => 345.00,
            'impressions_count' => 6780,
            'clicks_count' => 145,
            'ctr' => 2.14,
            'start_date' => '2025-01-01 00:00:00',
            'end_date' => '2025-12-31 23:59:59'
        ]
    ];
    
    // Insert advertisements
    $stmt = $pdo->prepare("
        INSERT INTO advertisements (
            title, advertiser, image_url, cta_text, target_url, category, 
            placements, is_active, priority, target_tier, budget, spent,
            impressions_count, clicks_count, ctr, start_date, end_date, created_at, updated_at
        ) VALUES (
            :title, :advertiser, :image_url, :cta_text, :target_url, :category,
            :placements, :is_active, :priority, :target_tier, :budget, :spent,
            :impressions_count, :clicks_count, :ctr, :start_date, :end_date, NOW(), NOW()
        )
    ");
    
    $insertedAds = [];
    foreach ($advertisements as $ad) {
        $stmt->execute($ad);
        $insertedAds[] = [
            'id' => $pdo->lastInsertId(),
            'title' => $ad['title'],
            'advertiser' => $ad['advertiser']
        ];
    }
    
    // Define sponsored ads
    $sponsoredAds = [
        [
            'title' => 'Medarion Pro Analytics',
            'description' => 'Advanced healthcare market intelligence and investment insights',
            'image_url' => 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=150&fit=crop&auto=format',
            'link_url' => '/pricing',
            'position' => 'blog_grid',
            'priority' => 10,
            'is_active' => 1
        ],
        [
            'title' => 'Clinical Trials Database',
            'description' => 'Comprehensive database of clinical trials across Africa',
            'image_url' => 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=300&h=150&fit=crop&auto=format',
            'link_url' => '/module/clinical-trials',
            'position' => 'blog_sidebar',
            'priority' => 9,
            'is_active' => 1
        ],
        [
            'title' => 'Investor CRM Toolkit',
            'description' => 'Manage your healthcare investment portfolio with our CRM',
            'image_url' => 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=150&fit=crop&auto=format',
            'link_url' => '/module/deals',
            'position' => 'blog_inline',
            'priority' => 8,
            'is_active' => 1
        ]
    ];
    
    // Insert sponsored ads
    $stmt = $pdo->prepare("
        INSERT INTO sponsored_ads (
            title, description, image_url, link_url, position, priority, is_active, created_at, updated_at
        ) VALUES (
            :title, :description, :image_url, :link_url, :position, :priority, :is_active, NOW(), NOW()
        )
    ");
    
    $insertedSponsoredAds = [];
    foreach ($sponsoredAds as $ad) {
        $stmt->execute($ad);
        $insertedSponsoredAds[] = [
            'id' => $pdo->lastInsertId(),
            'title' => $ad['title'],
            'position' => $ad['position']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Successfully seeded ' . count($insertedAds) . ' advertisements and ' . count($insertedSponsoredAds) . ' sponsored ads',
        'advertisements' => $insertedAds,
        'sponsored_ads' => $insertedSponsoredAds
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



