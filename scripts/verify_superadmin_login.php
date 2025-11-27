<?php
// Verify Super Admin Login Credentials

$config = require __DIR__ . '/../config/database.php';

try {
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== SUPER ADMIN LOGIN VERIFICATION ===\n\n";
    
    $email = 'superadmin@medarion.com';
    
    // Get super admin
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "❌ Super admin account not found!\n";
        echo "→ Run: https://medarion.africa/api/admin/ensure_superadmin.php\n";
        exit(1);
    }
    
    echo "✓ Super Admin Account Found:\n";
    echo "  Email: {$user['email']}\n";
    echo "  Username: " . ($user['username'] ?? 'N/A') . "\n";
    echo "  Name: " . trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? '')) . "\n";
    echo "  Role: {$user['role']}\n";
    echo "  Is Admin: " . ($user['is_admin'] ? 'Yes' : 'No') . "\n";
    echo "  Is Active: " . ($user['is_active'] ? 'Yes' : 'No') . "\n";
    echo "  App Roles: " . ($user['app_roles'] ?? 'N/A') . "\n\n";
    
    // Test password
    $testPasswords = [
        'ChangeMeNow!123',
        'admin123',
        'password',
        'medarion123'
    ];
    
    echo "Testing Common Passwords:\n";
    $passwordFound = false;
    foreach ($testPasswords as $testPwd) {
        if (password_verify($testPwd, $user['password_hash'])) {
            echo "  ✓ Password found: $testPwd\n";
            $passwordFound = true;
            break;
        } else {
            echo "  ✗ Not: $testPwd\n";
        }
    }
    
    if (!$passwordFound) {
        echo "\n⚠ Password not found in common list.\n";
        echo "→ Resetting password to: ChangeMeNow!123\n";
        
        $newHash = password_hash('ChangeMeNow!123', PASSWORD_BCRYPT);
        $update = $pdo->prepare("UPDATE users SET password_hash = ?, is_active = 1 WHERE email = ?");
        $update->execute([$newHash, $email]);
        
        echo "✓ Password reset successful!\n";
        echo "\nLogin Credentials:\n";
        echo "  Email: superadmin@medarion.com\n";
        echo "  Password: ChangeMeNow!123\n";
    } else {
        echo "\n✓ Login Credentials:\n";
        echo "  Email: superadmin@medarion.com\n";
        echo "  Password: ChangeMeNow!123\n";
    }
    
    echo "\n=== LOGIN INSTRUCTIONS ===\n";
    echo "1. Go to: https://medarion.africa\n";
    echo "2. Click 'Sign in'\n";
    echo "3. Enter email: superadmin@medarion.com\n";
    echo "4. Enter password: ChangeMeNow!123\n";
    echo "5. Click 'Sign in'\n\n";
    
    echo "⚠ SECURITY NOTE: Change this password immediately after first login!\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

