<?php
header('Content-Type: application/json');

try {
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) { $dsn .= ";port={$config['port']}"; }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ensure user_roles table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role VARCHAR(50) NOT NULL,
        UNIQUE KEY uk_user_role(user_id, role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $email = 'blogmanager@demo.medarion.com';
    $passwordHash = password_hash('Demo!23456', PASSWORD_DEFAULT);

    // Upsert user
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_verified, is_active, created_at, updated_at)
                           VALUES (:username, :email, :password_hash, 'Blog', 'Manager', 'startup', 1, 1, NOW(), NOW())
                           ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), updated_at = NOW()");
    $stmt->execute([
        ':username' => 'blogmanager',
        ':email' => $email,
        ':password_hash' => $passwordHash,
    ]);

    // Get user id
    $sel = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $sel->execute([':email' => $email]);
    $user = $sel->fetch(PDO::FETCH_ASSOC);
    if (!$user) throw new Exception('Failed to create blog manager user');
    $userId = (int)$user['id'];

    // Grant blog_manager role
    $grant = $pdo->prepare('INSERT IGNORE INTO user_roles (user_id, role) VALUES (:uid, :role)');
    $grant->execute([':uid' => $userId, ':role' => 'blog_manager']);

    echo json_encode(['success' => true, 'email' => $email, 'password' => 'Demo!23456']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>



