<?php
/**
 * Test INSERT statements for remaining tables
 */
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// Read a sample INSERT from seed file
$seed_file = __DIR__ . '/seed_real_data_comprehensive.sql';
$content = file_get_contents($seed_file);

// Find sample INSERTs
preg_match('/INSERT INTO clinical_centers[^;]+;/s', $content, $clinical_match);
preg_match('/INSERT INTO investigators[^;]+;/s', $content, $investigator_match);
preg_match('/INSERT INTO company_regulatory[^;]+;/s', $content, $regulatory_match);

echo "Testing INSERT statements:\n\n";

if (!empty($clinical_match[0])) {
    $sql = trim($clinical_match[0]);
    echo "Clinical Centers INSERT:\n";
    echo substr($sql, 0, 200) . "...\n";
    try {
        $pdo->exec($sql);
        echo "✅ Works!\n";
        $pdo->exec("DELETE FROM clinical_centers WHERE name LIKE 'Clinical Research%' LIMIT 1");
    } catch (PDOException $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

if (!empty($investigator_match[0])) {
    $sql = trim($investigator_match[0]);
    echo "Investigators INSERT:\n";
    echo substr($sql, 0, 200) . "...\n";
    try {
        $pdo->exec($sql);
        echo "✅ Works!\n";
        $pdo->exec("DELETE FROM investigators WHERE name LIKE 'Dr.%' LIMIT 1");
    } catch (PDOException $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

if (!empty($regulatory_match[0])) {
    $sql = trim($regulatory_match[0]);
    echo "Company Regulatory INSERT:\n";
    echo substr($sql, 0, 200) . "...\n";
    try {
        $pdo->exec($sql);
        echo "✅ Works!\n";
        $pdo->exec("DELETE FROM company_regulatory LIMIT 1");
    } catch (PDOException $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

