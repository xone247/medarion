<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=medarion_platform', 'root', '');
    $stmt = $pdo->query('SHOW CREATE TABLE investigators');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo $result['Create Table'];
} catch(Exception $e) {
    echo $e->getMessage();
}

