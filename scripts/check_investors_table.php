<?php
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$stmt = $pdo->query("SHOW COLUMNS FROM investors");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Investors table columns:\n";
foreach ($cols as $col) {
    echo "  - " . $col['Field'] . " (" . $col['Type'] . ")\n";
}

