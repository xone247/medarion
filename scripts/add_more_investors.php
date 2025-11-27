<?php
/**
 * Add more real investors to the database
 * Currently only 1 investor exists, need 100+
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
    echo "ADDING REAL INVESTORS TO DATABASE\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Real African healthcare investors
    $investors = [
        ['name' => 'TLcom Capital', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://tlcomcapital.com', 'founded_year' => 2010, 'description' => 'Early-stage VC focused on African tech startups'],
        ['name' => 'Partech Africa', 'type' => 'VC', 'headquarters' => 'Paris, France', 'website' => 'https://partechpartners.com', 'founded_year' => 2018, 'description' => 'Venture capital fund investing in African startups'],
        ['name' => 'Novastar Ventures', 'type' => 'VC', 'headquarters' => 'Nairobi, Kenya', 'website' => 'https://novastarventures.com', 'founded_year' => 2014, 'description' => 'East and West Africa focused venture capital'],
        ['name' => 'Knife Capital', 'type' => 'VC', 'headquarters' => 'Cape Town, South Africa', 'website' => 'https://knifecapital.co.za', 'founded_year' => 2010, 'description' => 'South African venture capital firm'],
        ['name' => 'Village Capital', 'type' => 'VC', 'headquarters' => 'Washington, DC', 'website' => 'https://vilcap.com', 'founded_year' => 2009, 'description' => 'Impact investing firm with Africa focus'],
        ['name' => 'Verod Capital', 'type' => 'PE', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://verodcap.com', 'founded_year' => 2008, 'description' => 'Private equity firm investing in West Africa'],
        ['name' => 'Helios Investment Partners', 'type' => 'PE', 'headquarters' => 'London, UK', 'website' => 'https://helios.com', 'founded_year' => 2004, 'description' => 'Private equity firm focused on Africa'],
        ['name' => 'Development Partners International', 'type' => 'PE', 'headquarters' => 'London, UK', 'website' => 'https://dpifund.com', 'founded_year' => 2007, 'description' => 'Private equity firm investing in Africa'],
        ['name' => 'Synergy Capital', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://synergycapital.com', 'founded_year' => 2012, 'description' => 'Nigerian venture capital firm'],
        ['name' => 'AfricInvest', 'type' => 'PE', 'headquarters' => 'Tunis, Tunisia', 'website' => 'https://africinvest.com', 'founded_year' => 1994, 'description' => 'Pan-African private equity firm'],
        ['name' => '4Di Capital', 'type' => 'VC', 'headquarters' => 'Cape Town, South Africa', 'website' => 'https://4di.co.za', 'founded_year' => 2011, 'description' => 'South African early-stage VC'],
        ['name' => 'CRE Venture Capital', 'type' => 'VC', 'headquarters' => 'Johannesburg, South Africa', 'website' => 'https://cre.vc', 'founded_year' => 2012, 'description' => 'South African venture capital'],
        ['name' => 'Future Africa', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://future.africa', 'founded_year' => 2019, 'description' => 'African-focused venture capital'],
        ['name' => 'Microtraction', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://microtraction.com', 'founded_year' => 2017, 'description' => 'Early-stage African startup investor'],
        ['name' => 'GreenTec Capital Partners', 'type' => 'VC', 'headquarters' => 'Frankfurt, Germany', 'website' => 'https://greentec-capital.com', 'founded_year' => 2016, 'description' => 'Impact investing in African startups'],
        ['name' => 'Orange Ventures', 'type' => 'Corporate', 'headquarters' => 'Paris, France', 'website' => 'https://orange.com', 'founded_year' => 2015, 'description' => 'Orange Group venture capital arm'],
        ['name' => 'Bill & Melinda Gates Foundation', 'type' => 'Foundation', 'headquarters' => 'Seattle, USA', 'website' => 'https://gatesfoundation.org', 'founded_year' => 2000, 'description' => 'Global health foundation'],
        ['name' => 'Acumen', 'type' => 'Foundation', 'headquarters' => 'New York, USA', 'website' => 'https://acumen.org', 'founded_year' => 2001, 'description' => 'Impact investment fund'],
        ['name' => 'Omidyar Network', 'type' => 'Foundation', 'headquarters' => 'Redwood City, USA', 'website' => 'https://omidyar.com', 'founded_year' => 2004, 'description' => 'Philanthropic investment firm'],
        ['name' => 'Chan Zuckerberg Initiative', 'type' => 'Foundation', 'headquarters' => 'Palo Alto, USA', 'website' => 'https://chanzuckerberg.com', 'founded_year' => 2015, 'description' => 'Philanthropic organization'],
    ];
    
    echo "Adding " . count($investors) . " investors...\n\n";
    
    $added = 0;
    $skipped = 0;
    
    $stmt = $pdo->prepare("
        INSERT INTO investors (name, type, headquarters, website, founded_year, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE 
            type = VALUES(type),
            headquarters = VALUES(headquarters),
            website = VALUES(website),
            founded_year = VALUES(founded_year),
            description = VALUES(description)
    ");
    
    foreach ($investors as $investor) {
        try {
            $stmt->execute([
                $investor['name'],
                $investor['type'],
                $investor['headquarters'],
                $investor['website'],
                $investor['founded_year'],
                $investor['description']
            ]);
            echo "  ✓ {$investor['name']}\n";
            $added++;
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                echo "  ⊙ {$investor['name']} (already exists)\n";
                $skipped++;
            } else {
                echo "  ✗ {$investor['name']}: {$e->getMessage()}\n";
            }
        }
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "COMPLETE\n";
    echo str_repeat("=", 60) . "\n";
    echo "Added: {$added}\n";
    echo "Skipped: {$skipped}\n";
    
    // Verify count
    $countStmt = $pdo->query("SELECT COUNT(*) as total FROM investors");
    $count = $countStmt->fetch(PDO::FETCH_ASSOC);
    echo "Total investors in database: {$count['total']}\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

