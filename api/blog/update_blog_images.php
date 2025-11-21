<?php
// Script to update blog posts with working images
// This script updates the featured_image field for all blog posts

header('Content-Type: application/json');

try {
    // Include database configuration
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    // Define image mappings for each blog post
    $imageMappings = [
        89 => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=600&fit=crop&auto=format', // Healthcare Technology
        90 => 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1200&h=600&fit=crop&auto=format', // Clinical Trials
        91 => 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=600&fit=crop&auto=format', // Mental Health
        92 => 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=600&fit=crop&auto=format', // Precision Medicine
        93 => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop&auto=format', // Medical Grants
        94 => 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop&auto=format', // Data Security
        95 => 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=600&fit=crop&auto=format', // Telemedicine
        96 => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&auto=format', // Medical Devices
        97 => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=600&fit=crop&auto=format', // Global Health
        98 => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=600&fit=crop&auto=format'  // Evidence-Based Medicine
    ];
    
    $updatedPosts = [];
    
    // Update each blog post with its corresponding image
    $stmt = $pdo->prepare("UPDATE blog_posts SET featured_image = :image WHERE id = :id");
    
    foreach ($imageMappings as $postId => $imageUrl) {
        $stmt->execute([
            ':id' => $postId,
            ':image' => $imageUrl
        ]);
        
        if ($stmt->rowCount() > 0) {
            $updatedPosts[] = [
                'id' => $postId,
                'image' => $imageUrl
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Successfully updated ' . count($updatedPosts) . ' blog posts with new images',
        'updated_posts' => $updatedPosts
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



