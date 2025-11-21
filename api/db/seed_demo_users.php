<?php
header('Content-Type: application/json');

// Load DB config and open PDO connection
$config = require __DIR__ . '/../../config/database.php';
// Build DSN with port if present
$dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
if (!empty($config['port'])) {
    $dsn .= ";port={$config['port']}";
}
$pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $demoUsers = [
        [
            'email' => 'startup@demo.medarion.com',
            'username' => 'startup',
            'first_name' => 'Startup',
            'last_name' => 'Demo',
            'role' => 'startup',
        ],
        [
            'email' => 'investor@demo.medarion.com',
            'username' => 'investor',
            'first_name' => 'Investor',
            'last_name' => 'Demo',
            'role' => 'investor',
        ],
        [
            'email' => 'executive@demo.medarion.com',
            'username' => 'executive',
            'first_name' => 'Executive',
            'last_name' => 'Demo',
            'role' => 'executive',
        ],
        [
            'email' => 'scientist@demo.medarion.com',
            'username' => 'scientist',
            'first_name' => 'Scientist',
            'last_name' => 'Demo',
            'role' => 'researcher',
        ],
        [
            'email' => 'media@demo.medarion.com',
            'username' => 'media',
            'first_name' => 'Media',
            'last_name' => 'Demo',
            'role' => 'executive',
        ],
        [
            'email' => 'superadmin@demo.medarion.com',
            'username' => 'superadmin',
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'role' => 'admin',
        ],
    ];

    $insert = $pdo->prepare(
        "INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_verified, is_active, created_at, updated_at)
         VALUES (:username, :email, :password_hash, :first_name, :last_name, :role, 1, 1, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
            password_hash = VALUES(password_hash),
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            role = VALUES(role),
            is_verified = 1,
            is_active = 1,
            updated_at = NOW()"
    );

    $passwordHash = password_hash('Demo!23456', PASSWORD_DEFAULT);
    $created = 0; $updated = 0; $skipped = 0;

    foreach ($demoUsers as $u) {
        // Check if exists
        $check = $pdo->prepare('SELECT id FROM users WHERE email = :email');
        $check->execute([':email' => $u['email']]);
        $exists = $check->fetch(PDO::FETCH_ASSOC);

        $insert->execute([
            ':username' => $u['username'],
            ':email' => $u['email'],
            ':password_hash' => $passwordHash,
            ':first_name' => $u['first_name'],
            ':last_name' => $u['last_name'],
            ':role' => $u['role'],
        ]);

        if ($exists) { $updated++; } else { $created++; }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Demo users seeded',
        'created' => $created,
        'updated' => $updated
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>


