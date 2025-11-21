<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

try {
  $config = require __DIR__ . '/../../config/database.php';
  $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
  if (!empty($config['port'])) { $dsn .= ";port={$config['port']}"; }
  $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);

  // Ensure users table has needed columns
  // (Assumes existing schema; this endpoint only inserts/updates a superadmin row.)

  $email = 'superadmin@medarion.com';
  $name = 'Super Admin';
  $passwordHash = password_hash('ChangeMeNow!123', PASSWORD_BCRYPT);

  $stmt = $pdo->prepare("SELECT id, is_active FROM users WHERE email = ? LIMIT 1");
  $stmt->execute([$email]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($user) {
    if ((int)$user['is_active'] !== 1) {
      $upd = $pdo->prepare("UPDATE users SET is_active = 1 WHERE id = ?");
      $upd->execute([$user['id']]);
    }
  } else {
    // Insert a minimal super admin; adapt fields to your schema as needed
    $ins = $pdo->prepare("INSERT INTO users (name, email, password, is_active, role) VALUES (?, ?, ?, 1, 'superadmin')");
    $ins->execute([$name, $email, $passwordHash]);
  }

  echo json_encode(['success' => true, 'message' => 'Super admin ensured (email: superadmin@medarion.com).']);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>



