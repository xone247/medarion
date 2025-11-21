-- Comprehensive Database Schema for Medarion Platform
-- This script creates all necessary tables for all modules with AI integration support
-- Date: October 27, 2025

CREATE DATABASE IF NOT EXISTS medarion_platform;
USE medarion_platform;

-- ==============================================
-- CORE USER MANAGEMENT TABLES
-- ==============================================

-- Enhanced users table with all required fields
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role ENUM('admin', 'investor', 'startup', 'researcher', 'regulator', 'executive', 'media') DEFAULT 'startup',
    user_type ENUM('investors_finance', 'startup', 'health_science_experts', 'industry_executives', 'media_advisors') DEFAULT 'startup',
    account_tier ENUM('free', 'paid', 'academic', 'enterprise') DEFAULT 'free',
    app_roles JSON DEFAULT NULL, -- Array of admin roles: ['super_admin', 'blog_admin', 'content_editor', 'ads_admin']
    company_name VARCHAR(100),
    phone VARCHAR(20),
    country VARCHAR(50),
    city VARCHAR(50),
    bio TEXT,
    profile_image VARCHAR(255),
    dashboard_modules JSON DEFAULT NULL, -- Array of enabled modules
    module_order JSON DEFAULT NULL, -- Custom module ordering
    ai_quota_used INT DEFAULT 0,
    ai_quota_reset_date DATE DEFAULT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- COMPANIES MODULE TABLES
-- ==============================================

-- Enhanced companies table
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    industry VARCHAR(50),
    sector VARCHAR(50), -- Healthcare sector: AI Diagnostics, Telemedicine, etc.
    stage ENUM('idea', 'mvp', 'early', 'growth', 'mature') DEFAULT 'idea',
    founded_year INT,
    employees_count INT,
    headquarters VARCHAR(100),
    country VARCHAR(50),
    funding_stage VARCHAR(50),
    total_funding DECIMAL(15,2) DEFAULT 0,
    last_funding_date DATE NULL,
    logo_url VARCHAR(255),
    investors JSON DEFAULT NULL, -- Array of investor names
    products JSON DEFAULT NULL, -- Array of product names
    markets JSON DEFAULT NULL, -- Array of target markets
    achievements JSON DEFAULT NULL, -- Array of achievements
    partnerships JSON DEFAULT NULL, -- Array of partnerships
    awards JSON DEFAULT NULL, -- Array of awards
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================================
-- DEALS MODULE TABLES
-- ==============================================

-- Enhanced deals table
CREATE TABLE IF NOT EXISTS deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    company_name VARCHAR(100) NOT NULL,
    deal_type ENUM('Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Private Equity', 'Grant', 'Acquisition') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    valuation DECIMAL(15,2) NULL,
    lead_investor VARCHAR(100),
    participants JSON DEFAULT NULL, -- Array of all investors
    deal_date DATE NOT NULL,
    status ENUM('announced', 'closed', 'pending', 'cancelled') DEFAULT 'announced',
    sector VARCHAR(50),
    country VARCHAR(50),
    description TEXT,
    source_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- ==============================================
-- GRANTS MODULE TABLES
-- ==============================================

-- Enhanced grants table
CREATE TABLE IF NOT EXISTS grants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    funding_agency VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2),
    grant_type ENUM('Research', 'Innovation', 'Development', 'Capacity Building', 'Pilot', 'Scale-up') DEFAULT 'Research',
    application_deadline DATE,
    award_date DATE NULL,
    status ENUM('open', 'closed', 'awarded', 'completed') DEFAULT 'open',
    requirements TEXT,
    contact_email VARCHAR(100),
    website VARCHAR(255),
    country VARCHAR(50),
    sector VARCHAR(50),
    duration_months INT,
    funders JSON DEFAULT NULL, -- Array of funder names
    eligibility_criteria JSON DEFAULT NULL, -- Array of criteria
    application_process TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================================
-- CLINICAL TRIALS MODULE TABLES
-- ==============================================

-- Enhanced clinical trials table
CREATE TABLE IF NOT EXISTS clinical_trials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    phase ENUM('Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Preclinical', 'Research') NOT NULL,
    medical_condition VARCHAR(100),
    indication VARCHAR(100),
    intervention VARCHAR(100),
    sponsor VARCHAR(100),
    location VARCHAR(100),
    country VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status ENUM('Recruiting', 'Active', 'Completed', 'Suspended', 'Terminated', 'Not Yet Recruiting') DEFAULT 'Recruiting',
    nct_number VARCHAR(20),
    trial_id VARCHAR(50),
    company_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- ==============================================
-- INVESTORS MODULE TABLES
-- ==============================================

-- Investors table
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
    focus_sectors JSON DEFAULT NULL, -- Array of sectors
    investment_stages JSON DEFAULT NULL, -- Array of stages
    portfolio_companies JSON DEFAULT NULL, -- Array of company names
    total_investments INT DEFAULT 0,
    average_investment DECIMAL(15,2),
    countries JSON DEFAULT NULL, -- Array of countries
    team_size INT,
    contact_email VARCHAR(100),
    social_media JSON DEFAULT NULL, -- Array of social media links
    recent_investments JSON DEFAULT NULL, -- Array of recent deals
    investment_criteria JSON DEFAULT NULL, -- Array of criteria
    portfolio_exits JSON DEFAULT NULL, -- Array of exits
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================================
-- PUBLIC MARKETS MODULE TABLES
-- ==============================================

-- Public stocks table
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
);

-- ==============================================
-- REGULATORY MODULE TABLES
-- ==============================================

-- Regulatory bodies table
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
);

-- Company regulatory approvals
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
);

-- ==============================================
-- CLINICAL CENTERS MODULE TABLES
-- ==============================================

-- Clinical centers table
CREATE TABLE IF NOT EXISTS clinical_centers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    city VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    description TEXT,
    specialties JSON DEFAULT NULL, -- Array of specialties
    phases_supported JSON DEFAULT NULL, -- Array of supported phases
    capacity_patients INT,
    established_year INT,
    accreditation JSON DEFAULT NULL, -- Array of accreditations
    contact_info JSON DEFAULT NULL,
    facilities JSON DEFAULT NULL, -- Array of facilities
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================================
-- INVESTIGATORS MODULE TABLES
-- ==============================================

-- Investigators table
CREATE TABLE IF NOT EXISTS investigators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(50),
    institution VARCHAR(100),
    country VARCHAR(50),
    city VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    specialties JSON DEFAULT NULL, -- Array of specialties
    therapeutic_areas JSON DEFAULT NULL, -- Array of therapeutic areas
    trial_count INT DEFAULT 0,
    experience_years INT,
    education JSON DEFAULT NULL, -- Array of education
    certifications JSON DEFAULT NULL, -- Array of certifications
    publications_count INT DEFAULT 0,
    languages JSON DEFAULT NULL, -- Array of languages
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================================
-- NATION PULSE MODULE TABLES
-- ==============================================

-- Nation pulse data table
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
);

-- ==============================================
-- FUNDRAISING CRM MODULE TABLES
-- ==============================================

-- CRM investors table
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
);

-- CRM meetings table
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
);

-- ==============================================
-- AI INTEGRATION TABLES
-- ==============================================

-- AI usage tracking
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
);

-- AI model configurations
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
);

-- AI prompts and templates
CREATE TABLE IF NOT EXISTS ai_prompts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    template TEXT NOT NULL,
    variables JSON DEFAULT NULL, -- Array of variable names
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================================
-- CONTENT MANAGEMENT TABLES
-- ==============================================

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT,
    excerpt TEXT,
    author_id INT,
    featured_image VARCHAR(255),
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    tags JSON DEFAULT NULL, -- Array of tags
    categories JSON DEFAULT NULL, -- Array of categories
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Newsletter subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    company VARCHAR(100),
    interests JSON DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL
);

-- ==============================================
-- ADVERTISEMENT TABLES
-- ==============================================

-- Sponsored ads table
CREATE TABLE IF NOT EXISTS sponsored_ads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    link_url VARCHAR(255),
    advertiser VARCHAR(100),
    ad_type ENUM('banner', 'sidebar', 'inline', 'popup') DEFAULT 'banner',
    target_audience JSON DEFAULT NULL, -- Array of target roles/tiers
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    spent DECIMAL(10,2) DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    status ENUM('draft', 'active', 'paused', 'completed', 'cancelled') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================================
-- ANALYTICS AND TRACKING TABLES
-- ==============================================

-- User activity log
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
);

-- System metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_type ENUM('counter', 'gauge', 'histogram') DEFAULT 'gauge',
    tags JSON DEFAULT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- DATA IMPORT/EXPORT TABLES
-- ==============================================

-- Data import logs
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
);

-- Data export logs
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
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_account_tier ON users(account_tier);
CREATE INDEX idx_users_country ON users(country);

-- Companies table indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_sector ON companies(sector);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_stage ON companies(stage);

-- Deals table indexes
CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_deals_date ON deals(deal_date);
CREATE INDEX idx_deals_sector ON deals(sector);
CREATE INDEX idx_deals_country ON deals(country);
CREATE INDEX idx_deals_type ON deals(deal_type);

-- Grants table indexes
CREATE INDEX idx_grants_agency ON grants(funding_agency);
CREATE INDEX idx_grants_country ON grants(country);
CREATE INDEX idx_grants_sector ON grants(sector);
CREATE INDEX idx_grants_deadline ON grants(application_deadline);

-- Clinical trials indexes
CREATE INDEX idx_trials_phase ON clinical_trials(phase);
CREATE INDEX idx_trials_status ON clinical_trials(status);
CREATE INDEX idx_trials_country ON clinical_trials(country);
CREATE INDEX idx_trials_company_id ON clinical_trials(company_id);

-- Investors table indexes
CREATE INDEX idx_investors_name ON investors(name);
CREATE INDEX idx_investors_type ON investors(type);
CREATE INDEX idx_investors_headquarters ON investors(headquarters);

-- AI usage indexes
CREATE INDEX idx_ai_usage_user_id ON ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_tool ON ai_usage_log(tool_name);
CREATE INDEX idx_ai_usage_date ON ai_usage_log(created_at);

-- Activity log indexes
CREATE INDEX idx_activity_user_id ON user_activity_log(user_id);
CREATE INDEX idx_activity_action ON user_activity_log(action);
CREATE INDEX idx_activity_module ON user_activity_log(module);
CREATE INDEX idx_activity_date ON user_activity_log(created_at);

-- ==============================================
-- INITIAL DATA SETUP
-- ==============================================

-- Insert default AI models
INSERT INTO ai_models (name, provider, endpoint, model_version, max_tokens, temperature) VALUES
('medarion-8b-qlora', 'aws', 'https://your-aws-endpoint.com', 'v1.0', 4000, 0.2),
('gpt-4', 'openai', 'https://api.openai.com/v1/chat/completions', 'gpt-4', 4000, 0.7),
('claude-3', 'anthropic', 'https://api.anthropic.com/v1/messages', 'claude-3-sonnet', 4000, 0.7);

-- Insert default AI prompts
INSERT INTO ai_prompts (name, category, template, variables, description) VALUES
('market_risk_assessment', 'analysis', 'Assess market risk for {country}. Provide a risk score (0-100) and identify 3-5 key risk factors.', '["country"]', 'Market risk assessment for specific countries'),
('competitor_analysis', 'analysis', 'Analyze competitors for {company_name} in the {sector} sector. List top 3 competitors with their strengths.', '["company_name", "sector"]', 'Competitor analysis for companies'),
('valuation_benchmark', 'analysis', 'Provide valuation range for {stage} stage {sector} startups in USD millions. Include low and high estimates.', '["stage", "sector"]', 'Valuation benchmarking for startups'),
('due_diligence_summary', 'analysis', 'Create a due diligence summary for {company_name} including SWOT analysis and 3 key questions for investors.', '["company_name"]', 'Due diligence summary for companies'),
('fundraising_strategy', 'strategy', 'Develop a fundraising strategy for a {sector} {stage} startup raising ${amount}. Include investor targeting and timeline.', '["sector", "stage", "amount"]', 'Fundraising strategy development');

-- Insert default regulatory bodies
INSERT INTO regulatory_bodies (name, country, abbreviation, website, description) VALUES
('National Agency for Food and Drug Administration and Control', 'Nigeria', 'NAFDAC', 'https://nafdac.gov.ng', 'Nigeria\'s regulatory body for food and drugs'),
('Kenya Pharmacy and Poisons Board', 'Kenya', 'KPPB', 'https://pharmacyboardkenya.org', 'Kenya\'s pharmaceutical regulatory authority'),
('South African Health Products Regulatory Authority', 'South Africa', 'SAHPRA', 'https://sahpra.org.za', 'South Africa\'s health products regulator'),
('Ghana Food and Drugs Authority', 'Ghana', 'GHA-FDA', 'https://fdaghana.gov.gh', 'Ghana\'s food and drugs regulatory authority'),
('Egyptian Drug Authority', 'Egypt', 'EGY-FDA', 'https://eda.gov.eg', 'Egypt\'s drug regulatory authority');

COMMIT;


