<?php
// Check Admin Accounts in Database

$config = require __DIR__ . '/../config/database.php';

try {
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== ADMIN ACCOUNTS IN DATABASE ===\n\n";
    
    // Check users table structure
    echo "Users Table Structure:\n";
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
    echo "\n";
    
    // Get all admin users
    echo "Admin/Super Admin Accounts:\n";
    $stmt = $pdo->query("
        SELECT 
            id, 
            email, 
            username,
            first_name,
            last_name,
            role, 
            is_active,
            is_admin,
            app_roles,
            created_at
        FROM users 
        WHERE role = 'admin' 
           OR is_admin = 1
           OR app_roles LIKE '%super_admin%'
        ORDER BY id
    ");
    
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($admins)) {
        echo "  ⚠ No admin accounts found!\n";
    } else {
        foreach ($admins as $admin) {
            $fullName = trim(($admin['first_name'] ?? '') . ' ' . ($admin['last_name'] ?? ''));
            echo "\n  ID: {$admin['id']}\n";
            echo "  Email: {$admin['email']}\n";
            echo "  Username: " . ($admin['username'] ?? 'N/A') . "\n";
            echo "  Name: " . ($fullName ?: 'N/A') . "\n";
            echo "  Role: {$admin['role']}\n";
            echo "  Is Admin: " . ($admin['is_admin'] ? 'Yes' : 'No') . "\n";
            echo "  Is Active: " . ($admin['is_active'] ? 'Yes' : 'No') . "\n";
            echo "  App Roles: " . ($admin['app_roles'] ?? 'N/A') . "\n";
            echo "  Created: " . ($admin['created_at'] ?? 'N/A') . "\n";
            echo "  ---\n";
        }
    }
    
    // Check for superadmin@medarion.com specifically
    echo "\n\nChecking for superadmin@medarion.com:\n";
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute(['superadmin@medarion.com']);
    $superAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($superAdmin) {
        $fullName = trim(($superAdmin['first_name'] ?? '') . ' ' . ($superAdmin['last_name'] ?? ''));
        echo "  ✓ Found superadmin@medarion.com\n";
        echo "  ID: {$superAdmin['id']}\n";
        echo "  Username: " . ($superAdmin['username'] ?? 'N/A') . "\n";
        echo "  Name: " . ($fullName ?: 'N/A') . "\n";
        echo "  Role: {$superAdmin['role']}\n";
        echo "  Is Admin: " . ($superAdmin['is_admin'] ? 'Yes' : 'No') . "\n";
        echo "  Is Active: " . ($superAdmin['is_active'] ? 'Yes' : 'No') . "\n";
        echo "  App Roles: " . ($superAdmin['app_roles'] ?? 'N/A') . "\n";
    } else {
        echo "  ⚠ superadmin@medarion.com not found\n";
        echo "  → You may need to create it using: api/admin/ensure_superadmin.php\n";
    }
    
    // Count total users
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $total = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "\n\nTotal Users in Database: {$total['total']}\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

