import json
import re
from datetime import datetime

# Load parsed Excel data
with open('parsed_excel_data.json', 'r', encoding='utf-8') as f:
    excel_data = json.load(f)

sql_output = []
sql_output.append("-- Comprehensive Real Data Seed Script for Medarion Platform")
sql_output.append("-- Generated from Excel files and additional research")
sql_output.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
sql_output.append("")
sql_output.append("USE medarion_platform;")
sql_output.append("")
sql_output.append("SET FOREIGN_KEY_CHECKS = 0;")
sql_output.append("")

def escape_sql(value):
    """Escape SQL values"""
    if value is None or value == 'nan' or value == '':
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    # Escape single quotes
    value = str(value).replace("'", "''")
    return f"'{value}'"

def escape_json(value):
    """Escape JSON array values"""
    if not value or value == 'nan':
        return 'NULL'
    if isinstance(value, list):
        return f"'{json.dumps(value)}'"
    return f"'{json.dumps([value])}'"

# 1. AFRICA COUNTRIES (from Excel)
sql_output.append("-- ==============================================")
sql_output.append("-- AFRICA COUNTRIES (54 countries from Excel)")
sql_output.append("-- ==============================================")
sql_output.append("")

for country in excel_data['countries']:
    # Parse languages
    languages_str = country.get('languages', '')
    languages_list = [lang.strip() for lang in languages_str.split(',') if lang.strip()]
    languages_json = json.dumps(languages_list) if languages_list else 'NULL'
    
    # Get ISO code from country name (simplified mapping)
    iso_codes = {
        'Algeria': 'DZ', 'Angola': 'AO', 'Benin': 'BJ', 'Botswana': 'BW',
        'Burkina Faso': 'BF', 'Burundi': 'BI', 'Cabo Verde': 'CV', 'Cameroon': 'CM',
        'Central African Republic': 'CF', 'Chad': 'TD', 'Comoros': 'KM', 'Congo': 'CG',
        'Côte d\'Ivoire': 'CI', 'Democratic Republic of the Congo': 'CD',
        'Djibouti': 'DJ', 'Egypt': 'EG', 'Equatorial Guinea': 'GQ', 'Eritrea': 'ER',
        'Eswatini': 'SZ', 'Ethiopia': 'ET', 'Gabon': 'GA', 'Gambia': 'GM',
        'Ghana': 'GH', 'Guinea': 'GN', 'Guinea-Bissau': 'GW', 'Kenya': 'KE',
        'Lesotho': 'LS', 'Liberia': 'LR', 'Libya': 'LY', 'Madagascar': 'MG',
        'Malawi': 'MW', 'Mali': 'ML', 'Mauritania': 'MR', 'Mauritius': 'MU',
        'Morocco': 'MA', 'Mozambique': 'MZ', 'Namibia': 'NA', 'Niger': 'NE',
        'Nigeria': 'NG', 'Rwanda': 'RW', 'São Tomé and Príncipe': 'ST', 'Senegal': 'SN',
        'Seychelles': 'SC', 'Sierra Leone': 'SL', 'Somalia': 'SO', 'South Africa': 'ZA',
        'South Sudan': 'SS', 'Sudan': 'SD', 'Tanzania': 'TZ', 'Togo': 'TG',
        'Tunisia': 'TN', 'Uganda': 'UG', 'Zambia': 'ZM', 'Zimbabwe': 'ZW'
    }
    iso_code = iso_codes.get(country['name'], country['name'][:2].upper())
    
    # Estimate coordinates (simplified - would need real coordinates)
    lat = 0.0
    lon = 0.0
    
    sql = f"""INSERT INTO africa_countries (name, capital, currency, flag, population, languages, gdp, gdp_per_capita, area, iso_code, longitude, latitude) VALUES
({escape_sql(country['name'])}, {escape_sql(country['capital'])}, {escape_sql(country['currency'])}, 
{escape_sql(country.get('flag_url', ''))}, {country.get('population', 0)}, '{languages_json}', 
{country.get('gdp', 0)}, {country.get('gdp_per_capita', 0)}, {country.get('area', 0)}, 
{escape_sql(iso_code)}, {lon}, {lat});"""
    sql_output.append(sql)

sql_output.append("")

# 2. COMPANIES (extract from deals, then supplement)
sql_output.append("-- ==============================================")
sql_output.append("-- COMPANIES (from deals data + additional research)")
sql_output.append("-- ==============================================")
sql_output.append("")

# Extract unique companies from deals
companies_from_deals = {}
for deal in excel_data['deals']:
    company_name = deal.get('company_name', '').strip()
    if company_name and company_name not in companies_from_deals:
        companies_from_deals[company_name] = {
            'name': company_name,
            'country': deal.get('country', ''),
            'website': deal.get('website', ''),
            'sector': deal.get('sector', ''),
            'description': deal.get('description', '')
        }

# Add companies from deals
company_id_map = {}
company_counter = 1
for company_name, company_data in companies_from_deals.items():
    # Determine stage based on deal type if available
    stage = 'growth'  # default
    
    # Extract website
    website = company_data.get('website', '').split(';')[0].strip() if company_data.get('website') else ''
    
    sql = f"""INSERT INTO companies (name, description, website, industry, sector, stage, country, headquarters, is_active) VALUES
({escape_sql(company_data['name'])}, {escape_sql(company_data.get('description', ''))}, 
{escape_sql(website)}, 'Healthcare Technology', {escape_sql(company_data.get('sector', ''))}, 
{escape_sql(stage)}, {escape_sql(company_data.get('country', ''))}, 
{escape_sql(company_data.get('country', ''))}, TRUE);"""
    sql_output.append(sql)
    company_id_map[company_name] = company_counter
    company_counter += 1

sql_output.append("")

# 3. DEALS (from Excel)
sql_output.append("-- ==============================================")
sql_output.append("-- DEALS (33 deals from Excel)")
sql_output.append("-- ==============================================")
sql_output.append("")

for deal in excel_data['deals']:
    company_name = deal.get('company_name', '').strip()
    company_id = company_id_map.get(company_name, 'NULL')
    
    # Parse deal type
    deal_type = deal.get('deal_type', 'Unknown').strip()
    if deal_type == 'nan' or not deal_type:
        deal_type = 'Seed'
    
    # Parse amount
    amount = deal.get('amount', 0)
    if amount == 0:
        amount = 'NULL'
    
    # Parse date
    deal_date = deal.get('deal_date', '')
    if deal_date and deal_date != 'Ongoing' and deal_date != 'nan':
        # Try to parse date
        try:
            if isinstance(deal_date, str):
                # Handle various date formats
                if len(deal_date) >= 10:
                    deal_date = deal_date[:10]
                else:
                    deal_date = '2024-01-01'  # default
        except:
            deal_date = '2024-01-01'
    else:
        deal_date = '2024-01-01'
    
    # Parse status
    status = deal.get('status', 'announced').lower()
    if status not in ['announced', 'closed', 'pending', 'cancelled']:
        status = 'announced'
    
    # Parse participants
    lead_investor = deal.get('lead_investor', '').strip()
    participants = [lead_investor] if lead_investor and lead_investor != 'nan' else []
    participants_json = json.dumps(participants) if participants else 'NULL'
    
    sql = f"""INSERT INTO deals (company_id, company_name, deal_type, amount, lead_investor, participants, deal_date, status, sector, country, description, source_url) VALUES
({company_id if company_id != 'NULL' else 'NULL'}, {escape_sql(company_name)}, {escape_sql(deal_type)}, 
{amount}, {escape_sql(lead_investor)}, '{participants_json}', {escape_sql(deal_date)}, 
{escape_sql(status)}, {escape_sql(deal.get('sector', ''))}, {escape_sql(deal.get('country', ''))}, 
{escape_sql(deal.get('description', ''))}, {escape_sql(deal.get('source_url', ''))});"""
    sql_output.append(sql)

sql_output.append("")

# 4. GLOSSARY TERMS (from Excel - clinical, grants, regulatory)
sql_output.append("-- ==============================================")
sql_output.append("-- GLOSSARY TERMS (from Excel)")
sql_output.append("-- ==============================================")
sql_output.append("")

# Check if glossary_terms table exists, if not we'll create it
sql_output.append("-- Clinical Trial Terms")
for term in excel_data['clinical_terms']:
    if term.get('term') and term['term'] != 'nan':
        sql = f"""INSERT INTO glossary_terms (term, definition, category, source) VALUES
({escape_sql(term['term'])}, {escape_sql(term.get('definition', ''))}, 
{escape_sql(term.get('category', 'clinical'))}, 'Clinical Trial Registry');"""
        sql_output.append(sql)

sql_output.append("")
sql_output.append("-- Funding & Grants Terms")
for term in excel_data['grants_terms']:
    if term.get('term') and term['term'] != 'nan':
        sql = f"""INSERT INTO glossary_terms (term, definition, category, source) VALUES
({escape_sql(term['term'])}, {escape_sql(term.get('definition', ''))}, 
{escape_sql(term.get('category', 'funding'))}, 'Industry Standard');"""
        sql_output.append(sql)

sql_output.append("")
sql_output.append("-- Regulatory Terms")
for term in excel_data['regulatory_terms']:
    if term.get('term') and term['term'] != 'nan':
        sql = f"""INSERT INTO glossary_terms (term, definition, category, source) VALUES
({escape_sql(term['term'])}, {escape_sql(term.get('definition', ''))}, 
{escape_sql(term.get('category', 'regulatory'))}, 'Regulatory Authority');"""
        sql_output.append(sql)

sql_output.append("")
sql_output.append("SET FOREIGN_KEY_CHECKS = 1;")
sql_output.append("")
sql_output.append("-- Seed script complete!")
sql_output.append(f"-- Total records inserted:")
sql_output.append(f"--   - Countries: {len(excel_data['countries'])}")
sql_output.append(f"--   - Companies: {len(companies_from_deals)}")
sql_output.append(f"--   - Deals: {len(excel_data['deals'])}")
sql_output.append(f"--   - Glossary Terms: {len(excel_data['clinical_terms']) + len(excel_data['grants_terms']) + len(excel_data['regulatory_terms'])}")

# Write SQL file
with open('scripts/seed_real_data_comprehensive.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_output))

print(f"SQL seed script generated: scripts/seed_real_data_comprehensive.sql")
print(f"  - Countries: {len(excel_data['countries'])}")
print(f"  - Companies: {len(companies_from_deals)}")
print(f"  - Deals: {len(excel_data['deals'])}")
print(f"  - Glossary Terms: {len(excel_data['clinical_terms']) + len(excel_data['grants_terms']) + len(excel_data['regulatory_terms'])}")






