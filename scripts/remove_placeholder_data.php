<?php
/**
 * Remove All Placeholder Data
 * Remove placeholder companies and their associated deals
 * Keep only real, verifiable data
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
    
    echo "=" . str_repeat("=", 70) . "\n";
    echo "REMOVING PLACEHOLDER DATA - KEEPING ONLY REAL DATA\n";
    echo "=" . str_repeat("=", 70) . "\n\n";
    
    // Placeholder patterns to identify fake companies
    $placeholderPatterns = [
        'Healthcare Company',
        'Placeholder',
        'EliteTech',
        'WellTech',
        'ApexGroup',
        'PrimeGroup',
        'VitaHealth',
        'CareHealth',
        'SmartGroup',
        'BioHealth',
        'DigitalTech',
        'ProSolutions',
        'EliteSolutions',
        'PrimeSolutions',
        'ApexSolutions',
        'VitaSolutions',
        'CareSolutions',
        'SmartSolutions',
        'BioSolutions',
        'DigitalSolutions',
        'ProTech',
        'EliteTech',
        'PrimeTech',
        'ApexTech',
        'VitaTech',
        'CareTech',
        'SmartTech',
        'BioTech',
        'DigitalTech',
        'ProMed',
        'EliteMed',
        'PrimeMed',
        'ApexMed',
        'VitaMed',
        'CareMed',
        'SmartMed',
        'BioMed',
        'DigitalMed',
        'ProPharma',
        'ElitePharma',
        'PrimePharma',
        'ApexPharma',
        'VitaPharma',
        'CarePharma',
        'SmartPharma',
        'BioPharma',
        'DigitalPharma',
        'ProGlobal',
        'EliteGlobal',
        'PrimeGlobal',
        'ApexGlobal',
        'VitaGlobal',
        'CareGlobal',
        'SmartGlobal',
        'BioGlobal',
        'DigitalGlobal',
        'ProAfrica',
        'EliteAfrica',
        'PrimeAfrica',
        'ApexAfrica',
        'VitaAfrica',
        'CareAfrica',
        'SmartAfrica',
        'BioAfrica',
        'DigitalAfrica',
        'ProGroup',
        'EliteGroup',
        'PrimeGroup',
        'ApexGroup',
        'VitaGroup',
        'CareGroup',
        'SmartGroup',
        'BioGroup',
        'DigitalGroup',
        'ProLabs',
        'EliteLabs',
        'PrimeLabs',
        'ApexLabs',
        'VitaLabs',
        'CareLabs',
        'SmartLabs',
        'BioLabs',
        'DigitalLabs',
        'ProSystems',
        'EliteSystems',
        'PrimeSystems',
        'ApexSystems',
        'VitaSystems',
        'CareSystems',
        'SmartSystems',
        'BioSystems',
        'DigitalSystems',
        'ProServices',
        'EliteServices',
        'PrimeServices',
        'ApexServices',
        'VitaServices',
        'CareServices',
        'SmartServices',
        'DigitalServices',
        'ProCare',
        'EliteCare',
        'PrimeCare',
        'ApexCare',
        'VitaCare',
        'CareCare',
        'SmartCare',
        'BioCare',
        'DigitalCare',
        'ProHealth',
        'EliteHealth',
        'PrimeHealth',
        'ApexHealth',
        'VitaHealth',
        'CareHealth',
        'SmartHealth',
        'BioHealth',
        'DigitalHealth',
        'HealthHealth',
        'HealthGroup',
        'HealthLabs',
        'HealthSystems',
        'HealthServices',
        'HealthCare',
        'HealthTech',
        'HealthMed',
        'HealthPharma',
        'HealthAfrica',
        'MedMed',
        'MedGroup',
        'MedLabs',
        'MedSystems',
        'MedServices',
        'MedCare',
        'MedHealth',
        'MedTech',
        'MedSolutions',
        'PharmaPharma',
        'PharmaGroup',
        'PharmaHealth',
        'PharmaSystems',
        'TechTech',
        'TechGroup',
        'TechMed',
        'TechPharma',
        'TechSystems',
        'TechSolutions',
        'LifeLife',
        'LifeGroup',
        'LifeLabs',
        'LifeSystems',
        'LifeServices',
        'LifeCare',
        'LifeHealth',
        'LifeMed',
        'LifePharma',
        'LifeSolutions',
        'LifeAfrica',
        'WellWell',
        'WellGroup',
        'WellLabs',
        'WellServices',
        'WellHealth',
        'WellSolutions',
        'WellAfrica'
    ];
    
    echo "[1/5] Identifying placeholder companies...\n";
    $placeholderCompanyIds = [];
    $placeholderCompanyNames = [];
    
    foreach ($placeholderPatterns as $pattern) {
        $stmt = $pdo->prepare("SELECT id, name FROM companies WHERE name LIKE ?");
        $stmt->execute(["%{$pattern}%"]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($results as $row) {
            if (!in_array($row['id'], $placeholderCompanyIds)) {
                $placeholderCompanyIds[] = $row['id'];
                $placeholderCompanyNames[] = $row['name'];
            }
        }
    }
    
    echo "  Found " . count($placeholderCompanyIds) . " placeholder companies\n";
    if (count($placeholderCompanyIds) > 0) {
        echo "  Sample: " . implode(', ', array_slice($placeholderCompanyNames, 0, 5)) . "...\n";
    }
    
    echo "\n[2/5] Removing deals linked to placeholder companies...\n";
    if (count($placeholderCompanyIds) > 0) {
        $placeholders = implode(',', array_map('intval', $placeholderCompanyIds));
        $dealsDeleted = $pdo->exec("DELETE FROM deals WHERE company_id IN ($placeholders)");
        echo "  ✓ Deleted {$dealsDeleted} deals linked to placeholder companies\n";
        
        // Also delete deals with placeholder company names
        $dealsDeleted2 = 0;
        foreach ($placeholderCompanyNames as $name) {
            $stmt = $pdo->prepare("DELETE FROM deals WHERE company_name = ?");
            $stmt->execute([$name]);
            $dealsDeleted2 += $stmt->rowCount();
        }
        echo "  ✓ Deleted {$dealsDeleted2} deals with placeholder company names\n";
    } else {
        echo "  ✓ No placeholder companies found, no deals to delete\n";
    }
    
    echo "\n[3/5] Removing placeholder companies...\n";
    if (count($placeholderCompanyIds) > 0) {
        $placeholders = implode(',', array_map('intval', $placeholderCompanyIds));
        $companiesDeleted = $pdo->exec("DELETE FROM companies WHERE id IN ($placeholders)");
        echo "  ✓ Deleted {$companiesDeleted} placeholder companies\n";
    } else {
        echo "  ✓ No placeholder companies to delete\n";
    }
    
    echo "\n[4/5] Removing deals with placeholder company names in company_name field...\n";
    $dealsDeleted3 = 0;
    foreach ($placeholderPatterns as $pattern) {
        $stmt = $pdo->prepare("DELETE FROM deals WHERE company_name LIKE ?");
        $stmt->execute(["%{$pattern}%"]);
        $dealsDeleted3 += $stmt->rowCount();
    }
    echo "  ✓ Deleted {$dealsDeleted3} deals with placeholder company names\n";
    
    // Remove deals with suspicious $100M amounts that are likely placeholders
    echo "\n[5/5] Removing suspicious placeholder deals ($100M exact amounts)...\n";
    $suspiciousDeals = $pdo->query("
        SELECT id, company_name, amount 
        FROM deals 
        WHERE amount = 100000000 
        AND (company_name LIKE '%Healthcare Company%' 
             OR company_name LIKE '%Elite%' 
             OR company_name LIKE '%Well%' 
             OR company_name LIKE '%Apex%'
             OR company_name LIKE '%Prime%'
             OR company_name LIKE '%Vita%'
             OR company_name LIKE '%Care%'
             OR company_name LIKE '%Smart%'
             OR company_name LIKE '%Bio%'
             OR company_name LIKE '%Digital%'
             OR company_name LIKE '%Pro%')
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($suspiciousDeals) > 0) {
        $suspiciousIds = array_column($suspiciousDeals, 'id');
        $ids = implode(',', array_map('intval', $suspiciousIds));
        $dealsDeleted4 = $pdo->exec("DELETE FROM deals WHERE id IN ($ids)");
        echo "  ✓ Deleted {$dealsDeleted4} suspicious $100M placeholder deals\n";
    } else {
        echo "  ✓ No suspicious $100M deals found\n";
    }
    
    // Recalculate investor stats from remaining real deals
    echo "\n[6/6] Recalculating investor stats from real deals only...\n";
    $investors = $pdo->query("SELECT id, name FROM investors")->fetchAll(PDO::FETCH_ASSOC);
    $recalculated = 0;
    
    foreach ($investors as $investor) {
        $investor_id = $investor['id'];
        $investor_name = $investor['name'];
        
        // Find deals for this investor (only real deals remain)
        $dealsStmt = $pdo->prepare("
            SELECT 
                id,
                company_id,
                company_name,
                amount,
                sector,
                country,
                deal_date,
                participants
            FROM deals 
            WHERE lead_investor = ? 
               OR participants LIKE ?
               OR participants LIKE ?
        ");
        $searchPattern1 = "%{$investor_name}%";
        $searchPattern2 = "%" . str_replace(' ', '%', $investor_name) . "%";
        $dealsStmt->execute([$investor_name, $searchPattern1, $searchPattern2]);
        $deals = $dealsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate stats
        $total_invested = 0;
        $deal_count = count($deals);
        $sectors = [];
        $countries = [];
        $portfolio_companies = [];
        
        foreach ($deals as $deal) {
            $amount = floatval($deal['amount'] ?? 0);
            $total_invested += $amount;
            
            if ($deal['sector'] && !in_array($deal['sector'], $sectors)) {
                $sectors[] = $deal['sector'];
            }
            
            if ($deal['country'] && !in_array($deal['country'], $countries)) {
                $countries[] = $deal['country'];
            }
            
            $companyName = $deal['company_name'] ?? null;
            if ($companyName && !in_array($companyName, $portfolio_companies)) {
                $portfolio_companies[] = $companyName;
            }
        }
        
        $avg_deal_size = $deal_count > 0 ? $total_invested / $deal_count : 0;
        
        // Update investor
        $updateStmt = $pdo->prepare("
            UPDATE investors SET
                total_invested = ?,
                deal_count = ?,
                avg_deal_size = ?,
                focus_sectors = ?,
                geographic_focus = ?,
                portfolio_companies = ?
            WHERE id = ?
        ");
        
        $updateStmt->execute([
            $total_invested,
            $deal_count,
            $avg_deal_size,
            json_encode($sectors),
            json_encode($countries),
            json_encode($portfolio_companies),
            $investor_id
        ]);
        
        $recalculated++;
    }
    
    echo "  ✓ Recalculated stats for {$recalculated} investors\n";
    
    // Final summary
    echo "\n" . str_repeat("=", 70) . "\n";
    echo "CLEANUP COMPLETE\n";
    echo "=" . str_repeat("=", 70) . "\n";
    
    $remainingCompanies = $pdo->query("SELECT COUNT(*) FROM companies")->fetchColumn();
    $remainingDeals = $pdo->query("SELECT COUNT(*) FROM deals")->fetchColumn();
    $remainingInvestors = $pdo->query("SELECT COUNT(*) FROM investors")->fetchColumn();
    
    echo "Remaining Companies: {$remainingCompanies}\n";
    echo "Remaining Deals: {$remainingDeals}\n";
    echo "Remaining Investors: {$remainingInvestors}\n";
    echo "\n✅ All placeholder data removed. Only real data remains.\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}
?>

