<?php
header('Content-Type: application/json');

try {
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) { $dsn .= ";port={$config['port']}"; }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Make sure 'executive' exists in enum and migrate any existing 'regulator' data
    $pdo->beginTransaction();
    $pdo->exec("ALTER TABLE users MODIFY role ENUM('admin','investor','startup','researcher','executive') DEFAULT 'startup'");
    $stmt = $pdo->prepare("UPDATE users SET role='executive' WHERE role='regulator'");
    $stmt->execute();
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Role enum updated; regulator -> executive']);
} catch (Throwable $e) {
    if (isset($pdo)) { try { $pdo->rollBack(); } catch (Throwable $e2) {} }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>




