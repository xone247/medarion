# Missing Fields Analysis - Companies Module

## Overview
Analysis of missing/empty fields in the companies data to plan comprehensive data scraping and population.

## Database Schema (Expected Fields)

### Core Company Information
- ✅ `id` - Primary key
- ✅ `name` - Company name
- ⚠️ `description` - Company description/bio
- ⚠️ `website` - Company website URL
- ⚠️ `industry` - Industry classification
- ⚠️ `sector` - Healthcare sector (AI Diagnostics, Telemedicine, etc.)
- ⚠️ `stage` - Development stage (idea, mvp, early, growth, mature)

### Company Details
- ⚠️ `founded_year` - Year company was founded
- ⚠️ `employees_count` - Number of employees
- ⚠️ `headquarters` - Headquarters location
- ⚠️ `country` - Country of operation

### Funding Information (CRITICAL - User Reported Missing)
- ⚠️ `funding_stage` - Current funding stage
- ⚠️ `total_funding` - Total funding amount (DECIMAL)
- ⚠️ `last_funding_date` - Date of last funding round (DATE)

### Visual Assets (CRITICAL - User Reported Missing)
- ⚠️ `logo_url` - Company logo URL/path

### JSON Fields (Arrays)
- ⚠️ `investors` - JSON array of investor names
- ⚠️ `products` - JSON array of product names
- ⚠️ `markets` - JSON array of target markets
- ⚠️ `achievements` - JSON array of achievements
- ⚠️ `partnerships` - JSON array of partnerships
- ⚠️ `awards` - JSON array of awards

## Current Status Analysis

### Fields Currently Missing/Empty (Based on API Response)
1. **Logo URLs** - Not showing where they should
2. **Funding Data** - Total funding, funding stage, last funding date
3. **Company Details** - Founded year, employees, headquarters
4. **JSON Arrays** - Investors, products, markets, achievements, partnerships, awards
5. **Descriptions** - Company descriptions/bios
6. **Sector Classification** - Healthcare sector details

## Data Sources for Scraping

### Primary Sources
1. **Crunchbase** - Comprehensive company data including:
   - Funding rounds and amounts
   - Investor information
   - Company descriptions
   - Logos
   - Employee counts
   - Founded dates

2. **Company Websites** - Direct scraping for:
   - Company descriptions
   - Product information
   - Logo images
   - About pages

3. **LinkedIn** - Company profiles for:
   - Employee counts
   - Company descriptions
   - Headquarters location

4. **Deals Database** - Aggregate from deals table:
   - Total funding (sum of deal amounts)
   - Last funding date (most recent deal)
   - Investors (from deal participants)
   - Funding stage (from deal types)

5. **News Articles** - For:
   - Achievements
   - Partnerships
   - Awards

## Data Population Plan

### Phase 1: Core Company Information
- [ ] Company names (already have)
- [ ] Descriptions (scrape from websites/Crunchbase)
- [ ] Websites (verify and update)
- [ ] Industry/Sector classification
- [ ] Stage classification

### Phase 2: Company Details
- [ ] Founded year (Crunchbase, company websites)
- [ ] Employees count (LinkedIn, Crunchbase)
- [ ] Headquarters (Crunchbase, company websites)
- [ ] Country (extract from headquarters or set explicitly)

### Phase 3: Funding Information (HIGH PRIORITY)
- [ ] Total funding (aggregate from deals table + Crunchbase)
- [ ] Last funding date (from deals table + Crunchbase)
- [ ] Funding stage (from most recent deal type)
- [ ] Investors (aggregate from deals table + Crunchbase)

### Phase 4: Visual Assets (HIGH PRIORITY)
- [ ] Logo URLs (download from company websites, Crunchbase, LinkedIn)
- [ ] Store logos in `/public/uploads/company/`
- [ ] Update `logo_url` field with correct paths

### Phase 5: JSON Arrays
- [ ] Products (scrape from company websites)
- [ ] Markets (geographic and sector markets)
- [ ] Achievements (news articles, company websites)
- [ ] Partnerships (news articles, company websites)
- [ ] Awards (company websites, news articles)

## Implementation Strategy

### 1. Aggregate from Deals Table
```sql
-- Update total_funding from deals
UPDATE companies c
SET total_funding = (
  SELECT COALESCE(SUM(amount), 0)
  FROM deals d
  WHERE d.company_name = c.name
);

-- Update last_funding_date from deals
UPDATE companies c
SET last_funding_date = (
  SELECT MAX(deal_date)
  FROM deals d
  WHERE d.company_name = c.name
);

-- Update investors from deals
UPDATE companies c
SET investors = (
  SELECT JSON_ARRAYAGG(DISTINCT lead_investor)
  FROM deals d
  WHERE d.company_name = c.name AND lead_investor IS NOT NULL
);
```

### 2. Scrape Missing Data
- Use Crunchbase API or web scraping
- Company website scraping
- LinkedIn profile scraping
- News article parsing

### 3. Logo Download and Storage
- Download logos from multiple sources
- Resize and optimize images
- Store in `/public/uploads/company/`
- Update `logo_url` with correct paths

## Priority Order

1. **CRITICAL** - Logo URLs (visual display issue)
2. **CRITICAL** - Funding data (user specifically mentioned)
3. **HIGH** - Company descriptions
4. **HIGH** - Founded year, employees, headquarters
5. **MEDIUM** - JSON arrays (investors, products, markets)
6. **MEDIUM** - Achievements, partnerships, awards

## Next Steps

1. Create script to aggregate funding data from deals table
2. Create script to scrape company data from Crunchbase
3. Create script to download and process company logos
4. Create script to populate JSON arrays from various sources
5. Update seed data with complete information
6. Re-seed database with enriched data

