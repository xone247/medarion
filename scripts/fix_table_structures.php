<?php
/**
 * Fix table structures to match seed file
 */
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "Fixing table structures to match seed file...\n\n";

// Fix regulatory_bodies - add is_active, rename acronym to abbreviation
try {
    $pdo->exec("ALTER TABLE regulatory_bodies ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER description");
    echo "✅ Added is_active to regulatory_bodies\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  regulatory_bodies is_active: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec("ALTER TABLE regulatory_bodies CHANGE COLUMN acronym abbreviation VARCHAR(20)");
    echo "✅ Renamed acronym to abbreviation in regulatory_bodies\n";
} catch (PDOException $e) {
    echo "⚠️  regulatory_bodies abbreviation: " . $e->getMessage() . "\n";
}

// Fix public_stocks - add sector
try {
    $pdo->exec("ALTER TABLE public_stocks ADD COLUMN sector VARCHAR(50) AFTER currency");
    echo "✅ Added sector to public_stocks\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  public_stocks sector: " . $e->getMessage() . "\n";
    }
}

// Fix clinical_centers - add description
try {
    $pdo->exec("ALTER TABLE clinical_centers ADD COLUMN description TEXT AFTER address");
    echo "✅ Added description to clinical_centers\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  clinical_centers description: " . $e->getMessage() . "\n";
    }
}

// Fix investigators - add name column (or we'll need to map first_name + last_name)
try {
    $pdo->exec("ALTER TABLE investigators ADD COLUMN name VARCHAR(100) AFTER id");
    echo "✅ Added name to investigators\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  investigators name: " . $e->getMessage() . "\n";
    }
}

// Fix nation_pulse_data - rename indicator_type to data_type
try {
    $pdo->exec("ALTER TABLE nation_pulse_data CHANGE COLUMN indicator_type data_type ENUM('population', 'healthcare_infrastructure', 'economic_indicators', 'disease_immunization') NOT NULL");
    echo "✅ Renamed indicator_type to data_type in nation_pulse_data\n";
} catch (PDOException $e) {
    // Try adding if rename fails
    try {
        $pdo->exec("ALTER TABLE nation_pulse_data ADD COLUMN data_type ENUM('population', 'healthcare_infrastructure', 'economic_indicators', 'disease_immunization') NOT NULL AFTER country");
        echo "✅ Added data_type to nation_pulse_data\n";
    } catch (PDOException $e2) {
        echo "⚠️  nation_pulse_data data_type: " . $e2->getMessage() . "\n";
    }
}

// Fix nation_pulse_data - rename indicator_name to metric_name, value to metric_value
try {
    $pdo->exec("ALTER TABLE nation_pulse_data CHANGE COLUMN indicator_name metric_name VARCHAR(100) NOT NULL");
    echo "✅ Renamed indicator_name to metric_name\n";
} catch (PDOException $e) {
    echo "⚠️  metric_name: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE nation_pulse_data CHANGE COLUMN value metric_value DECIMAL(15,4)");
    echo "✅ Renamed value to metric_value\n";
} catch (PDOException $e) {
    echo "⚠️  metric_value: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE nation_pulse_data CHANGE COLUMN unit metric_unit VARCHAR(50)");
    echo "✅ Renamed unit to metric_unit\n";
} catch (PDOException $e) {
    echo "⚠️  metric_unit: " . $e->getMessage() . "\n";
}

// Fix company_regulatory - add regulatory_body_id
try {
    $pdo->exec("ALTER TABLE company_regulatory ADD COLUMN regulatory_body_id INT AFTER company_id");
    echo "✅ Added regulatory_body_id to company_regulatory\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') === false) {
        echo "⚠️  company_regulatory regulatory_body_id: " . $e->getMessage() . "\n";
    }
}

echo "\n✅ Table structure fixes complete!\n";

