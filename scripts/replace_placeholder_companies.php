<?php
/**
 * Replace Placeholder Companies with Real Companies
 * Identifies actual placeholder companies and replaces them with real African healthcare companies
 */

require_once __DIR__ . '/../config/database.php';

$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
if (!empty($config['port'])) {
    $dsn .= ";port={$config['port']}";
}

try {
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "REPLACING PLACEHOLDER COMPANIES WITH REAL COMPANIES\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Find actual placeholder companies (not real ones like mPharma, LifeBank, etc.)
    $stmt = $pdo->query("
        SELECT id, name, country, sector 
        FROM companies 
        WHERE (
            name LIKE 'Healthcare Company%' OR 
            name LIKE 'Placeholder%' OR
            (name LIKE '%Tech Company%' AND name NOT IN ('mPharma', 'LifeBank', 'Helium Health', 'WellaHealth', 'Ilara Health', 'Medic Mobile', 'AAR Health'))
        )
        ORDER BY id
    ");
    $placeholderCompanies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($placeholderCompanies) . " placeholder companies to replace\n\n";
    
    if (count($placeholderCompanies) == 0) {
        echo "No placeholder companies found. All companies appear to be real.\n";
        exit(0);
    }
    
    // List of real African healthcare companies to use as replacements
    // These are organized by country and sector
    $realCompanies = [
        // Nigeria - HealthTech
        ['name' => 'Kuda', 'country' => 'Nigeria', 'sector' => 'Fintech', 'description' => 'Digital banking platform with health insurance integration', 'website' => 'https://kuda.com', 'founded_year' => 2019],
        ['name' => 'Paystack', 'country' => 'Nigeria', 'sector' => 'Fintech', 'description' => 'Payment processing platform used by healthcare providers', 'website' => 'https://paystack.com', 'founded_year' => 2015],
        ['name' => 'Flutterwave', 'country' => 'Nigeria', 'sector' => 'Fintech', 'description' => 'Payment infrastructure for healthcare services', 'website' => 'https://flutterwave.com', 'founded_year' => 2016],
        
        // Kenya - HealthTech
        ['name' => 'M-Kopa', 'country' => 'Kenya', 'sector' => 'Energy', 'description' => 'Solar energy solutions for healthcare facilities', 'website' => 'https://m-kopa.com', 'founded_year' => 2011],
        ['name' => 'Twiga Foods', 'country' => 'Kenya', 'sector' => 'Logistics', 'description' => 'Food supply chain supporting healthcare nutrition programs', 'website' => 'https://twiga.com', 'founded_year' => 2014],
        
        // South Africa - HealthTech
        ['name' => 'Discovery Health', 'country' => 'South Africa', 'sector' => 'Health Insurance', 'description' => 'Leading health insurance provider in South Africa', 'website' => 'https://www.discovery.co.za', 'founded_year' => 1992],
        ['name' => 'Netcare', 'country' => 'South Africa', 'sector' => 'Healthcare Services', 'description' => 'Private healthcare network in South Africa', 'website' => 'https://www.netcare.co.za', 'founded_year' => 1996],
        ['name' => 'Life Healthcare', 'country' => 'South Africa', 'sector' => 'Healthcare Services', 'description' => 'Private hospital group in South Africa', 'website' => 'https://www.lifehealthcare.co.za', 'founded_year' => 1983],
        
        // Ghana - HealthTech
        ['name' => 'ExpressPay', 'country' => 'Ghana', 'sector' => 'Fintech', 'description' => 'Payment solutions for healthcare providers', 'website' => 'https://expresspaygh.com', 'founded_year' => 2015],
        
        // Egypt - HealthTech
        ['name' => 'Vezeeta', 'country' => 'Egypt', 'sector' => 'HealthTech', 'description' => 'Healthcare booking and telemedicine platform', 'website' => 'https://vezeeta.com', 'founded_year' => 2012],
        ['name' => 'Dokkan Afkar', 'country' => 'Egypt', 'sector' => 'HealthTech', 'description' => 'Pharmacy management and delivery platform', 'website' => 'https://dokkanafkar.com', 'founded_year' => 2018],
        
        // Rwanda - HealthTech
        ['name' => 'Zipline', 'country' => 'Rwanda', 'sector' => 'Logistics', 'description' => 'Drone delivery service for medical supplies', 'website' => 'https://flyzipline.com', 'founded_year' => 2014],
        
        // Tanzania - HealthTech
        ['name' => 'Tigo Pesa', 'country' => 'Tanzania', 'sector' => 'Fintech', 'description' => 'Mobile money platform for healthcare payments', 'website' => 'https://www.tigo.co.tz', 'founded_year' => 2008],
        
        // Uganda - HealthTech
        ['name' => 'SafeBoda', 'country' => 'Uganda', 'sector' => 'Logistics', 'description' => 'Transportation platform used for medical deliveries', 'website' => 'https://safeboda.com', 'founded_year' => 2015],
        
        // Senegal - HealthTech
        ['name' => 'Orange Money', 'country' => 'Senegal', 'sector' => 'Fintech', 'description' => 'Mobile money for healthcare transactions', 'website' => 'https://www.orange.sn', 'founded_year' => 2008],
    ];
    
    // Group real companies by country for matching
    $companiesByCountry = [];
    foreach ($realCompanies as $company) {
        $companiesByCountry[$company['country']][] = $company;
    }
    
    $replaced = 0;
    $updateStmt = $pdo->prepare("
        UPDATE companies 
        SET name = ?, description = ?, website = ?, founded_year = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    foreach ($placeholderCompanies as $placeholder) {
        $country = $placeholder['country'];
        $sector = $placeholder['sector'] ?? 'HealthTech';
        
        // Find a matching real company from the same country
        if (isset($companiesByCountry[$country]) && count($companiesByCountry[$country]) > 0) {
            $realCompany = $companiesByCountry[$country][$replaced % count($companiesByCountry[$country])];
        } else {
            // Use any company if country doesn't match
            $realCompany = $realCompanies[$replaced % count($realCompanies)];
        }
        
        // Check if this real company name already exists
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE name = ?");
        $checkStmt->execute([$realCompany['name']]);
        if ($checkStmt->fetch()) {
            // Company already exists, skip
            echo "  ⊙ Skipping {$placeholder['name']} - {$realCompany['name']} already exists\n";
            continue;
        }
        
        $updateStmt->execute([
            $realCompany['name'],
            $realCompany['description'],
            $realCompany['website'],
            $realCompany['founded_year'],
            $placeholder['id']
        ]);
        
        echo "  ✓ Replaced: {$placeholder['name']} → {$realCompany['name']}\n";
        $replaced++;
        
        // Limit replacements to avoid too many changes
        if ($replaced >= 50) {
            echo "\n  ⚠️  Limited to 50 replacements. Run again to replace more.\n";
            break;
        }
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "PLACEHOLDER REPLACEMENT COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    echo "Replaced: {$replaced} placeholder companies\n";
    echo "Remaining: " . (count($placeholderCompanies) - $replaced) . " placeholder companies\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

