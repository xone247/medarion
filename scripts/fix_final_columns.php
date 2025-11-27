<?php
/**
 * Fix final column mismatches
 */
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "Fixing final column mismatches...\n\n";

// Fix clinical_centers - add specialties (or map specializations)
try {
    $pdo->exec("ALTER TABLE clinical_centers ADD COLUMN specialties JSON DEFAULT NULL AFTER description");
    echo "✅ Added specialties to clinical_centers\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  clinical_centers specialties: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec("ALTER TABLE clinical_centers ADD COLUMN phases_supported JSON DEFAULT NULL AFTER specialties");
    echo "✅ Added phases_supported to clinical_centers\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  clinical_centers phases_supported: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec("ALTER TABLE clinical_centers ADD COLUMN capacity_patients INT AFTER phases_supported");
    echo "✅ Added capacity_patients to clinical_centers\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  clinical_centers capacity_patients: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec("ALTER TABLE clinical_centers ADD COLUMN established_year INT AFTER capacity_patients");
    echo "✅ Added established_year to clinical_centers\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  clinical_centers established_year: " . $e->getMessage() . "\n";
    }
}

// Fix investigators - add specialties (plural), therapeutic_areas, education, certifications
try {
    $pdo->exec("ALTER TABLE investigators ADD COLUMN specialties JSON DEFAULT NULL AFTER phone");
    echo "✅ Added specialties to investigators\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  investigators specialties: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec("ALTER TABLE investigators ADD COLUMN therapeutic_areas JSON DEFAULT NULL AFTER specialties");
    echo "✅ Added therapeutic_areas to investigators\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  investigators therapeutic_areas: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec("ALTER TABLE investigators ADD COLUMN experience_years INT AFTER therapeutic_areas");
    echo "✅ Added experience_years to investigators\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  investigators experience_years: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec("ALTER TABLE investigators ADD COLUMN education JSON DEFAULT NULL AFTER experience_years");
    echo "✅ Added education to investigators\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  investigators education: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec("ALTER TABLE investigators ADD COLUMN certifications JSON DEFAULT NULL AFTER education");
    echo "✅ Added certifications to investigators\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  investigators certifications: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec("ALTER TABLE investigators ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
    echo "✅ Added is_active to investigators\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  investigators is_active: " . $e->getMessage() . "\n";
    }
}

// Fix company_regulatory - add application_date
try {
    $pdo->exec("ALTER TABLE company_regulatory ADD COLUMN application_date DATE AFTER status");
    echo "✅ Added application_date to company_regulatory\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  company_regulatory application_date: " . $e->getMessage() . "\n";
    }
}

echo "\n✅ Final column fixes complete!\n";

