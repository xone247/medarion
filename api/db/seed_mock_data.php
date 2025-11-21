<?php
/**
 * Seed Mock Data for Modules
 * This script seeds mock data into the database for testing purposes
 */

require_once __DIR__ . '/../../config/database.php';

$config = require __DIR__ . '/../../config/database.php';
$pdo = new PDO(
    "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
    $config['username'],
    $config['password'],
    $config['options'] ?? []
);

header('Content-Type: application/json');

try {
    $pdo->beginTransaction();
    
    // Seed Companies (if empty)
    $companyCount = $pdo->query("SELECT COUNT(*) FROM companies")->fetchColumn();
    if ($companyCount == 0) {
        $companies = [
            ['name' => 'mPharma', 'description' => 'Pharmaceutical supply chain management', 'website' => 'https://mpharma.com', 'industry' => 'Pharmaceuticals', 'stage' => 'Series B', 'founded_year' => 2013, 'employees_count' => 150, 'headquarters' => 'Accra, Ghana', 'funding_stage' => 'Series B', 'total_funding' => 35000000],
            ['name' => '54gene', 'description' => 'African genomics research', 'website' => 'https://54gene.com', 'industry' => 'Biotechnology', 'stage' => 'Series A', 'founded_year' => 2019, 'employees_count' => 120, 'headquarters' => 'Lagos, Nigeria', 'funding_stage' => 'Series A', 'total_funding' => 25000000],
            ['name' => 'AfyaConnect', 'description' => 'Healthcare connectivity platform', 'website' => 'https://afyaconnect.co.ke', 'industry' => 'Health Tech', 'stage' => 'Seed', 'founded_year' => 2020, 'employees_count' => 45, 'headquarters' => 'Nairobi, Kenya', 'funding_stage' => 'Seed', 'total_funding' => 13200000],
            ['name' => 'HearX Group', 'description' => 'Hearing healthcare solutions', 'website' => 'https://hearxgroup.com', 'industry' => 'Medical Devices', 'stage' => 'Series A', 'founded_year' => 2015, 'employees_count' => 80, 'headquarters' => 'Cape Town, South Africa', 'funding_stage' => 'Series A', 'total_funding' => 8300000],
            ['name' => 'RxChain', 'description' => 'Blockchain-based pharmaceutical tracking', 'website' => 'https://rxchain.ng', 'industry' => 'Health Tech', 'stage' => 'Seed', 'founded_year' => 2021, 'employees_count' => 25, 'headquarters' => 'Abuja, Nigeria', 'funding_stage' => 'Seed', 'total_funding' => 5500000],
        ];
        
        $stmt = $pdo->prepare("INSERT INTO companies (name, description, website, industry, stage, founded_year, employees_count, headquarters, funding_stage, total_funding, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        foreach ($companies as $company) {
            $stmt->execute([
                $company['name'],
                $company['description'],
                $company['website'],
                $company['industry'],
                $company['stage'],
                $company['founded_year'],
                $company['employees_count'],
                $company['headquarters'],
                $company['funding_stage'],
                $company['total_funding']
            ]);
        }
        echo "Seeded " . count($companies) . " companies\n";
    }
    
    // Seed Deals (if empty)
    $dealCount = $pdo->query("SELECT COUNT(*) FROM deals")->fetchColumn();
    if ($dealCount == 0) {
        $deals = [
            ['company_id' => 1, 'deal_type' => 'Series B', 'amount' => 25000000, 'deal_date' => '2024-01-15', 'lead_investor' => 'Global Health Ventures', 'status' => 'Closed', 'sector' => 'Pharmaceuticals'],
            ['company_id' => 2, 'deal_type' => 'Series A', 'amount' => 15000000, 'deal_date' => '2024-03-20', 'lead_investor' => 'TLcom Capital', 'status' => 'Closed', 'sector' => 'Biotechnology'],
            ['company_id' => 3, 'deal_type' => 'Seed', 'amount' => 3200000, 'deal_date' => '2024-05-10', 'lead_investor' => 'Kepple Africa Ventures', 'status' => 'Closed', 'sector' => 'Health Tech'],
        ];
        
        $stmt = $pdo->prepare("INSERT INTO deals (company_id, deal_type, amount, deal_date, lead_investor, status, sector, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        foreach ($deals as $deal) {
            $stmt->execute([
                $deal['company_id'],
                $deal['deal_type'],
                $deal['amount'],
                $deal['deal_date'],
                $deal['lead_investor'],
                $deal['status'],
                $deal['sector']
            ]);
        }
        echo "Seeded " . count($deals) . " deals\n";
    }
    
    // Seed Grants (if empty)
    $grantCount = $pdo->query("SELECT COUNT(*) FROM grants")->fetchColumn();
    if ($grantCount == 0) {
        $grants = [
            ['title' => 'African Health Innovation Grant', 'funding_agency' => 'WHO', 'amount' => 500000, 'grant_type' => 'Research', 'status' => 'Open', 'application_deadline' => '2024-12-31', 'funders' => json_encode(['WHO', 'Gates Foundation'])],
            ['title' => 'Digital Health Startup Support', 'funding_agency' => 'African Development Bank', 'amount' => 750000, 'grant_type' => 'Development', 'status' => 'Open', 'application_deadline' => '2024-11-30', 'funders' => json_encode(['ADB'])],
        ];
        
        $stmt = $pdo->prepare("INSERT INTO grants (title, funding_agency, amount, grant_type, status, application_deadline, funders, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        foreach ($grants as $grant) {
            $stmt->execute([
                $grant['title'],
                $grant['funding_agency'],
                $grant['amount'],
                $grant['grant_type'],
                $grant['status'],
                $grant['application_deadline'],
                $grant['funders']
            ]);
        }
        echo "Seeded " . count($grants) . " grants\n";
    }
    
    // Seed Investors (if empty)
    $investorCount = $pdo->query("SELECT COUNT(*) FROM investors")->fetchColumn();
    if ($investorCount == 0) {
        $investors = [
            ['name' => 'TLcom Capital', 'type' => 'VC Firm', 'focus_sectors' => json_encode(['Health Tech', 'Biotech']), 'aum' => 150000000, 'stage_focus' => 'Series A-B', 'region' => 'Africa', 'headquarters' => 'Lagos, Nigeria'],
            ['name' => 'Kepple Africa Ventures', 'type' => 'VC Firm', 'focus_sectors' => json_encode(['Health Tech', 'Fintech']), 'aum' => 75000000, 'stage_focus' => 'Seed-Series A', 'region' => 'Africa', 'headquarters' => 'Nairobi, Kenya'],
            ['name' => 'Global Health Ventures', 'type' => 'Impact Fund', 'focus_sectors' => json_encode(['Healthcare', 'Pharma']), 'aum' => 300000000, 'stage_focus' => 'Series B+', 'region' => 'Global', 'headquarters' => 'London, UK'],
        ];
        
        $stmt = $pdo->prepare("INSERT INTO investors (name, type, focus_sectors, aum, stage_focus, region, headquarters, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        foreach ($investors as $investor) {
            $stmt->execute([
                $investor['name'],
                $investor['type'],
                $investor['focus_sectors'],
                $investor['aum'],
                $investor['stage_focus'],
                $investor['region'],
                $investor['headquarters']
            ]);
        }
        echo "Seeded " . count($investors) . " investors\n";
    }
    
    // Seed Clinical Trials (if empty)
    $trialCount = $pdo->query("SELECT COUNT(*) FROM clinical_trials")->fetchColumn();
    if ($trialCount == 0) {
        $trials = [
            ['trial_id' => 'NCT12345', 'title' => 'Malaria Vaccine Phase 3', 'phase' => 'Phase 3', 'status' => 'Recruiting', 'medical_condition' => 'Malaria', 'sponsor' => 'WHO', 'start_date' => '2024-01-01', 'end_date' => '2025-12-31'],
            ['trial_id' => 'NCT12346', 'title' => 'TB Treatment Study', 'phase' => 'Phase 2', 'status' => 'Active', 'medical_condition' => 'Tuberculosis', 'sponsor' => 'NIH', 'start_date' => '2023-06-01', 'end_date' => '2024-12-31'],
        ];
        
        $stmt = $pdo->prepare("INSERT INTO clinical_trials (trial_id, title, phase, status, medical_condition, sponsor, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        foreach ($trials as $trial) {
            $stmt->execute([
                $trial['trial_id'],
                $trial['title'],
                $trial['phase'],
                $trial['status'],
                $trial['medical_condition'],
                $trial['sponsor'],
                $trial['start_date'],
                $trial['end_date']
            ]);
        }
        echo "Seeded " . count($trials) . " clinical trials\n";
    }
    
    // Seed Public Markets (if empty)
    $stockCount = $pdo->query("SELECT COUNT(*) FROM public_stocks")->fetchColumn();
    if ($stockCount == 0) {
        $stocks = [
            ['symbol' => 'ASHR.M', 'company_name' => 'Aspen Pharmacare', 'exchange' => 'JSE', 'sector' => 'Pharmaceuticals', 'country' => 'South Africa', 'market_cap' => 5000000000, 'current_price' => 125.50],
            ['symbol' => 'DANGOTE.M', 'company_name' => 'Dangote Sugar', 'exchange' => 'NSE', 'sector' => 'Healthcare', 'country' => 'Nigeria', 'market_cap' => 1200000000, 'current_price' => 18.75],
        ];
        
        $stmt = $pdo->prepare("INSERT INTO public_stocks (symbol, company_name, exchange, sector, country, market_cap, current_price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        foreach ($stocks as $stock) {
            $stmt->execute([
                $stock['symbol'],
                $stock['company_name'],
                $stock['exchange'],
                $stock['sector'],
                $stock['country'],
                $stock['market_cap'],
                $stock['current_price']
            ]);
        }
        echo "Seeded " . count($stocks) . " public market stocks\n";
    }
    
    // Seed Regulatory (if tables exist)
    try {
        $regulatoryCount = $pdo->query("SELECT COUNT(*) FROM company_regulatory")->fetchColumn();
        if ($regulatoryCount == 0) {
            // First ensure regulatory bodies exist
            $regBodies = [
                ['name' => 'NAFDAC', 'country' => 'Nigeria', 'type' => 'Pharmaceutical'],
                ['name' => 'SAHPRA', 'country' => 'South Africa', 'type' => 'Pharmaceutical'],
            ];
            
            $stmt = $pdo->prepare("INSERT INTO regulatory_bodies (name, country, type, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
            foreach ($regBodies as $body) {
                $stmt->execute([$body['name'], $body['country'], $body['type']]);
            }
            
            $regulatory = [
                ['company_id' => 1, 'regulatory_body_id' => 1, 'status' => 'Approved', 'approval_date' => '2023-06-15'],
                ['company_id' => 2, 'regulatory_body_id' => 2, 'status' => 'Pending', 'approval_date' => null],
            ];
            
            $stmt = $pdo->prepare("INSERT INTO company_regulatory (company_id, regulatory_body_id, status, approval_date, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
            foreach ($regulatory as $reg) {
                $stmt->execute([$reg['company_id'], $reg['regulatory_body_id'], $reg['status'], $reg['approval_date']]);
            }
            echo "Seeded regulatory data\n";
        }
    } catch (Exception $e) {
        echo "Note: Regulatory tables may not exist: " . $e->getMessage() . "\n";
    }
    
    // Seed Nation Pulse (if table exists)
    try {
        $pulseCount = $pdo->query("SELECT COUNT(*) FROM nation_pulse_data")->fetchColumn();
        if ($pulseCount == 0) {
            $pulseData = [
                ['country' => 'Nigeria', 'data_type' => 'Health Metrics', 'metric_name' => 'Life Expectancy', 'value' => 55.2, 'year' => 2024],
                ['country' => 'Ghana', 'data_type' => 'Health Metrics', 'metric_name' => 'Life Expectancy', 'value' => 64.5, 'year' => 2024],
                ['country' => 'Kenya', 'data_type' => 'Health Metrics', 'metric_name' => 'Life Expectancy', 'value' => 66.3, 'year' => 2024],
                ['country' => 'South Africa', 'data_type' => 'Health Metrics', 'metric_name' => 'Life Expectancy', 'value' => 64.1, 'year' => 2024],
            ];
            
            $stmt = $pdo->prepare("INSERT INTO nation_pulse_data (country, data_type, metric_name, value, year, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
            foreach ($pulseData as $data) {
                $stmt->execute([$data['country'], $data['data_type'], $data['metric_name'], $data['value'], $data['year']]);
            }
            echo "Seeded " . count($pulseData) . " nation pulse records\n";
        }
    } catch (Exception $e) {
        echo "Note: Nation pulse table may not exist: " . $e->getMessage() . "\n";
    }
    
    // Seed Clinical Centers (if table exists)
    try {
        $centerCount = $pdo->query("SELECT COUNT(*) FROM clinical_centers")->fetchColumn();
        if ($centerCount == 0) {
            $centers = [
                ['name' => 'Lagos University Teaching Hospital', 'institution' => 'LUTH', 'city' => 'Lagos', 'country' => 'Nigeria', 'therapeutic_area' => 'Oncology', 'contact_email' => 'info@luth.gov.ng'],
                ['name' => 'Kenya Medical Research Institute', 'institution' => 'KEMRI', 'city' => 'Nairobi', 'country' => 'Kenya', 'therapeutic_area' => 'Infectious Diseases', 'contact_email' => 'info@kemri.org'],
            ];
            
            $stmt = $pdo->prepare("INSERT INTO clinical_centers (name, institution, city, country, therapeutic_area, contact_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
            foreach ($centers as $center) {
                $stmt->execute([$center['name'], $center['institution'], $center['city'], $center['country'], $center['therapeutic_area'], $center['contact_email']]);
            }
            echo "Seeded " . count($centers) . " clinical centers\n";
        }
    } catch (Exception $e) {
        echo "Note: Clinical centers table may not exist: " . $e->getMessage() . "\n";
    }
    
    // Seed Investigators (if table exists)
    try {
        $investigatorCount = $pdo->query("SELECT COUNT(*) FROM investigators")->fetchColumn();
        if ($investigatorCount == 0) {
            $investigators = [
                ['name' => 'Dr. Adebayo Ogunlesi', 'institution' => 'LUTH', 'city' => 'Lagos', 'region' => 'Nigeria', 'therapeutic_area' => 'Oncology', 'email' => 'a.ogunlesi@luth.gov.ng'],
                ['name' => 'Dr. Wanjiku Mwangi', 'institution' => 'KEMRI', 'city' => 'Nairobi', 'region' => 'Kenya', 'therapeutic_area' => 'Infectious Diseases', 'email' => 'w.mwangi@kemri.org'],
            ];
            
            $stmt = $pdo->prepare("INSERT INTO investigators (name, institution, city, region, therapeutic_area, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
            foreach ($investigators as $investigator) {
                $stmt->execute([$investigator['name'], $investigator['institution'], $investigator['city'], $investigator['region'], $investigator['therapeutic_area'], $investigator['email']]);
            }
            echo "Seeded " . count($investigators) . " investigators\n";
        }
    } catch (Exception $e) {
        echo "Note: Investigators table may not exist: " . $e->getMessage() . "\n";
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Mock data seeded successfully'
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

