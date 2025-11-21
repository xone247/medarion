-- Seed Demo Data for All Modules
-- This script populates the database with demo data for testing and development
-- Run this after creating all tables

USE medarion_platform;

-- ==============================================
-- COMPANIES DEMO DATA
-- ==============================================
INSERT INTO companies (name, description, website, industry, sector, stage, founded_year, employees_count, headquarters, country, funding_stage, total_funding, logo_url) VALUES
('MedTech Africa', 'AI-powered diagnostic solutions for African healthcare', 'https://medtech.africa', 'Healthcare Technology', 'AI Diagnostics', 'growth', 2020, 150, 'Lagos, Nigeria', 'Nigeria', 'Series B', 5000000.00, NULL),
('TeleHealth Kenya', 'Telemedicine platform connecting patients with doctors', 'https://telehealth.ke', 'Healthcare Technology', 'Telemedicine', 'growth', 2019, 200, 'Nairobi, Kenya', 'Kenya', 'Series A', 3000000.00, NULL),
('PharmaData Ghana', 'Pharmaceutical data analytics platform', 'https://pharmadata.gh', 'Healthcare Technology', 'Data Analytics', 'early', 2021, 50, 'Accra, Ghana', 'Ghana', 'Seed', 500000.00, NULL),
('HealthVenture SA', 'Healthcare investment and consulting', 'https://healthventure.co.za', 'Healthcare Services', 'Consulting', 'mature', 2015, 300, 'Cape Town, South Africa', 'South Africa', 'Series C', 10000000.00, NULL),
('BioLab Nigeria', 'Biotechnology research and development', 'https://biolab.ng', 'Biotechnology', 'Research', 'early', 2022, 75, 'Abuja, Nigeria', 'Nigeria', 'Seed', 750000.00, NULL);

-- ==============================================
-- DEALS DEMO DATA
-- ==============================================
INSERT INTO deals (company_id, company_name, deal_type, amount, valuation, lead_investor, participants, deal_date, status, sector, country, description) VALUES
(1, 'MedTech Africa', 'Series B', 5000000.00, 25000000.00, 'African Health Ventures', JSON_ARRAY('African Health Ventures', 'TechInvest Africa', 'Global Health Fund'), '2024-01-15', 'closed', 'AI Diagnostics', 'Nigeria', 'Series B funding round for expansion'),
(2, 'TeleHealth Kenya', 'Series A', 3000000.00, 15000000.00, 'East Africa Ventures', JSON_ARRAY('East Africa Ventures', 'Kenya Health Fund'), '2024-02-20', 'closed', 'Telemedicine', 'Kenya', 'Series A funding for platform expansion'),
(3, 'PharmaData Ghana', 'Seed', 500000.00, 2500000.00, 'Ghana Tech Fund', JSON_ARRAY('Ghana Tech Fund'), '2024-03-10', 'closed', 'Data Analytics', 'Ghana', 'Seed funding for product development'),
(4, 'HealthVenture SA', 'Series C', 10000000.00, 50000000.00, 'South Africa Capital', JSON_ARRAY('South Africa Capital', 'International Health Investors'), '2024-04-05', 'closed', 'Consulting', 'South Africa', 'Series C funding for international expansion'),
(5, 'BioLab Nigeria', 'Seed', 750000.00, 3000000.00, 'Nigerian Biotech Fund', JSON_ARRAY('Nigerian Biotech Fund'), '2024-05-12', 'closed', 'Research', 'Nigeria', 'Seed funding for research facilities');

-- ==============================================
-- GRANTS DEMO DATA
-- ==============================================
INSERT INTO grants (title, description, funding_agency, amount, grant_type, application_deadline, status, country, sector, duration_months, funders, eligibility_criteria) VALUES
('African Health Innovation Grant', 'Supporting innovative healthcare solutions in Africa', 'African Development Bank', 250000.00, 'Innovation', '2024-12-31', 'open', 'Nigeria', 'Healthcare Technology', 24, JSON_ARRAY('African Development Bank'), JSON_ARRAY('African-based companies', 'Healthcare focus', 'Innovation component')),
('Telemedicine Expansion Fund', 'Funding for telemedicine platform development', 'WHO Africa', 500000.00, 'Development', '2024-11-30', 'open', 'Kenya', 'Telemedicine', 18, JSON_ARRAY('WHO Africa'), JSON_ARRAY('Telemedicine focus', 'African market', 'Scalable solution')),
('Biotech Research Grant', 'Research funding for biotechnology projects', 'Ghana Science Foundation', 150000.00, 'Research', '2024-10-15', 'open', 'Ghana', 'Biotechnology', 36, JSON_ARRAY('Ghana Science Foundation'), JSON_ARRAY('Research institutions', 'Biotech focus', 'Ghana-based')),
('Healthcare Data Analytics Grant', 'Supporting data analytics in healthcare', 'South Africa Health Department', 300000.00, 'Innovation', '2024-09-30', 'open', 'South Africa', 'Data Analytics', 24, JSON_ARRAY('South Africa Health Department'), JSON_ARRAY('Data analytics focus', 'Healthcare application', 'South Africa-based'));

-- ==============================================
-- INVESTORS DEMO DATA
-- ==============================================
INSERT INTO investors (name, logo, description, type, headquarters, founded_year, assets_under_management, website, focus_sectors, investment_stages, countries, contact_email) VALUES
('African Health Ventures', NULL, 'Leading healthcare-focused VC in Africa', 'VC', 'Lagos, Nigeria', 2018, 50000000.00, 'https://ahv.africa', JSON_ARRAY('Healthcare Technology', 'Telemedicine', 'AI Diagnostics'), JSON_ARRAY('Seed', 'Series A', 'Series B'), JSON_ARRAY('Nigeria', 'Kenya', 'Ghana', 'South Africa'), 'contact@ahv.africa'),
('East Africa Ventures', NULL, 'Venture capital for East African startups', 'VC', 'Nairobi, Kenya', 2019, 30000000.00, 'https://eav.ke', JSON_ARRAY('Healthcare Technology', 'Telemedicine'), JSON_ARRAY('Seed', 'Series A'), JSON_ARRAY('Kenya', 'Tanzania', 'Uganda'), 'info@eav.ke'),
('Ghana Tech Fund', NULL, 'Technology investment fund for Ghana', 'VC', 'Accra, Ghana', 2020, 20000000.00, 'https://gtf.gh', JSON_ARRAY('Healthcare Technology', 'Data Analytics'), JSON_ARRAY('Seed', 'Series A'), JSON_ARRAY('Ghana'), 'contact@gtf.gh'),
('South Africa Capital', NULL, 'Major investment fund in South Africa', 'PE', 'Cape Town, South Africa', 2015, 200000000.00, 'https://sacapital.co.za', JSON_ARRAY('Healthcare Services', 'Consulting'), JSON_ARRAY('Series B', 'Series C', 'Private Equity'), JSON_ARRAY('South Africa'), 'info@sacapital.co.za');

-- ==============================================
-- CLINICAL TRIALS DEMO DATA
-- ==============================================
INSERT INTO clinical_trials (title, description, phase, medical_condition, indication, intervention, sponsor, location, country, start_date, end_date, status, nct_number, company_id) VALUES
('Malaria Vaccine Trial Phase III', 'Phase III clinical trial for new malaria vaccine', 'Phase III', 'Malaria', 'Prevention', 'Vaccine', 'African Health Research', 'Lagos, Nigeria', 'Nigeria', '2024-01-01', '2025-12-31', 'Recruiting', 'NCT12345678', 1),
('HIV Treatment Study', 'Clinical trial for new HIV treatment protocol', 'Phase II', 'HIV/AIDS', 'Treatment', 'Antiretroviral Therapy', 'Kenya Medical Research', 'Nairobi, Kenya', 'Kenya', '2024-02-01', '2025-06-30', 'Active', 'NCT23456789', 2),
('Diabetes Management Trial', 'Trial for AI-powered diabetes management', 'Phase I', 'Diabetes', 'Management', 'AI System', 'Ghana Health Research', 'Accra, Ghana', 'Ghana', '2024-03-01', '2024-12-31', 'Recruiting', 'NCT34567890', 3);

-- ==============================================
-- REGULATORY DEMO DATA
-- ==============================================
INSERT INTO company_regulatory (company_id, regulatory_body_id, status, application_date, approval_date, product_name, description) VALUES
(1, 1, 'approved', '2023-06-01', '2023-09-15', 'MedTech Diagnostic AI', 'AI diagnostic tool approval'),
(2, 2, 'pending', '2024-01-10', NULL, 'TeleHealth Platform', 'Telemedicine platform registration'),
(3, 3, 'approved', '2023-11-01', '2024-02-20', 'PharmaData Analytics', 'Data analytics platform approval');

-- ==============================================
-- REGULATORY BODIES DEMO DATA
-- ==============================================
INSERT INTO regulatory_bodies (name, country, abbreviation, website, description, jurisdiction) VALUES
('National Agency for Food and Drug Administration and Control', 'Nigeria', 'NAFDAC', 'https://nafdac.gov.ng', 'Regulatory body for food, drugs, and medical devices in Nigeria', 'Nigeria'),
('Pharmacy and Poisons Board', 'Kenya', 'PPB', 'https://pharmacyboardkenya.org', 'Regulatory authority for pharmaceuticals in Kenya', 'Kenya'),
('Food and Drugs Authority', 'Ghana', 'FDA', 'https://fdaghana.gov.gh', 'Regulatory body for food and drugs in Ghana', 'Ghana'),
('South African Health Products Regulatory Authority', 'South Africa', 'SAHPRA', 'https://sahpra.org.za', 'Regulatory authority for health products in South Africa', 'South Africa');

-- ==============================================
-- PUBLIC MARKETS DEMO DATA
-- ==============================================
INSERT INTO public_stocks (company_name, ticker, exchange, price, market_cap, currency, sector, country) VALUES
('MedPharm Ltd', 'MEDP', 'JSE', 45.50, '500M', 'ZAR', 'Pharmaceutical', 'South Africa'),
('HealthCare Group', 'HCG', 'NSE', 125.00, '1.2B', 'NGN', 'Healthcare Services', 'Nigeria'),
('BioTech Africa', 'BTA', 'GSE', 8.75, '150M', 'GHS', 'Biotechnology', 'Ghana');

-- ==============================================
-- CLINICAL CENTERS DEMO DATA
-- ==============================================
INSERT INTO clinical_centers (name, country, city, address, website, description, specializations, phases_supported, capacity_patients, established_year) VALUES
('Lagos Clinical Research Center', 'Nigeria', 'Lagos', '123 Medical Street, Lagos', 'https://lcrc.ng', 'Leading clinical research facility in Nigeria', JSON_ARRAY('Infectious Diseases', 'Cardiology'), JSON_ARRAY('Phase I', 'Phase II', 'Phase III'), 500, 2015),
('Nairobi Medical Research Institute', 'Kenya', 'Nairobi', '456 Health Avenue, Nairobi', 'https://nmri.ke', 'Premier medical research institute in East Africa', JSON_ARRAY('HIV/AIDS', 'Tropical Medicine'), JSON_ARRAY('Phase II', 'Phase III'), 300, 2010),
('Accra Clinical Trials Center', 'Ghana', 'Accra', '789 Research Road, Accra', 'https://actc.gh', 'State-of-the-art clinical trials facility', JSON_ARRAY('Vaccines', 'Public Health'), JSON_ARRAY('Phase I', 'Phase II'), 200, 2018);

-- ==============================================
-- INVESTIGATORS DEMO DATA
-- ==============================================
INSERT INTO investigators (name, title, institution, country, city, email, phone, specialties, therapeutic_areas, experience_years, education, certifications) VALUES
('Dr. Adebayo Okafor', 'Principal Investigator', 'Lagos Clinical Research Center', 'Nigeria', 'Lagos', 'adebayo.okafor@lcrc.ng', '+234-123-456-7890', JSON_ARRAY('Infectious Diseases'), JSON_ARRAY('Malaria', 'HIV/AIDS'), 15, JSON_ARRAY('MD', 'PhD'), JSON_ARRAY('GCP Certified')),
('Dr. Wanjiku Kamau', 'Senior Researcher', 'Nairobi Medical Research Institute', 'Kenya', 'Nairobi', 'wanjiku.kamau@nmri.ke', '+254-123-456-789', JSON_ARRAY('Tropical Medicine'), JSON_ARRAY('Malaria', 'TB'), 12, JSON_ARRAY('MD', 'MPH'), JSON_ARRAY('GCP Certified')),
('Dr. Kofi Mensah', 'Clinical Investigator', 'Accra Clinical Trials Center', 'Ghana', 'Accra', 'kofi.mensah@actc.gh', '+233-123-456-789', JSON_ARRAY('Vaccines'), JSON_ARRAY('Vaccines', 'Public Health'), 10, JSON_ARRAY('MD'), JSON_ARRAY('GCP Certified'));

-- ==============================================
-- NATION PULSE DEMO DATA
-- ==============================================
INSERT INTO nation_pulse_data (country, country_code, data_type, metric_name, metric_value, metric_unit, year, source) VALUES
('Nigeria', 'NGA', 'population', 'Total Population', 223804632, 'people', 2024, 'World Bank'),
('Nigeria', 'NGA', 'healthcare_infrastructure', 'Doctors per 1000', 0.4, 'doctors/1000', 2023, 'WHO'),
('Nigeria', 'NGA', 'economic_indicators', 'GDP per Capita', 2250, 'USD', 2023, 'World Bank'),
('Kenya', 'KEN', 'population', 'Total Population', 56973973, 'people', 2024, 'World Bank'),
('Kenya', 'KEN', 'healthcare_infrastructure', 'Hospital Beds per 1000', 1.4, 'beds/1000', 2023, 'WHO'),
('Kenya', 'KEN', 'economic_indicators', 'GDP per Capita', 2100, 'USD', 2023, 'World Bank'),
('Ghana', 'GHA', 'population', 'Total Population', 34121985, 'people', 2024, 'World Bank'),
('Ghana', 'GHA', 'healthcare_infrastructure', 'Health Expenditure % of GDP', 4.2, 'percentage', 2023, 'WHO'),
('South Africa', 'ZAF', 'population', 'Total Population', 60414495, 'people', 2024, 'World Bank'),
('South Africa', 'ZAF', 'healthcare_infrastructure', 'Life Expectancy', 64.1, 'years', 2023, 'WHO');

-- ==============================================
-- GLOSSARY DEMO DATA
-- ==============================================
INSERT INTO glossary_terms (term, definition, category, examples, source) VALUES
('Pre-money Valuation', 'The value of a company before receiving new investment. Used to determine the price per share for new investors.', 'funding', 'A company valued at $5M pre-money raising $1M would be worth $6M post-money.', 'Industry Standard'),
('Convertible Note', 'A form of short-term debt that converts into equity, typically in conjunction with a future financing round.', 'funding', 'A $100K convertible note with 20% discount converts to equity at the next round.', 'Industry Standard'),
('Market Authorization', 'Official approval from a regulatory body to market and sell a medical product in a specific country or region.', 'regulation', 'NAFDAC market authorization required to sell pharmaceuticals in Nigeria.', 'Regulatory Standard'),
('Clinical Hold', 'A regulatory action that suspends a clinical trial, preventing enrollment of new patients or administration of the investigational product.', 'regulation', 'FDA placed a clinical hold due to safety concerns.', 'Regulatory Standard'),
('Phase I Trial', 'First stage of clinical trials testing a new drug or treatment in a small group of healthy volunteers to assess safety.', 'clinical', 'Phase I trial typically involves 20-100 participants.', 'Clinical Research Standard'),
('Informed Consent', 'Process where research participants are informed about the study risks and benefits before agreeing to participate.', 'clinical', 'All clinical trial participants must provide informed consent.', 'Clinical Research Standard'),
('Due Diligence', 'Comprehensive investigation of a business or investment opportunity before making a financial commitment.', 'business', 'Investors conduct due diligence before closing a deal.', 'Business Standard'),
('Term Sheet', 'Non-binding document outlining the basic terms and conditions of an investment deal.', 'business', 'Term sheet includes valuation, investment amount, and key terms.', 'Business Standard'),
('API', 'Application Programming Interface - a set of protocols and tools for building software applications.', 'technical', 'REST API allows frontend to communicate with backend.', 'Technical Standard'),
('Machine Learning', 'A subset of artificial intelligence that enables systems to learn and improve from experience without explicit programming.', 'technical', 'Machine learning algorithms can predict disease outcomes.', 'Technical Standard');

-- ==============================================
-- CRM INVESTORS DEMO DATA (User-specific, so we'll create template entries)
-- Note: These should be created per user, but we'll add a few examples
-- ==============================================
-- Note: user_id should match an actual user ID in the users table
-- INSERT INTO crm_investors (user_id, name, type, focus, email, phone, pipeline_stage, notes) VALUES
-- (1, 'Example VC Fund', 'VC', 'Healthcare', 'contact@example.com', '+234-123-456-7890', 'Contacted', 'Interested in Series A deals');

-- ==============================================
-- SUMMARY
-- ==============================================
-- This script seeds:
-- - 5 Companies
-- - 5 Deals
-- - 4 Grants
-- - 4 Investors
-- - 3 Clinical Trials
-- - 3 Regulatory Approvals
-- - 4 Regulatory Bodies
-- - 3 Public Stocks
-- - 3 Clinical Centers
-- - 3 Investigators
-- - 10 Nation Pulse Data Points
-- - 10 Glossary Terms

