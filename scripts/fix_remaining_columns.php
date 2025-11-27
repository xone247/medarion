<?php
/**
 * Fix remaining column mismatches
 */
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "Fixing remaining column mismatches...\n\n";

// Fix public_stocks - add country
try {
    $pdo->exec("ALTER TABLE public_stocks ADD COLUMN country VARCHAR(50) AFTER currency");
    echo "✅ Added country to public_stocks\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  public_stocks country: " . $e->getMessage() . "\n";
    }
}

// Fix clinical_centers - add is_active
try {
    $pdo->exec("ALTER TABLE clinical_centers ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
    echo "✅ Added is_active to clinical_centers\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  clinical_centers is_active: " . $e->getMessage() . "\n";
    }
}

// Fix investigators - add institution (or map affiliation)
try {
    $pdo->exec("ALTER TABLE investigators ADD COLUMN institution VARCHAR(100) AFTER title");
    echo "✅ Added institution to investigators\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  investigators institution: " . $e->getMessage() . "\n";
    }
}

// Fix company_regulatory - add product_name (or map product)
try {
    $pdo->exec("ALTER TABLE company_regulatory ADD COLUMN product_name VARCHAR(100) AFTER regulatory_body_id");
    echo "✅ Added product_name to company_regulatory\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  company_regulatory product_name: " . $e->getMessage() . "\n";
    }
}

echo "\n✅ Column fixes complete!\n";

