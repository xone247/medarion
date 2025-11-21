-- Medarion Platform Database Creation Script
-- This script creates the database and initial tables for the Medarion platform

CREATE DATABASE IF NOT EXISTS medarion_platform;
USE medarion_platform;

-- Users table for account management
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role ENUM('admin', 'investor', 'startup', 'researcher', 'regulator') DEFAULT 'startup',
    company_name VARCHAR(100),
    phone VARCHAR(20),
    country VARCHAR(50),
    city VARCHAR(50),
    bio TEXT,
    profile_image VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies table for startup and investor companies
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    industry VARCHAR(50),
    stage ENUM('idea', 'mvp', 'early', 'growth', 'mature') DEFAULT 'idea',
    founded_year INT,
    employees_count INT,
    headquarters VARCHAR(100),
    funding_stage VARCHAR(50),
    total_funding DECIMAL(15,2),
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Deals table for investment deals
CREATE TABLE IF NOT EXISTS deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    deal_type ENUM('seed', 'series_a', 'series_b', 'series_c', 'series_d', 'ipo', 'acquisition', 'merger') NOT NULL,
    amount DECIMAL(15,2),
    valuation DECIMAL(15,2),
    lead_investor VARCHAR(100),
    participants TEXT,
    deal_date DATE,
    status ENUM('announced', 'closed', 'pending', 'cancelled') DEFAULT 'announced',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Grants table for research grants and funding
CREATE TABLE IF NOT EXISTS grants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    funding_agency VARCHAR(100),
    amount DECIMAL(15,2),
    grant_type ENUM('research', 'development', 'innovation', 'startup', 'academic') DEFAULT 'research',
    application_deadline DATE,
    award_date DATE,
    status ENUM('open', 'closed', 'awarded', 'cancelled') DEFAULT 'open',
    requirements TEXT,
    contact_email VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clinical trials table
CREATE TABLE IF NOT EXISTS clinical_trials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    phase ENUM('phase_1', 'phase_2', 'phase_3', 'phase_4', 'preclinical') NOT NULL,
    medical_condition VARCHAR(100),
    intervention VARCHAR(100),
    sponsor VARCHAR(100),
    location VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status ENUM('recruiting', 'active', 'completed', 'suspended', 'terminated') DEFAULT 'recruiting',
    nct_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Newsletter subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    company VARCHAR(100),
    interests JSON,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL
);

-- Africa countries reference data for interactive map and analytics
CREATE TABLE IF NOT EXISTS africa_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    capital VARCHAR(100) NOT NULL,
    currency VARCHAR(100) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    flag VARCHAR(16) NOT NULL,
    population BIGINT NOT NULL,
    languages JSON NOT NULL,
    gdp DECIMAL(20,2) NOT NULL,
    gdp_per_capita DECIMAL(15,2) NOT NULL,
    area DECIMAL(15,2) NOT NULL,
    iso_code VARCHAR(2) NOT NULL UNIQUE,
    longitude DECIMAL(10,6) NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_africa_countries_iso_code ON africa_countries(iso_code);
CREATE INDEX idx_africa_countries_name ON africa_countries(name);

-- User sessions table for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_stage ON companies(stage);
CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_deals_deal_type ON deals(deal_type);
CREATE INDEX idx_deals_deal_date ON deals(deal_date);
CREATE INDEX idx_grants_status ON grants(status);
CREATE INDEX idx_grants_grant_type ON grants(grant_type);
CREATE INDEX idx_clinical_trials_phase ON clinical_trials(phase);
CREATE INDEX idx_clinical_trials_status ON clinical_trials(status);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Insert some sample data
INSERT INTO users (username, email, password_hash, first_name, last_name, role, company_name, is_verified) VALUES
('admin', 'admin@medarion.com', '$2b$10$example_hash', 'Admin', 'User', 'admin', 'Medarion', TRUE),
('john_doe', 'john@example.com', '$2b$10$example_hash', 'John', 'Doe', 'investor', 'Venture Capital Inc', TRUE),
('jane_smith', 'jane@startup.com', '$2b$10$example_hash', 'Jane', 'Smith', 'startup', 'HealthTech Startup', TRUE);

INSERT INTO companies (name, description, industry, stage, founded_year, employees_count, headquarters) VALUES
('HealthTech Startup', 'Revolutionary healthcare technology solutions', 'Healthcare Technology', 'early', 2022, 15, 'San Francisco, CA'),
('BioInnovate Labs', 'Advanced biotechnology research and development', 'Biotechnology', 'growth', 2020, 50, 'Boston, MA'),
('MedDevice Corp', 'Medical device manufacturing and innovation', 'Medical Devices', 'mature', 2018, 200, 'Austin, TX');

INSERT INTO deals (company_id, deal_type, amount, valuation, lead_investor, deal_date, status) VALUES
(1, 'seed', 5000000.00, 20000000.00, 'TechVentures', '2024-01-15', 'closed'),
(2, 'series_a', 15000000.00, 60000000.00, 'BioCapital', '2024-02-20', 'closed'),
(3, 'series_b', 25000000.00, 100000000.00, 'MedInvest', '2024-03-10', 'announced');

INSERT INTO grants (title, description, funding_agency, amount, grant_type, application_deadline, status) VALUES
('NIH Research Grant', 'Advanced cancer research funding', 'National Institutes of Health', 500000.00, 'research', '2024-12-31', 'open'),
('SBIR Phase II', 'Small Business Innovation Research', 'National Science Foundation', 750000.00, 'innovation', '2024-11-30', 'open'),
('EU Horizon Grant', 'European Union research funding', 'European Commission', 2000000.00, 'research', '2024-10-15', 'open');

INSERT INTO clinical_trials (title, description, phase, medical_condition, intervention, sponsor, location, status) VALUES
('Novel Cancer Treatment', 'Testing new immunotherapy approach', 'phase_2', 'Lung Cancer', 'Immunotherapy Drug X', 'BioInnovate Labs', 'Multiple Sites', 'recruiting'),
('Diabetes Management', 'Advanced glucose monitoring system', 'phase_3', 'Type 2 Diabetes', 'Continuous Glucose Monitor', 'MedDevice Corp', 'US Clinical Centers', 'active');

INSERT INTO blog_posts (title, slug, content, excerpt, author_id, status, published_at) VALUES
('The Future of Healthcare Technology', 'future-healthcare-technology', 'Healthcare technology is rapidly evolving...', 'Exploring the latest trends in healthcare technology', 1, 'published', NOW()),
('Investment Trends in MedTech', 'investment-trends-medtech', 'The medical technology sector is seeing unprecedented growth...', 'Analysis of current investment patterns in medical technology', 2, 'published', NOW());

('HealthTech Startup', 'Revolutionary healthcare technology solutions', 'Healthcare Technology', 'early', 2022, 15, 'San Francisco, CA'),
('BioInnovate Labs', 'Advanced biotechnology research and development', 'Biotechnology', 'growth', 2020, 50, 'Boston, MA'),
('MedDevice Corp', 'Medical device manufacturing and innovation', 'Medical Devices', 'mature', 2018, 200, 'Austin, TX');

INSERT INTO deals (company_id, deal_type, amount, valuation, lead_investor, deal_date, status) VALUES
(1, 'seed', 5000000.00, 20000000.00, 'TechVentures', '2024-01-15', 'closed'),
(2, 'series_a', 15000000.00, 60000000.00, 'BioCapital', '2024-02-20', 'closed'),
(3, 'series_b', 25000000.00, 100000000.00, 'MedInvest', '2024-03-10', 'announced');

INSERT INTO grants (title, description, funding_agency, amount, grant_type, application_deadline, status) VALUES
('NIH Research Grant', 'Advanced cancer research funding', 'National Institutes of Health', 500000.00, 'research', '2024-12-31', 'open'),
('SBIR Phase II', 'Small Business Innovation Research', 'National Science Foundation', 750000.00, 'innovation', '2024-11-30', 'open'),
('EU Horizon Grant', 'European Union research funding', 'European Commission', 2000000.00, 'research', '2024-10-15', 'open');

INSERT INTO clinical_trials (title, description, phase, medical_condition, intervention, sponsor, location, status) VALUES
('Novel Cancer Treatment', 'Testing new immunotherapy approach', 'phase_2', 'Lung Cancer', 'Immunotherapy Drug X', 'BioInnovate Labs', 'Multiple Sites', 'recruiting'),
('Diabetes Management', 'Advanced glucose monitoring system', 'phase_3', 'Type 2 Diabetes', 'Continuous Glucose Monitor', 'MedDevice Corp', 'US Clinical Centers', 'active');

INSERT INTO blog_posts (title, slug, content, excerpt, author_id, status, published_at) VALUES
('The Future of Healthcare Technology', 'future-healthcare-technology', 'Healthcare technology is rapidly evolving...', 'Exploring the latest trends in healthcare technology', 1, 'published', NOW()),
('Investment Trends in MedTech', 'investment-trends-medtech', 'The medical technology sector is seeing unprecedented growth...', 'Analysis of current investment patterns in medical technology', 2, 'published', NOW());
