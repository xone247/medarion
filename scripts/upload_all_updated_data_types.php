<?php
/**
 * Upload All Updated Data Types to Database
 * Uploads all data from data_master/verified/ to database
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "UPLOAD ALL UPDATED DATA TYPES\n";
echo "=" . str_repeat("=", 69) . "\n\n";

// Database configuration
$config_file = __DIR__ . '/../config/database.production.php';
$config = null;

if (file_exists($config_file)) {
    $config = require $config_file;
    echo "✅ Loaded config from: database.production.php\n";
} else {
    echo "⚠️  Config file not found. Using default credentials.\n";
    echo "   Please update config/database.production.php with your credentials.\n\n";
}

$db_config = $config ?? [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'port' => getenv('DB_PORT') ?: 3306,
    'database' => getenv('DB_NAME') ?: 'medasnnc_medarion',
    'username' => getenv('DB_USER') ?: 'medasnnc_medarion',
    'password' => getenv('DB_PASSWORD') ?: 'Neorage94',
    'charset' => 'utf8mb4'
];

echo "📋 Database Configuration:\n";
echo "   Host: {$db_config['host']}\n";
echo "   Database: {$db_config['database']}\n";
echo "   Username: {$db_config['username']}\n\n";

// Connect to database
try {
    $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['database']};charset={$db_config['charset']}";
    $db = new PDO($dsn, $db_config['username'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    echo "✅ Connected to database\n\n";
} catch(PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage() . "\n");
}

// Data files mapping
$data_files = [
    'deals' => 'data_master/verified/deals/master_deals.json',
    'grants' => 'data_master/verified/grants/master_grants.json',
    'investors' => 'data_master/verified/investors/master_investors.json',
    'investigators' => 'data_master/verified/investigators/master_investigators.json',
    'clinical_centers' => 'data_master/verified/clinical_centers/master_clinical_centers.json',
    'regulatory_bodies' => 'data_master/verified/regulatory_bodies/master_regulatory_bodies.json',
    'clinical_trials' => 'data_master/verified/clinical_trials/master_clinical_trials.json',
    'public_stocks' => 'data_master/verified/public_stocks/master_public_stocks.json',
    'nation_pulse' => 'data_master/verified/nation_pulse/master_nation_pulse.json'
];

$results = [];

// Upload Deals
if (file_exists($data_files['deals'])) {
    echo "📋 UPLOADING DEALS...\n";
    $deals = json_decode(file_get_contents($data_files['deals']), true);
    $added = 0;
    $updated = 0;
    
    $stmt_check = $db->prepare("SELECT id FROM deals WHERE id = ?");
    $stmt_insert = $db->prepare("
        INSERT INTO deals (id, company_id, deal_type, amount, valuation, lead_investor, participants, deal_date, status, description, sector, company_name, country, source_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt_update = $db->prepare("
        UPDATE deals SET company_id = ?, deal_type = ?, amount = ?, valuation = ?, lead_investor = ?, participants = ?, deal_date = ?, status = ?, description = ?, sector = ?, company_name = ?, country = ?, source_url = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    foreach ($deals as $deal) {
        $stmt_check->execute([$deal['id']]);
        $exists = $stmt_check->fetch();
        
        if ($exists) {
            $stmt_update->execute([
                $deal['company_id'], $deal['deal_type'], $deal['amount'], $deal['valuation'],
                $deal['lead_investor'], $deal['participants'], $deal['deal_date'], $deal['status'],
                $deal['description'], $deal['sector'], $deal['company_name'], $deal['country'],
                $deal['source_url'] ?? null, $deal['id']
            ]);
            $updated++;
        } else {
            $stmt_insert->execute([
                $deal['id'], $deal['company_id'], $deal['deal_type'], $deal['amount'],
                $deal['valuation'], $deal['lead_investor'], $deal['participants'], $deal['deal_date'],
                $deal['status'], $deal['description'], $deal['sector'], $deal['company_name'],
                $deal['country'], $deal['source_url'] ?? null
            ]);
            $added++;
        }
    }
    
    echo "   ✓ Added: $added, Updated: $updated\n\n";
    $results['deals'] = ['total' => count($deals), 'added' => $added, 'updated' => $updated];
}

// Upload Grants
if (file_exists($data_files['grants'])) {
    echo "📋 UPLOADING GRANTS...\n";
    $grants = json_decode(file_get_contents($data_files['grants']), true);
    $added = 0;
    $updated = 0;
    
    $stmt_check = $db->prepare("SELECT id FROM grants WHERE id = ?");
    $stmt_insert = $db->prepare("
        INSERT INTO grants (id, title, description, funding_agency, funders, country, amount, duration, grant_type, sector, application_deadline, award_date, status, requirements, contact_email, website, duration_months, eligibility_criteria, application_process, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt_update = $db->prepare("
        UPDATE grants SET title = ?, description = ?, funding_agency = ?, funders = ?, country = ?, amount = ?, duration = ?, grant_type = ?, sector = ?, application_deadline = ?, award_date = ?, status = ?, requirements = ?, contact_email = ?, website = ?, duration_months = ?, eligibility_criteria = ?, application_process = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    foreach ($grants as $grant) {
        $stmt_check->execute([$grant['id']]);
        $exists = $stmt_check->fetch();
        
        if ($exists) {
            $stmt_update->execute([
                $grant['title'], $grant['description'], $grant['funding_agency'], $grant['funders'],
                $grant['country'], $grant['amount'], $grant['duration'], $grant['grant_type'],
                $grant['sector'], $grant['application_deadline'], $grant['award_date'], $grant['status'],
                $grant['requirements'], $grant['contact_email'], $grant['website'], $grant['duration_months'],
                $grant['eligibility_criteria'], $grant['application_process'], $grant['id']
            ]);
            $updated++;
        } else {
            $stmt_insert->execute([
                $grant['id'], $grant['title'], $grant['description'], $grant['funding_agency'],
                $grant['funders'], $grant['country'], $grant['amount'], $grant['duration'],
                $grant['grant_type'], $grant['sector'], $grant['application_deadline'], $grant['award_date'],
                $grant['status'], $grant['requirements'], $grant['contact_email'], $grant['website'],
                $grant['duration_months'], $grant['eligibility_criteria'], $grant['application_process']
            ]);
            $added++;
        }
    }
    
    echo "   ✓ Added: $added, Updated: $updated\n\n";
    $results['grants'] = ['total' => count($grants), 'added' => $added, 'updated' => $updated];
}

// Upload Investors
if (file_exists($data_files['investors'])) {
    echo "📋 UPLOADING INVESTORS...\n";
    $investors = json_decode(file_get_contents($data_files['investors']), true);
    $added = 0;
    $updated = 0;
    
    $stmt_check = $db->prepare("SELECT id FROM investors WHERE id = ?");
    $stmt_insert = $db->prepare("
        INSERT INTO investors (id, name, slug, logo, description, type, headquarters, founded_year, founded, assets_under_management, website, focus_sectors, investment_stages, portfolio_companies, total_investments, average_investment, countries, team_size, contact_email, social_media, recent_investments, investment_criteria, portfolio_exits, is_active, total_invested, deal_count, avg_deal_size, sectors, geographic_focus, logo_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt_update = $db->prepare("
        UPDATE investors SET name = ?, slug = ?, logo = ?, description = ?, type = ?, headquarters = ?, founded_year = ?, founded = ?, assets_under_management = ?, website = ?, focus_sectors = ?, investment_stages = ?, portfolio_companies = ?, total_investments = ?, average_investment = ?, countries = ?, team_size = ?, contact_email = ?, social_media = ?, recent_investments = ?, investment_criteria = ?, portfolio_exits = ?, is_active = ?, total_invested = ?, deal_count = ?, avg_deal_size = ?, sectors = ?, geographic_focus = ?, logo_url = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    foreach ($investors as $inv) {
        $stmt_check->execute([$inv['id']]);
        $exists = $stmt_check->fetch();
        
        $params = [
            $inv['name'], $inv['slug'] ?? '', $inv['logo'], $inv['description'],
            $inv['type'], $inv['headquarters'], $inv['founded_year'], $inv['founded'],
            $inv['assets_under_management'], $inv['website'], $inv['focus_sectors'],
            $inv['investment_stages'], $inv['portfolio_companies'], $inv['total_investments'] ?? 0,
            $inv['average_investment'], $inv['countries'], $inv['team_size'],
            $inv['contact_email'], $inv['social_media'], $inv['recent_investments'],
            $inv['investment_criteria'], $inv['portfolio_exits'] ?? 0, $inv['is_active'] ?? 1,
            $inv['total_invested'], $inv['deal_count'], $inv['avg_deal_size'],
            $inv['sectors'], $inv['geographic_focus'], $inv['logo_url']
        ];
        
        if ($exists) {
            $params[] = $inv['id'];
            $stmt_update->execute($params);
            $updated++;
        } else {
            array_unshift($params, $inv['id']);
            $stmt_insert->execute($params);
            $added++;
        }
    }
    
    echo "   ✓ Added: $added, Updated: $updated\n\n";
    $results['investors'] = ['total' => count($investors), 'added' => $added, 'updated' => $updated];
}

// Upload Investigators
if (file_exists($data_files['investigators'])) {
    echo "📋 UPLOADING INVESTIGATORS...\n";
    $investigators = json_decode(file_get_contents($data_files['investigators']), true);
    $added = 0;
    $updated = 0;
    
    $stmt_check = $db->prepare("SELECT id FROM investigators WHERE id = ?");
    $stmt_insert = $db->prepare("
        INSERT INTO investigators (id, name, first_name, last_name, title, institution, specialization, affiliation, country, city, email, phone, specialties, therapeutic_areas, experience_years, education, certifications, bio, research_interests, trials_conducted, publications_count, website, linkedin_url, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt_update = $db->prepare("
        UPDATE investigators SET name = ?, first_name = ?, last_name = ?, title = ?, institution = ?, specialization = ?, affiliation = ?, country = ?, city = ?, email = ?, phone = ?, specialties = ?, therapeutic_areas = ?, experience_years = ?, education = ?, certifications = ?, bio = ?, research_interests = ?, trials_conducted = ?, publications_count = ?, website = ?, linkedin_url = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    foreach ($investigators as $inv) {
        $stmt_check->execute([$inv['id']]);
        $exists = $stmt_check->fetch();
        
        $params = [
            $inv['name'], $inv['first_name'] ?? '', $inv['last_name'] ?? '', $inv['title'],
            $inv['institution'], $inv['specialization'], $inv['affiliation'], $inv['country'],
            $inv['city'], $inv['email'], $inv['phone'], $inv['specialties'],
            $inv['therapeutic_areas'], $inv['experience_years'], $inv['education'],
            $inv['certifications'], $inv['bio'], $inv['research_interests'],
            $inv['trials_conducted'] ?? 0, $inv['publications_count'] ?? 0,
            $inv['website'], $inv['linkedin_url'], $inv['is_active'] ?? 1
        ];
        
        if ($exists) {
            $params[] = $inv['id'];
            $stmt_update->execute($params);
            $updated++;
        } else {
            array_unshift($params, $inv['id']);
            $stmt_insert->execute($params);
            $added++;
        }
    }
    
    echo "   ✓ Added: $added, Updated: $updated\n\n";
    $results['investigators'] = ['total' => count($investigators), 'added' => $added, 'updated' => $updated];
}

// Upload Clinical Centers
if (file_exists($data_files['clinical_centers'])) {
    echo "📋 UPLOADING CLINICAL CENTERS...\n";
    $centers = json_decode(file_get_contents($data_files['clinical_centers']), true);
    $added = 0;
    $updated = 0;
    
    $stmt_check = $db->prepare("SELECT id FROM clinical_centers WHERE id = ?");
    $stmt_insert = $db->prepare("
        INSERT INTO clinical_centers (id, name, type, country, city, address, description, specialties, phases_supported, capacity_patients, established_year, specializations, certifications, contact_name, contact_email, contact_phone, website, active_trials_count, total_trials_completed, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt_update = $db->prepare("
        UPDATE clinical_centers SET name = ?, type = ?, country = ?, city = ?, address = ?, description = ?, specialties = ?, phases_supported = ?, capacity_patients = ?, established_year = ?, specializations = ?, certifications = ?, contact_name = ?, contact_email = ?, contact_phone = ?, website = ?, active_trials_count = ?, total_trials_completed = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    foreach ($centers as $center) {
        $stmt_check->execute([$center['id']]);
        $exists = $stmt_check->fetch();
        
        $params = [
            $center['name'], $center['type'] ?? '', $center['country'], $center['city'],
            $center['address'], $center['description'], $center['specialties'],
            $center['phases_supported'], $center['capacity_patients'], $center['established_year'],
            $center['specializations'], $center['certifications'], $center['contact_name'],
            $center['contact_email'], $center['contact_phone'], $center['website'],
            $center['active_trials_count'] ?? 0, $center['total_trials_completed'] ?? 0,
            $center['is_active'] ?? 1
        ];
        
        if ($exists) {
            $params[] = $center['id'];
            $stmt_update->execute($params);
            $updated++;
        } else {
            array_unshift($params, $center['id']);
            $stmt_insert->execute($params);
            $added++;
        }
    }
    
    echo "   ✓ Added: $added, Updated: $updated\n\n";
    $results['clinical_centers'] = ['total' => count($centers), 'added' => $added, 'updated' => $updated];
}

// Upload Regulatory Bodies
if (file_exists($data_files['regulatory_bodies'])) {
    echo "📋 UPLOADING REGULATORY BODIES...\n";
    $bodies = json_decode(file_get_contents($data_files['regulatory_bodies']), true);
    $added = 0;
    $updated = 0;
    
    $stmt_check = $db->prepare("SELECT id FROM regulatory_bodies WHERE id = ?");
    $stmt_insert = $db->prepare("
        INSERT INTO regulatory_bodies (id, name, acronym, country, type, description, is_active, website, contact_email, contact_phone, address, approval_process_duration, requirements, abbreviation, logo_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt_update = $db->prepare("
        UPDATE regulatory_bodies SET name = ?, acronym = ?, country = ?, type = ?, description = ?, is_active = ?, website = ?, contact_email = ?, contact_phone = ?, address = ?, approval_process_duration = ?, requirements = ?, abbreviation = ?, logo_url = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    foreach ($bodies as $body) {
        $stmt_check->execute([$body['id']]);
        $exists = $stmt_check->fetch();
        
        $params = [
            $body['name'], $body['acronym'], $body['country'], $body['type'] ?? 'national',
            $body['description'], $body['is_active'] ?? 1, $body['website'],
            $body['contact_email'], $body['contact_phone'], $body['address'],
            $body['approval_process_duration'], $body['requirements'], $body['abbreviation'],
            $body['logo_url']
        ];
        
        if ($exists) {
            $params[] = $body['id'];
            $stmt_update->execute($params);
            $updated++;
        } else {
            array_unshift($params, $body['id']);
            $stmt_insert->execute($params);
            $added++;
        }
    }
    
    echo "   ✓ Added: $added, Updated: $updated\n\n";
    $results['regulatory_bodies'] = ['total' => count($bodies), 'added' => $added, 'updated' => $updated];
}

// Upload Clinical Trials
if (file_exists($data_files['clinical_trials'])) {
    echo "📋 UPLOADING CLINICAL TRIALS...\n";
    $trials = json_decode(file_get_contents($data_files['clinical_trials']), true);
    $added = 0;
    $updated = 0;
    
    $stmt_check = $db->prepare("SELECT id FROM clinical_trials WHERE id = ?");
    $stmt_insert = $db->prepare("
        INSERT INTO clinical_trials (id, title, description, phase, medical_condition, intervention, sponsor, location, start_date, end_date, status, nct_number, indication, country, trial_id, company_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt_update = $db->prepare("
        UPDATE clinical_trials SET title = ?, description = ?, phase = ?, medical_condition = ?, intervention = ?, sponsor = ?, location = ?, start_date = ?, end_date = ?, status = ?, nct_number = ?, indication = ?, country = ?, trial_id = ?, company_id = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    foreach ($trials as $trial) {
        $stmt_check->execute([$trial['id']]);
        $exists = $stmt_check->fetch();
        
        $params = [
            $trial['title'], $trial['description'], $trial['phase'] ?? '', $trial['medical_condition'],
            $trial['intervention'], $trial['sponsor'], $trial['location'], $trial['start_date'],
            $trial['end_date'], $trial['status'], $trial['nct_number'], $trial['indication'],
            $trial['country'], $trial['trial_id'], $trial['company_id']
        ];
        
        if ($exists) {
            $params[] = $trial['id'];
            $stmt_update->execute($params);
            $updated++;
        } else {
            array_unshift($params, $trial['id']);
            $stmt_insert->execute($params);
            $added++;
        }
    }
    
    echo "   ✓ Added: $added, Updated: $updated\n\n";
    $results['clinical_trials'] = ['total' => count($trials), 'added' => $added, 'updated' => $updated];
}

// Upload Public Stocks
if (file_exists($data_files['public_stocks'])) {
    echo "📋 UPLOADING PUBLIC STOCKS...\n";
    $stocks = json_decode(file_get_contents($data_files['public_stocks']), true);
    $added = 0;
    $updated = 0;
    
    $stmt_check = $db->prepare("SELECT id FROM public_stocks WHERE id = ?");
    $stmt_insert = $db->prepare("
        INSERT INTO public_stocks (id, company_id, company_name, ticker, exchange, price, market_cap, currency, country, sector, last_updated, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt_update = $db->prepare("
        UPDATE public_stocks SET company_id = ?, company_name = ?, ticker = ?, exchange = ?, price = ?, market_cap = ?, currency = ?, country = ?, sector = ?, last_updated = NOW()
        WHERE id = ?
    ");
    
    foreach ($stocks as $stock) {
        $stmt_check->execute([$stock['id']]);
        $exists = $stmt_check->fetch();
        
        $params = [
            $stock['company_id'], $stock['company_name'], $stock['ticker'], $stock['exchange'],
            $stock['price'], $stock['market_cap'], $stock['currency'], $stock['country'],
            $stock['sector']
        ];
        
        if ($exists) {
            $params[] = $stock['id'];
            $stmt_update->execute($params);
            $updated++;
        } else {
            array_unshift($params, $stock['id']);
            $stmt_insert->execute($params);
            $added++;
        }
    }
    
    echo "   ✓ Added: $added, Updated: $updated\n\n";
    $results['public_stocks'] = ['total' => count($stocks), 'added' => $added, 'updated' => $updated];
}

// Upload Nation Pulse
if (file_exists($data_files['nation_pulse'])) {
    echo "📋 UPLOADING NATION PULSE...\n";
    $pulse_data = json_decode(file_get_contents($data_files['nation_pulse']), true);
    $added = 0;
    $updated = 0;
    
    $stmt_check = $db->prepare("SELECT id FROM nation_pulse_data WHERE id = ?");
    $stmt_insert = $db->prepare("
        INSERT INTO nation_pulse_data (id, country, country_code, data_type, metric_name, metric_value, metric_unit, year, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt_update = $db->prepare("
        UPDATE nation_pulse_data SET country = ?, country_code = ?, data_type = ?, metric_name = ?, metric_value = ?, metric_unit = ?, year = ?, source = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    foreach ($pulse_data as $entry) {
        $stmt_check->execute([$entry['id']]);
        $exists = $stmt_check->fetch();
        
        $params = [
            $entry['country'], $entry['country_code'], $entry['data_type'], $entry['metric_name'],
            $entry['metric_value'], $entry['metric_unit'], $entry['year'], $entry['source']
        ];
        
        if ($exists) {
            $params[] = $entry['id'];
            $stmt_update->execute($params);
            $updated++;
        } else {
            array_unshift($params, $entry['id']);
            $stmt_insert->execute($params);
            $added++;
        }
    }
    
    echo "   ✓ Added: $added, Updated: $updated\n\n";
    $results['nation_pulse'] = ['total' => count($pulse_data), 'added' => $added, 'updated' => $updated];
}

// Summary
echo "=" . str_repeat("=", 69) . "\n";
echo "UPLOAD SUMMARY\n";
echo "=" . str_repeat("=", 69) . "\n\n";

foreach ($results as $type => $stats) {
    echo strtoupper($type) . ":\n";
    echo "   Total: {$stats['total']}\n";
    echo "   Added: {$stats['added']}\n";
    echo "   Updated: {$stats['updated']}\n\n";
}

echo "=" . str_repeat("=", 69) . "\n";
echo "✅ UPLOAD COMPLETE!\n";
echo "=" . str_repeat("=", 69) . "\n";
echo "\n💡 Next Steps:\n";
echo "   1. Check your website to see how data displays\n";
echo "   2. Review design and make adjustments if needed\n";
echo "   3. Continue company scraping for remaining entries\n";
echo "\n";

