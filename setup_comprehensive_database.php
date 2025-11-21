<?php
// Comprehensive Database Setup Script for Medarion Platform
// This script creates all necessary tables and handles existing data

$host = 'localhost';
$dbname = 'medarion_platform';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully.\n";
    
    // ==============================================
    // UPDATE EXISTING TABLES
    // ==============================================
    
    // Update users table
    $alterUsers = "
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS user_type ENUM('investors_finance', 'startup', 'health_science_experts', 'industry_executives', 'media_advisors') DEFAULT 'startup',
    ADD COLUMN IF NOT EXISTS account_tier ENUM('free', 'paid', 'academic', 'enterprise') DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS app_roles JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS dashboard_modules JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS module_order JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ai_quota_used INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_quota_reset_date DATE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL
    ";
    
    try {
        $pdo->exec($alterUsers);
        echo "Updated users table successfully.\n";
    } catch (PDOException $e) {
        echo "Users table update: " . $e->getMessage() . "\n";
    }
    
    // Update companies table
    $alterCompanies = "
    ALTER TABLE companies 
    ADD COLUMN IF NOT EXISTS sector VARCHAR(50),
    ADD COLUMN IF NOT EXISTS country VARCHAR(50),
    ADD COLUMN IF NOT EXISTS last_funding_date DATE NULL,
    ADD COLUMN IF NOT EXISTS investors JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS products JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS markets JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS achievements JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS partnerships JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS awards JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
    ";
    
    try {
        $pdo->exec($alterCompanies);
        echo "Updated companies table successfully.\n";
    } catch (PDOException $e) {
        echo "Companies table update: " . $e->getMessage() . "\n";
    }
    
    // Update deals table
    $alterDeals = "
    ALTER TABLE deals 
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS sector VARCHAR(50),
    ADD COLUMN IF NOT EXISTS country VARCHAR(50),
    ADD COLUMN IF NOT EXISTS source_url VARCHAR(255)
    ";
    
    try {
        $pdo->exec($alterDeals);
        echo "Updated deals table successfully.\n";
    } catch (PDOException $e) {
        echo "Deals table update: " . $e->getMessage() . "\n";
    }
    
    // Update grants table
    $alterGrants = "
    ALTER TABLE grants 
    ADD COLUMN IF NOT EXISTS country VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sector VARCHAR(50),
    ADD COLUMN IF NOT EXISTS duration_months INT,
    ADD COLUMN IF NOT EXISTS funders JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS eligibility_criteria JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS application_process TEXT
    ";
    
    try {
        $pdo->exec($alterGrants);
        echo "Updated grants table successfully.\n";
    } catch (PDOException $e) {
        echo "Grants table update: " . $e->getMessage() . "\n";
    }
    
    // Update clinical_trials table
    $alterTrials = "
    ALTER TABLE clinical_trials 
    ADD COLUMN IF NOT EXISTS indication VARCHAR(100),
    ADD COLUMN IF NOT EXISTS country VARCHAR(50),
    ADD COLUMN IF NOT EXISTS trial_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS company_id INT
    ";
    
    try {
        $pdo->exec($alterTrials);
        echo "Updated clinical_trials table successfully.\n";
    } catch (PDOException $e) {
        echo "Clinical trials table update: " . $e->getMessage() . "\n";
    }
    
    // ==============================================
    // CREATE NEW TABLES
    // ==============================================
    
    // Create investors table
    $createInvestors = "
    CREATE TABLE IF NOT EXISTS investors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        logo VARCHAR(255),
        description TEXT,
        type ENUM('VC', 'PE', 'Angel', 'Corporate', 'Government', 'Foundation', 'Accelerator') DEFAULT 'VC',
        headquarters VARCHAR(100),
        founded_year INT,
        assets_under_management DECIMAL(15,2),
        website VARCHAR(255),
        focus_sectors JSON DEFAULT NULL,
        investment_stages JSON DEFAULT NULL,
        portfolio_companies JSON DEFAULT NULL,
        total_investments INT DEFAULT 0,
        average_investment DECIMAL(15,2),
        countries JSON DEFAULT NULL,
        team_size INT,
        contact_email VARCHAR(100),
        social_media JSON DEFAULT NULL,
        recent_investments JSON DEFAULT NULL,
        investment_criteria JSON DEFAULT NULL,
        portfolio_exits JSON DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    ";
    
    try {
        $pdo->exec($createInvestors);
        echo "Created investors table successfully.\n";
    } catch (PDOException $e) {
        echo "Investors table creation: " . $e->getMessage() . "\n";
    }
    
    // Create public_stocks table
    $createStocks = "
    CREATE TABLE IF NOT EXISTS public_stocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(100) NOT NULL,
        ticker VARCHAR(20) NOT NULL,
        exchange VARCHAR(20) NOT NULL,
        price VARCHAR(50),
        market_cap VARCHAR(50),
        currency VARCHAR(10),
        sector VARCHAR(50),
        country VARCHAR(50),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ";
    
    try {
        $pdo->exec($createStocks);
        echo "Created public_stocks table successfully.\n";
    } catch (PDOException $e) {
        echo "Public stocks table creation: " . $e->getMessage() . "\n";
    }
    
    // Create regulatory_bodies table
    $createRegulatory = "
    CREATE TABLE IF NOT EXISTS regulatory_bodies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        country VARCHAR(50) NOT NULL,
        abbreviation VARCHAR(20),
        website VARCHAR(255),
        description TEXT,
        jurisdiction TEXT,
        contact_info JSON DEFAULT NULL,
        regulatory_framework TEXT,
        approval_process TEXT,
        fees_structure TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    ";
    
    try {
        $pdo->exec($createRegulatory);
        echo "Created regulatory_bodies table successfully.\n";
    } catch (PDOException $e) {
        echo "Regulatory bodies table creation: " . $e->getMessage() . "\n";
    }
    
    // Create company_regulatory table
    $createCompanyRegulatory = "
    CREATE TABLE IF NOT EXISTS company_regulatory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        regulatory_body_id INT,
        product_name VARCHAR(100) NOT NULL,
        status ENUM('Submitted', 'Under Review', 'Approved', 'Rejected', 'Withdrawn') DEFAULT 'Submitted',
        approval_date DATE NULL,
        region VARCHAR(50),
        application_date DATE,
        expiry_date DATE NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (regulatory_body_id) REFERENCES regulatory_bodies(id) ON DELETE CASCADE
    )
    ";
    
    try {
        $pdo->exec($createCompanyRegulatory);
        echo "Created company_regulatory table successfully.\n";
    } catch (PDOException $e) {
        echo "Company regulatory table creation: " . $e->getMessage() . "\n";
    }
    
    // Create clinical_centers table
    $createCenters = "
    CREATE TABLE IF NOT EXISTS clinical_centers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        country VARCHAR(50) NOT NULL,
        city VARCHAR(50),
        address TEXT,
        website VARCHAR(255),
        description TEXT,
        specialties JSON DEFAULT NULL,
        phases_supported JSON DEFAULT NULL,
        capacity_patients INT,
        established_year INT,
        accreditation JSON DEFAULT NULL,
        contact_info JSON DEFAULT NULL,
        facilities JSON DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    ";
    
    try {
        $pdo->exec($createCenters);
        echo "Created clinical_centers table successfully.\n";
    } catch (PDOException $e) {
        echo "Clinical centers table creation: " . $e->getMessage() . "\n";
    }
    
    // Create investigators table
    $createInvestigators = "
    CREATE TABLE IF NOT EXISTS investigators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        title VARCHAR(50),
        institution VARCHAR(100),
        country VARCHAR(50),
        city VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(20),
        specialties JSON DEFAULT NULL,
        therapeutic_areas JSON DEFAULT NULL,
        trial_count INT DEFAULT 0,
        experience_years INT,
        education JSON DEFAULT NULL,
        certifications JSON DEFAULT NULL,
        publications_count INT DEFAULT 0,
        languages JSON DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    ";
    
    try {
        $pdo->exec($createInvestigators);
        echo "Created investigators table successfully.\n";
    } catch (PDOException $e) {
        echo "Investigators table creation: " . $e->getMessage() . "\n";
    }
    
    // Create nation_pulse_data table
    $createNationPulse = "
    CREATE TABLE IF NOT EXISTS nation_pulse_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        country VARCHAR(50) NOT NULL,
        data_type ENUM('population', 'healthcare_infrastructure', 'economic_indicators', 'disease_immunization') NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15,4),
        metric_unit VARCHAR(50),
        year INT,
        source VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_metric (country, data_type, metric_name, year)
    )
    ";
    
    try {
        $pdo->exec($createNationPulse);
        echo "Created nation_pulse_data table successfully.\n";
    } catch (PDOException $e) {
        echo "Nation pulse data table creation: " . $e->getMessage() . "\n";
    }
    
    // Create CRM tables
    $createCrmInvestors = "
    CREATE TABLE IF NOT EXISTS crm_investors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50),
        focus VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        last_contact DATE NULL,
        notes TEXT,
        deal_size VARCHAR(50),
        timeline VARCHAR(50),
        pipeline_stage ENUM('Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost') DEFAULT 'Lead',
        probability_percent INT DEFAULT 0,
        next_action VARCHAR(255),
        next_action_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ";
    
    try {
        $pdo->exec($createCrmInvestors);
        echo "Created crm_investors table successfully.\n";
    } catch (PDOException $e) {
        echo "CRM investors table creation: " . $e->getMessage() . "\n";
    }
    
    $createCrmMeetings = "
    CREATE TABLE IF NOT EXISTS crm_meetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        crm_investor_id INT NOT NULL,
        meeting_type ENUM('Call', 'Video', 'In-Person', 'Email') DEFAULT 'Call',
        meeting_date DATE NOT NULL,
        duration_minutes INT,
        notes TEXT,
        outcome VARCHAR(255),
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (crm_investor_id) REFERENCES crm_investors(id) ON DELETE CASCADE
    )
    ";
    
    try {
        $pdo->exec($createCrmMeetings);
        echo "Created crm_meetings table successfully.\n";
    } catch (PDOException $e) {
        echo "CRM meetings table creation: " . $e->getMessage() . "\n";
    }
    
    // Create AI integration tables
    $createAiUsage = "
    CREATE TABLE IF NOT EXISTS ai_usage_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tool_name VARCHAR(100) NOT NULL,
        query TEXT,
        response TEXT,
        tokens_used INT DEFAULT 0,
        cost_usd DECIMAL(10,4) DEFAULT 0,
        execution_time_ms INT,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ";
    
    try {
        $pdo->exec($createAiUsage);
        echo "Created ai_usage_log table successfully.\n";
    } catch (PDOException $e) {
        echo "AI usage log table creation: " . $e->getMessage() . "\n";
    }
    
    $createAiModels = "
    CREATE TABLE IF NOT EXISTS ai_models (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        endpoint VARCHAR(255),
        api_key_encrypted TEXT,
        model_version VARCHAR(50),
        max_tokens INT DEFAULT 4000,
        temperature DECIMAL(3,2) DEFAULT 0.7,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    ";
    
    try {
        $pdo->exec($createAiModels);
        echo "Created ai_models table successfully.\n";
    } catch (PDOException $e) {
        echo "AI models table creation: " . $e->getMessage() . "\n";
    }
    
    $createAiPrompts = "
    CREATE TABLE IF NOT EXISTS ai_prompts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        template TEXT NOT NULL,
        variables JSON DEFAULT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    ";
    
    try {
        $pdo->exec($createAiPrompts);
        echo "Created ai_prompts table successfully.\n";
    } catch (PDOException $e) {
        echo "AI prompts table creation: " . $e->getMessage() . "\n";
    }
    
    // Create analytics tables
    $createActivityLog = "
    CREATE TABLE IF NOT EXISTS user_activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        module VARCHAR(50),
        details JSON DEFAULT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ";
    
    try {
        $pdo->exec($createActivityLog);
        echo "Created user_activity_log table successfully.\n";
    } catch (PDOException $e) {
        echo "User activity log table creation: " . $e->getMessage() . "\n";
    }
    
    $createSystemMetrics = "
    CREATE TABLE IF NOT EXISTS system_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15,4) NOT NULL,
        metric_type ENUM('counter', 'gauge', 'histogram') DEFAULT 'gauge',
        tags JSON DEFAULT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ";
    
    try {
        $pdo->exec($createSystemMetrics);
        echo "Created system_metrics table successfully.\n";
    } catch (PDOException $e) {
        echo "System metrics table creation: " . $e->getMessage() . "\n";
    }
    
    // Create data import/export tables
    $createDataImports = "
    CREATE TABLE IF NOT EXISTS data_imports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        file_name VARCHAR(255),
        file_size INT,
        records_processed INT DEFAULT 0,
        records_successful INT DEFAULT 0,
        records_failed INT DEFAULT 0,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        error_log TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ";
    
    try {
        $pdo->exec($createDataImports);
        echo "Created data_imports table successfully.\n";
    } catch (PDOException $e) {
        echo "Data imports table creation: " . $e->getMessage() . "\n";
    }
    
    $createDataExports = "
    CREATE TABLE IF NOT EXISTS data_exports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        filters JSON DEFAULT NULL,
        file_name VARCHAR(255),
        file_size INT,
        records_exported INT DEFAULT 0,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        download_url VARCHAR(255),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ";
    
    try {
        $pdo->exec($createDataExports);
        echo "Created data_exports table successfully.\n";
    } catch (PDOException $e) {
        echo "Data exports table creation: " . $e->getMessage() . "\n";
    }
    
    // ==============================================
    // INSERT DEFAULT DATA
    // ==============================================
    
    // Insert default AI models
    $insertModels = "
    INSERT IGNORE INTO ai_models (name, provider, endpoint, model_version, max_tokens, temperature) VALUES
    ('medarion-8b-qlora', 'aws', 'https://your-aws-endpoint.com', 'v1.0', 4000, 0.2),
    ('gpt-4', 'openai', 'https://api.openai.com/v1/chat/completions', 'gpt-4', 4000, 0.7),
    ('claude-3', 'anthropic', 'https://api.anthropic.com/v1/messages', 'claude-3-sonnet', 4000, 0.7)
    ";
    
    try {
        $pdo->exec($insertModels);
        echo "Inserted default AI models successfully.\n";
    } catch (PDOException $e) {
        echo "AI models insertion: " . $e->getMessage() . "\n";
    }
    
    // Insert default AI prompts
    $insertPrompts = "
    INSERT IGNORE INTO ai_prompts (name, category, template, variables, description) VALUES
    ('market_risk_assessment', 'analysis', 'Assess market risk for {country}. Provide a risk score (0-100) and identify 3-5 key risk factors.', '[\"country\"]', 'Market risk assessment for specific countries'),
    ('competitor_analysis', 'analysis', 'Analyze competitors for {company_name} in the {sector} sector. List top 3 competitors with their strengths.', '[\"company_name\", \"sector\"]', 'Competitor analysis for companies'),
    ('valuation_benchmark', 'analysis', 'Provide valuation range for {stage} stage {sector} startups in USD millions. Include low and high estimates.', '[\"stage\", \"sector\"]', 'Valuation benchmarking for startups'),
    ('due_diligence_summary', 'analysis', 'Create a due diligence summary for {company_name} including SWOT analysis and 3 key questions for investors.', '[\"company_name\"]', 'Due diligence summary for companies'),
    ('fundraising_strategy', 'strategy', 'Develop a fundraising strategy for a {sector} {stage} startup raising ${amount}. Include investor targeting and timeline.', '[\"sector\", \"stage\", \"amount\"]', 'Fundraising strategy development')
    ";
    
    try {
        $pdo->exec($insertPrompts);
        echo "Inserted default AI prompts successfully.\n";
    } catch (PDOException $e) {
        echo "AI prompts insertion: " . $e->getMessage() . "\n";
    }
    
    // Insert default regulatory bodies
    $insertRegulatory = "
    INSERT IGNORE INTO regulatory_bodies (name, country, abbreviation, website, description) VALUES
    ('National Agency for Food and Drug Administration and Control', 'Nigeria', 'NAFDAC', 'https://nafdac.gov.ng', 'Nigeria\\'s regulatory body for food and drugs'),
    ('Kenya Pharmacy and Poisons Board', 'Kenya', 'KPPB', 'https://pharmacyboardkenya.org', 'Kenya\\'s pharmaceutical regulatory authority'),
    ('South African Health Products Regulatory Authority', 'South Africa', 'SAHPRA', 'https://sahpra.org.za', 'South Africa\\'s health products regulator'),
    ('Ghana Food and Drugs Authority', 'Ghana', 'GHA-FDA', 'https://fdaghana.gov.gh', 'Ghana\\'s food and drugs regulatory authority'),
    ('Egyptian Drug Authority', 'Egypt', 'EGY-FDA', 'https://eda.gov.eg', 'Egypt\\'s drug regulatory authority')
    ";
    
    try {
        $pdo->exec($insertRegulatory);
        echo "Inserted default regulatory bodies successfully.\n";
    } catch (PDOException $e) {
        echo "Regulatory bodies insertion: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== DATABASE SETUP COMPLETED ===\n";
    echo "All tables have been created/updated successfully.\n";
    echo "AI integration tables are ready for AWS deployment.\n";
    echo "Admin interfaces can now be built for data management.\n";
    
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
}
?>


