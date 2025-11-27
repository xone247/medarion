<?php
/**
 * Create missing tables before seeding
 */
$pdo = new PDO(
    "mysql:host=localhost;dbname=medarion_platform;charset=utf8mb4",
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// Create africa_countries table
$sql = "
CREATE TABLE IF NOT EXISTS africa_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    capital VARCHAR(100) NOT NULL,
    currency VARCHAR(100) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    flag VARCHAR(10) NOT NULL,
    population BIGINT NOT NULL,
    languages JSON NOT NULL,
    gdp DECIMAL(20, 2) NOT NULL,
    gdp_per_capita DECIMAL(15, 2) NOT NULL,
    area DECIMAL(15, 2) NOT NULL,
    iso_code VARCHAR(2) NOT NULL UNIQUE,
    longitude DECIMAL(10, 6) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_iso_code (iso_code),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

$pdo->exec($sql);
echo "✅ Created africa_countries table\n";

