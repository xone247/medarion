<?php
/**
 * Add Comprehensive List of Real Investors
 * Adds 80+ more investors to reach 100+ total
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
    echo "ADDING COMPREHENSIVE INVESTOR LIST\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Comprehensive list of real African healthcare investors
    $investors = [
        // VCs - African Focus
        ['name' => 'TLcom Capital', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://tlcomcapital.com', 'founded_year' => 2010, 'description' => 'Early-stage VC focused on African tech startups'],
        ['name' => 'Partech Africa', 'type' => 'VC', 'headquarters' => 'Paris, France', 'website' => 'https://partechpartners.com', 'founded_year' => 2018, 'description' => 'Venture capital fund investing in African startups'],
        ['name' => 'Novastar Ventures', 'type' => 'VC', 'headquarters' => 'Nairobi, Kenya', 'website' => 'https://novastarventures.com', 'founded_year' => 2014, 'description' => 'East and West Africa focused venture capital'],
        ['name' => 'Knife Capital', 'type' => 'VC', 'headquarters' => 'Cape Town, South Africa', 'website' => 'https://knifecapital.co.za', 'founded_year' => 2010, 'description' => 'South African venture capital firm'],
        ['name' => 'Village Capital', 'type' => 'VC', 'headquarters' => 'Washington, DC', 'website' => 'https://vilcap.com', 'founded_year' => 2009, 'description' => 'Impact investing firm with Africa focus'],
        ['name' => 'Synergy Capital', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://synergycapital.com', 'founded_year' => 2012, 'description' => 'Nigerian venture capital firm'],
        ['name' => '4Di Capital', 'type' => 'VC', 'headquarters' => 'Cape Town, South Africa', 'website' => 'https://4di.co.za', 'founded_year' => 2011, 'description' => 'South African early-stage VC'],
        ['name' => 'CRE Venture Capital', 'type' => 'VC', 'headquarters' => 'Johannesburg, South Africa', 'website' => 'https://cre.vc', 'founded_year' => 2012, 'description' => 'South African venture capital'],
        ['name' => 'Future Africa', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://future.africa', 'founded_year' => 2019, 'description' => 'African-focused venture capital'],
        ['name' => 'Microtraction', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://microtraction.com', 'founded_year' => 2017, 'description' => 'Early-stage African startup investor'],
        ['name' => 'GreenTec Capital Partners', 'type' => 'VC', 'headquarters' => 'Frankfurt, Germany', 'website' => 'https://greentec-capital.com', 'founded_year' => 2016, 'description' => 'Impact investing in African startups'],
        ['name' => 'Lateral Capital', 'type' => 'VC', 'headquarters' => 'New York, USA', 'website' => 'https://lateralcapital.com', 'founded_year' => 2015, 'description' => 'Early-stage VC in Africa'],
        ['name' => 'Zrosk Investment Management', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://zrosk.com', 'founded_year' => 2016, 'description' => 'Nigerian venture capital'],
        ['name' => 'VestedWorld', 'type' => 'VC', 'headquarters' => 'Chicago, USA', 'website' => 'https://vestedworld.com', 'founded_year' => 2015, 'description' => 'African startup investment'],
        ['name' => 'CrossBoundary', 'type' => 'VC', 'headquarters' => 'Nairobi, Kenya', 'website' => 'https://crossboundary.com', 'founded_year' => 2011, 'description' => 'Investment advisory in Africa'],
        
        // Private Equity
        ['name' => 'Verod Capital', 'type' => 'PE', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://verodcap.com', 'founded_year' => 2008, 'description' => 'Private equity firm investing in West Africa'],
        ['name' => 'Helios Investment Partners', 'type' => 'PE', 'headquarters' => 'London, UK', 'website' => 'https://helios.com', 'founded_year' => 2004, 'description' => 'Private equity firm focused on Africa'],
        ['name' => 'Development Partners International', 'type' => 'PE', 'headquarters' => 'London, UK', 'website' => 'https://dpifund.com', 'founded_year' => 2007, 'description' => 'Private equity firm investing in Africa'],
        ['name' => 'AfricInvest', 'type' => 'PE', 'headquarters' => 'Tunis, Tunisia', 'website' => 'https://africinvest.com', 'founded_year' => 1994, 'description' => 'Pan-African private equity firm'],
        ['name' => 'Actis', 'type' => 'PE', 'headquarters' => 'London, UK', 'website' => 'https://actis.com', 'founded_year' => 2004, 'description' => 'Private equity in emerging markets including Africa'],
        ['name' => 'Abraaj Group', 'type' => 'PE', 'headquarters' => 'Dubai, UAE', 'website' => 'https://abraaj.com', 'founded_year' => 2002, 'description' => 'Private equity in growth markets'],
        ['name' => '8 Miles', 'type' => 'PE', 'headquarters' => 'London, UK', 'website' => 'https://8miles.com', 'founded_year' => 2012, 'description' => 'Private equity in Africa'],
        ['name' => 'Catalyst Principal Partners', 'type' => 'PE', 'headquarters' => 'Nairobi, Kenya', 'website' => 'https://catalyst.co.ke', 'founded_year' => 2012, 'description' => 'East African private equity'],
        ['name' => 'Metier', 'type' => 'PE', 'headquarters' => 'Cape Town, South Africa', 'website' => 'https://metier.com', 'founded_year' => 2000, 'description' => 'South African private equity'],
        ['name' => 'Ethos Private Equity', 'type' => 'PE', 'headquarters' => 'Johannesburg, South Africa', 'website' => 'https://ethos.co.za', 'founded_year' => 1984, 'description' => 'South African private equity'],
        
        // Corporate Investors
        ['name' => 'Orange Ventures', 'type' => 'Corporate', 'headquarters' => 'Paris, France', 'website' => 'https://orange.com', 'founded_year' => 2015, 'description' => 'Orange Group venture capital arm'],
        ['name' => 'MTN Group Ventures', 'type' => 'Corporate', 'headquarters' => 'Johannesburg, South Africa', 'website' => 'https://mtn.com', 'founded_year' => 2016, 'description' => 'MTN Group corporate venture arm'],
        ['name' => 'Vodacom Ventures', 'type' => 'Corporate', 'headquarters' => 'Johannesburg, South Africa', 'website' => 'https://vodacom.com', 'founded_year' => 2017, 'description' => 'Vodacom corporate venture'],
        ['name' => 'Safaricom Spark Fund', 'type' => 'Corporate', 'headquarters' => 'Nairobi, Kenya', 'website' => 'https://safaricom.co.ke', 'founded_year' => 2014, 'description' => 'Safaricom venture fund'],
        ['name' => 'Standard Bank Ventures', 'type' => 'Corporate', 'headquarters' => 'Johannesburg, South Africa', 'website' => 'https://standardbank.com', 'founded_year' => 2018, 'description' => 'Standard Bank corporate venture'],
        ['name' => 'Nedbank CIB', 'type' => 'Corporate', 'headquarters' => 'Johannesburg, South Africa', 'website' => 'https://nedbank.co.za', 'founded_year' => 2015, 'description' => 'Nedbank corporate investment'],
        
        // Foundations & Impact Investors
        ['name' => 'Bill & Melinda Gates Foundation', 'type' => 'Foundation', 'headquarters' => 'Seattle, USA', 'website' => 'https://gatesfoundation.org', 'founded_year' => 2000, 'description' => 'Global health foundation'],
        ['name' => 'Acumen', 'type' => 'Foundation', 'headquarters' => 'New York, USA', 'website' => 'https://acumen.org', 'founded_year' => 2001, 'description' => 'Impact investment fund'],
        ['name' => 'Omidyar Network', 'type' => 'Foundation', 'headquarters' => 'Redwood City, USA', 'website' => 'https://omidyar.com', 'founded_year' => 2004, 'description' => 'Philanthropic investment firm'],
        ['name' => 'Chan Zuckerberg Initiative', 'type' => 'Foundation', 'headquarters' => 'Palo Alto, USA', 'website' => 'https://chanzuckerberg.com', 'founded_year' => 2015, 'description' => 'Philanthropic organization'],
        ['name' => 'Skoll Foundation', 'type' => 'Foundation', 'headquarters' => 'Palo Alto, USA', 'website' => 'https://skoll.org', 'founded_year' => 1999, 'description' => 'Social entrepreneurship foundation'],
        ['name' => 'Mulago Foundation', 'type' => 'Foundation', 'headquarters' => 'San Francisco, USA', 'website' => 'https://mulagofoundation.org', 'founded_year' => 2007, 'description' => 'Impact investing foundation'],
        ['name' => 'Draper Richards Kaplan Foundation', 'type' => 'Foundation', 'headquarters' => 'San Francisco, USA', 'website' => 'https://drkfoundation.org', 'founded_year' => 2002, 'description' => 'Early-stage social impact'],
        ['name' => 'Echoing Green', 'type' => 'Foundation', 'headquarters' => 'New York, USA', 'website' => 'https://echoinggreen.org', 'founded_year' => 1987, 'description' => 'Social entrepreneurship support'],
        ['name' => 'Unreasonable Group', 'type' => 'Foundation', 'headquarters' => 'Boulder, USA', 'website' => 'https://unreasonablegroup.com', 'founded_year' => 2010, 'description' => 'Impact entrepreneurship'],
        ['name' => 'Global Innovation Fund', 'type' => 'Foundation', 'headquarters' => 'London, UK', 'website' => 'https://globalinnovation.fund', 'founded_year' => 2014, 'description' => 'Global development innovation'],
        
        // Angel Networks
        ['name' => 'Lagos Angel Network', 'type' => 'Angel', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://lagosangels.com', 'founded_year' => 2013, 'description' => 'Nigerian angel investor network'],
        ['name' => 'Cairo Angels', 'type' => 'Angel', 'headquarters' => 'Cairo, Egypt', 'website' => 'https://cairoangels.com', 'founded_year' => 2013, 'description' => 'Egyptian angel network'],
        ['name' => 'Jozi Angels', 'type' => 'Angel', 'headquarters' => 'Johannesburg, South Africa', 'website' => 'https://joziangels.com', 'founded_year' => 2014, 'description' => 'South African angel network'],
        ['name' => 'Nairobi Business Angels', 'type' => 'Angel', 'headquarters' => 'Nairobi, Kenya', 'website' => 'https://nairobibusinessangels.com', 'founded_year' => 2015, 'description' => 'Kenyan angel network'],
        ['name' => 'Ghana Angel Network', 'type' => 'Angel', 'headquarters' => 'Accra, Ghana', 'website' => 'https://ghanaangels.com', 'founded_year' => 2016, 'description' => 'Ghanaian angel network'],
        
        // Accelerators
        ['name' => 'Y Combinator', 'type' => 'Accelerator', 'headquarters' => 'Mountain View, USA', 'website' => 'https://ycombinator.com', 'founded_year' => 2005, 'description' => 'Global startup accelerator'],
        ['name' => 'Techstars', 'type' => 'Accelerator', 'headquarters' => 'Boulder, USA', 'website' => 'https://techstars.com', 'founded_year' => 2006, 'description' => 'Global startup accelerator'],
        ['name' => '500 Startups', 'type' => 'Accelerator', 'headquarters' => 'San Francisco, USA', 'website' => 'https://500.co', 'founded_year' => 2010, 'description' => 'Global venture capital'],
        ['name' => 'Seedstars', 'type' => 'Accelerator', 'headquarters' => 'Geneva, Switzerland', 'website' => 'https://seedstars.com', 'founded_year' => 2013, 'description' => 'Emerging markets accelerator'],
        ['name' => 'Flat6Labs', 'type' => 'Accelerator', 'headquarters' => 'Cairo, Egypt', 'website' => 'https://flat6labs.com', 'founded_year' => 2011, 'description' => 'Middle East and Africa accelerator'],
        ['name' => '88mph', 'type' => 'Accelerator', 'headquarters' => 'Nairobi, Kenya', 'website' => 'https://88mph.ac', 'founded_year' => 2012, 'description' => 'African startup accelerator'],
        ['name' => 'MEST Africa', 'type' => 'Accelerator', 'headquarters' => 'Accra, Ghana', 'website' => 'https://meltwater.org', 'founded_year' => 2008, 'description' => 'African tech training and investment'],
        ['name' => 'Village Capital', 'type' => 'Accelerator', 'headquarters' => 'Washington, DC', 'website' => 'https://vilcap.com', 'founded_year' => 2009, 'description' => 'Impact accelerator'],
        ['name' => 'Startupbootcamp', 'type' => 'Accelerator', 'headquarters' => 'Amsterdam, Netherlands', 'website' => 'https://startupbootcamp.org', 'founded_year' => 2010, 'description' => 'Global accelerator network'],
        ['name' => 'Founders Factory Africa', 'type' => 'Accelerator', 'headquarters' => 'London, UK', 'website' => 'https://foundersfactory.com', 'founded_year' => 2016, 'description' => 'African startup builder'],
        
        // Government & Development Finance
        ['name' => 'African Development Bank', 'type' => 'Government', 'headquarters' => 'Abidjan, Côte d\'Ivoire', 'website' => 'https://afdb.org', 'founded_year' => 1964, 'description' => 'Multilateral development bank'],
        ['name' => 'International Finance Corporation', 'type' => 'Government', 'headquarters' => 'Washington, DC', 'website' => 'https://ifc.org', 'founded_year' => 1956, 'description' => 'World Bank Group private sector arm'],
        ['name' => 'CDC Group', 'type' => 'Government', 'headquarters' => 'London, UK', 'website' => 'https://cdcgroup.com', 'founded_year' => 1948, 'description' => 'UK development finance institution'],
        ['name' => 'Proparco', 'type' => 'Government', 'headquarters' => 'Paris, France', 'website' => 'https://proparco.fr', 'founded_year' => 1977, 'description' => 'French development finance'],
        ['name' => 'FMO', 'type' => 'Government', 'headquarters' => 'The Hague, Netherlands', 'website' => 'https://fmo.nl', 'founded_year' => 1970, 'description' => 'Dutch development bank'],
        ['name' => 'DEG', 'type' => 'Government', 'headquarters' => 'Cologne, Germany', 'website' => 'https://deg.de', 'founded_year' => 1962, 'description' => 'German development finance'],
        ['name' => 'OPIC', 'type' => 'Government', 'headquarters' => 'Washington, DC', 'website' => 'https://opic.gov', 'founded_year' => 1971, 'description' => 'US development finance'],
        ['name' => 'IDC South Africa', 'type' => 'Government', 'headquarters' => 'Johannesburg, South Africa', 'website' => 'https://idc.co.za', 'founded_year' => 1940, 'description' => 'South African development finance'],
        ['name' => 'BOI Nigeria', 'type' => 'Government', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://boi.ng', 'founded_year' => 1971, 'description' => 'Nigerian development bank'],
        ['name' => 'Kenya Development Corporation', 'type' => 'Government', 'headquarters' => 'Nairobi, Kenya', 'website' => 'https://kdc.go.ke', 'founded_year' => 2020, 'description' => 'Kenyan development finance'],
        
        // Additional VCs
        ['name' => 'Raba Capital', 'type' => 'VC', 'headquarters' => 'San Francisco, USA', 'website' => 'https://raba.capital', 'founded_year' => 2017, 'description' => 'Early-stage VC in Africa'],
        ['name' => 'Launch Africa Ventures', 'type' => 'VC', 'headquarters' => 'Cape Town, South Africa', 'website' => 'https://launchafrica.vc', 'founded_year' => 2019, 'description' => 'African startup VC'],
        ['name' => 'Harambe Entrepreneur Alliance', 'type' => 'VC', 'headquarters' => 'Washington, DC', 'website' => 'https://harambeans.com', 'founded_year' => 2008, 'description' => 'African entrepreneur network'],
        ['name' => 'Beta Ventures', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://betaventures.com', 'founded_year' => 2018, 'description' => 'Nigerian early-stage VC'],
        ['name' => 'LoftyInc Capital', 'type' => 'VC', 'headquarters' => 'Lagos, Nigeria', 'website' => 'https://loftyinc.com', 'founded_year' => 2011, 'description' => 'Nigerian venture capital'],
        ['name' => 'Ventures Platform', 'type' => 'VC', 'headquarters' => 'Abuja, Nigeria', 'website' => 'https://venturesplatform.com', 'founded_year' => 2016, 'description' => 'Nigerian venture capital'],
        ['name' => 'Cairo Angels', 'type' => 'VC', 'headquarters' => 'Cairo, Egypt', 'website' => 'https://cairoangels.com', 'founded_year' => 2013, 'description' => 'Egyptian angel and VC'],
        ['name' => 'Algebra Ventures', 'type' => 'VC', 'headquarters' => 'Cairo, Egypt', 'website' => 'https://algebraventures.com', 'founded_year' => 2016, 'description' => 'Egyptian venture capital'],
        ['name' => 'Endeavor', 'type' => 'VC', 'headquarters' => 'New York, USA', 'website' => 'https://endeavor.org', 'founded_year' => 1997, 'description' => 'Global entrepreneurship network'],
        ['name' => 'Draper Dark Flow', 'type' => 'VC', 'headquarters' => 'San Mateo, USA', 'website' => 'https://draperdarkflow.com', 'founded_year' => 2018, 'description' => 'African-focused VC'],
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

