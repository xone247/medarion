<?php
header('Content-Type: text/plain');

// Load cPanel database config
$configPath = __DIR__ . '/../cpanel-config.json';
if (!file_exists($configPath)) {
    die("ERROR: cpanel-config.json not found\n");
}

$config = json_decode(file_get_contents($configPath), true);
$dbConfig = $config['database'];

try {
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "=== SUPER ADMIN ACCOUNT CHECK ===\n\n";
    
    // Check super admin
    $stmt = $pdo->prepare("
        SELECT id, username, email, first_name, last_name, role, user_type, account_tier, 
               is_admin, is_active, app_roles, created_at
        FROM users 
        WHERE email = 'superadmin@medarion.com' 
           OR role = 'admin' 
           OR JSON_CONTAINS(app_roles, '\"super_admin\"')
        ORDER BY id
    ");
    $stmt->execute();
    $admins = $stmt->fetchAll();
    
    if (count($admins) > 0) {
        foreach ($admins as $admin) {
            echo "ID: {$admin['id']}\n";
            echo "Username: {$admin['username']}\n";
            echo "Email: {$admin['email']}\n";
            echo "Name: {$admin['first_name']} {$admin['last_name']}\n";
            echo "Role: {$admin['role']}\n";
            echo "User Type: {$admin['user_type']}\n";
            echo "Account Tier: {$admin['account_tier']}\n";
            echo "Is Admin: " . ($admin['is_admin'] ? 'Yes' : 'No') . "\n";
            echo "Is Active: " . ($admin['is_active'] ? 'Yes' : 'No') . "\n";
            echo "App Roles: {$admin['app_roles']}\n";
            echo "Created: {$admin['created_at']}\n";
            echo "---\n\n";
        }
    } else {
        echo "No super admin account found!\n\n";
    }
    
    echo "\n=== ALL ACCOUNT TYPES SUMMARY ===\n\n";
    
    // Count by user_type and account_tier
    $stmt = $pdo->query("
        SELECT user_type, account_tier, COUNT(*) as count 
        FROM users 
        WHERE is_active = 1 
        GROUP BY user_type, account_tier 
        ORDER BY user_type, account_tier
    ");
    $types = $stmt->fetchAll();
    
    echo "User Type Distribution:\n";
    foreach ($types as $type) {
        echo "  {$type['user_type']} / {$type['account_tier']}: {$type['count']} users\n";
    }
    
    echo "\n=== ALL ACTIVE USERS (First 20) ===\n\n";
    
    $stmt = $pdo->query("
        SELECT id, username, email, role, user_type, account_tier, is_admin, is_active
        FROM users 
        WHERE is_active = 1 
        ORDER BY id 
        LIMIT 20
    ");
    $users = $stmt->fetchAll();
    
    echo sprintf("%-5s %-25s %-30s %-10s %-20s %-15s %-8s\n", 
        "ID", "Username", "Email", "Role", "User Type", "Tier", "Admin");
    echo str_repeat("-", 120) . "\n";
    
    foreach ($users as $user) {
        echo sprintf("%-5s %-25s %-30s %-10s %-20s %-15s %-8s\n",
            $user['id'],
            substr($user['username'], 0, 25),
            substr($user['email'], 0, 30),
            $user['role'],
            substr($user['user_type'], 0, 20),
            $user['account_tier'],
            $user['is_admin'] ? 'Yes' : 'No'
        );
    }
    
    echo "\n=== TOTAL USER COUNT ===\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE is_active = 1");
    $total = $stmt->fetch();
    echo "Total Active Users: {$total['total']}\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}

