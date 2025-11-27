# Data Enrichment Plan - Companies Module

## Current Status (From Database Query)

### Sample Companies Found:
1. **mPharma** - Has: name, description, website, industry, sector, stage, country, headquarters
2. **54gene** - Has: name, description, website, industry, sector, stage, country, headquarters
3. **LifeBank** - Has: name, description, website, industry, sector, stage, country, headquarters
4. **Helium Health** - Has: name, description, website, industry, sector, stage, country, headquarters
5. **WellaHealth** - Has: name, description, website, industry, sector, stage, country, headquarters

### Missing Fields (ALL Companies):
- ❌ `logo_url` - **CRITICAL** (User reported logos not showing)
- ❌ `founded_year` - NULL
- ❌ `employees_count` - NULL
- ❌ `funding_stage` - NULL
- ❌ `total_funding` - NULL (User specifically mentioned funding is absent)
- ❌ `last_funding_date` - NULL
- ❌ `investors` (JSON) - NULL
- ❌ `products` (JSON) - NULL
- ❌ `markets` (JSON) - NULL
- ❌ `achievements` (JSON) - NULL
- ❌ `partnerships` (JSON) - NULL
- ❌ `awards` (JSON) - NULL

## Data Sources & Scraping Strategy

### 1. Logo URLs (Priority: CRITICAL)

**Sources:**
- Company websites (favicon, logo images)
- Crunchbase (company logos)
- LinkedIn (company page logos)
- Google Images (company name + logo)

**Implementation:**
```python
# Script: scripts/download_company_logos.py
# - Download logos from multiple sources
# - Resize to 200x200px
# - Store in /public/uploads/company/
# - Update logo_url in database
```

**Target:** All 286 companies need logos

### 2. Funding Data (Priority: CRITICAL - User Reported)

**Sources:**
- **Deals Table** - Aggregate funding from existing deals
- Crunchbase - Funding rounds and amounts
- News articles - Funding announcements

**Implementation:**
```sql
-- Aggregate from deals table
UPDATE companies c
SET 
  total_funding = (
    SELECT COALESCE(SUM(amount), 0)
    FROM deals d
    WHERE d.company_name = c.name
  ),
  last_funding_date = (
    SELECT MAX(deal_date)
    FROM deals d
    WHERE d.company_name = c.name
  ),
  funding_stage = (
    SELECT deal_type
    FROM deals d
    WHERE d.company_name = c.name
    ORDER BY deal_date DESC
    LIMIT 1
  ),
  investors = (
    SELECT JSON_ARRAYAGG(DISTINCT lead_investor)
    FROM deals d
    WHERE d.company_name = c.name
    WHERE lead_investor IS NOT NULL
  )
WHERE EXISTS (SELECT 1 FROM deals WHERE company_name = c.name);
```

**Target:** All companies with deals (367 deals available)

### 3. Company Details (Priority: HIGH)

**Sources:**
- Crunchbase - Founded year, employees, headquarters details
- LinkedIn - Employee count, founded year
- Company websites - About pages

**Fields to Populate:**
- `founded_year` - Year company was founded
- `employees_count` - Number of employees
- `headquarters` - Full address (currently just country name)

**Implementation:**
```python
# Script: scripts/enrich_company_details.py
# - Scrape Crunchbase for each company
# - Extract founded year, employees, headquarters
# - Update database
```

**Target:** All 286 companies

### 4. JSON Arrays (Priority: MEDIUM)

**Products:**
- Source: Company websites, Crunchbase
- Extract: Product names, services offered

**Markets:**
- Source: Company websites, Crunchbase
- Extract: Geographic markets, target sectors

**Achievements:**
- Source: News articles, company websites
- Extract: Milestones, achievements, recognitions

**Partnerships:**
- Source: News articles, company websites
- Extract: Partnership announcements

**Awards:**
- Source: Company websites, news articles
- Extract: Awards and recognitions

**Implementation:**
```python
# Script: scripts/enrich_company_json_fields.py
# - Scrape company websites
# - Parse news articles
# - Extract JSON array data
# - Update database
```

## Implementation Plan

### Phase 1: Aggregate Funding from Deals (IMMEDIATE)
**Script:** `scripts/aggregate_funding_from_deals.sql`
- Aggregate total_funding from deals table
- Set last_funding_date from most recent deal
- Set funding_stage from most recent deal type
- Extract investors from deal participants

**Estimated Impact:** ~200+ companies will get funding data

### Phase 2: Download Company Logos (HIGH PRIORITY)
**Script:** `scripts/download_all_company_logos.py`
- Use existing logo download infrastructure
- Download from company websites
- Download from Crunchbase
- Store in `/public/uploads/company/`
- Update `logo_url` field

**Estimated Impact:** All 286 companies will have logos

### Phase 3: Enrich Company Details (HIGH PRIORITY)
**Script:** `scripts/enrich_company_details.py`
- Scrape Crunchbase for founded_year, employees_count
- Improve headquarters information
- Update database

**Estimated Impact:** All 286 companies will have complete details

### Phase 4: Populate JSON Arrays (MEDIUM PRIORITY)
**Script:** `scripts/enrich_company_json_fields.py`
- Scrape products from company websites
- Extract markets from company information
- Find achievements from news articles
- Identify partnerships
- Collect awards

**Estimated Impact:** Enhanced data for all companies

## Data Scraping Tools & Libraries

### Recommended Tools:
1. **BeautifulSoup** - Web scraping
2. **Selenium** - JavaScript-heavy sites
3. **Requests** - HTTP requests
4. **Pillow** - Image processing
5. **Crunchbase API** (if available) or web scraping

### Rate Limiting:
- Add delays between requests (1-2 seconds)
- Use rotating user agents
- Respect robots.txt

## Database Update Scripts

### 1. Aggregate Funding Data
```sql
-- scripts/aggregate_funding_from_deals.sql
UPDATE companies c
SET 
  total_funding = COALESCE((
    SELECT SUM(amount)
    FROM deals d
    WHERE d.company_name = c.name AND d.amount IS NOT NULL
  ), 0),
  last_funding_date = (
    SELECT MAX(deal_date)
    FROM deals d
    WHERE d.company_name = c.name AND d.deal_date IS NOT NULL
  ),
  funding_stage = (
    SELECT deal_type
    FROM deals d
    WHERE d.company_name = c.name AND d.deal_date IS NOT NULL
    ORDER BY deal_date DESC
    LIMIT 1
  )
WHERE EXISTS (
  SELECT 1 FROM deals WHERE company_name = c.name
);
```

### 2. Update Investors from Deals
```sql
-- Extract investors from deals
UPDATE companies c
SET investors = (
  SELECT JSON_ARRAYAGG(DISTINCT lead_investor)
  FROM deals d
  WHERE d.company_name = c.name 
    AND lead_investor IS NOT NULL
    AND lead_investor != ''
)
WHERE EXISTS (
  SELECT 1 FROM deals 
  WHERE company_name = c.name 
    AND lead_investor IS NOT NULL
);
```

## Logo URL Format

### Current Structure:
- Storage: `/public/uploads/company/{company_name_slug}.png`
- URL Format: `https://api.medarion.africa/uploads/company/{filename}`

### Update Pattern:
```sql
UPDATE companies
SET logo_url = CONCAT('https://api.medarion.africa/uploads/company/', 
  LOWER(REPLACE(REPLACE(name, ' ', '_'), '-', '_')), '.png')
WHERE logo_url IS NULL;
```

## Priority Order

1. **CRITICAL** - Logo URLs (visual display issue)
2. **CRITICAL** - Funding data (user specifically mentioned)
3. **HIGH** - Founded year, employees count
4. **HIGH** - Improved headquarters information
5. **MEDIUM** - JSON arrays (investors, products, markets)
6. **MEDIUM** - Achievements, partnerships, awards

## Expected Outcomes

### After Phase 1 (Funding Aggregation):
- ✅ ~200+ companies with total_funding populated
- ✅ ~200+ companies with last_funding_date
- ✅ ~200+ companies with funding_stage
- ✅ ~200+ companies with investors array

### After Phase 2 (Logo Download):
- ✅ All 286 companies with logo_url populated
- ✅ Logos visible in frontend

### After Phase 3 (Company Details):
- ✅ All 286 companies with founded_year
- ✅ All 286 companies with employees_count
- ✅ Improved headquarters information

### After Phase 4 (JSON Arrays):
- ✅ Enhanced company profiles with products, markets, achievements, partnerships, awards

## Next Steps

1. ✅ Create `aggregate_funding_from_deals.sql` script
2. ✅ Create `download_all_company_logos.py` script
3. ✅ Create `enrich_company_details.py` script
4. ✅ Create `enrich_company_json_fields.py` script
5. ✅ Execute scripts in priority order
6. ✅ Verify data in browser
7. ✅ Update seed file with enriched data

