"""
Restore africa_countries and glossary_terms that were accidentally removed
"""
import json
import re

# Load Excel data
with open('parsed_excel_data.json', 'r', encoding='utf-8') as f:
    excel_data = json.load(f)

# Read current seed script
with open('scripts/seed_real_data_comprehensive.sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

def esc(v):
    if v is None or v == 'nan' or v == '':
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"

# Find insertion point (after SET FOREIGN_KEY_CHECKS = 0)
insert_point = sql_content.find('SET FOREIGN_KEY_CHECKS = 0;') + len('SET FOREIGN_KEY_CHECKS = 0;')

# Restore countries and glossary
restore_sql = []

# 1. AFRICA COUNTRIES
restore_sql.append("")
restore_sql.append("-- ==============================================")
restore_sql.append("-- AFRICA COUNTRIES (54 countries from Excel)")
restore_sql.append("-- ==============================================")
restore_sql.append("")

iso_codes = {
    'Algeria': 'DZ', 'Angola': 'AO', 'Benin': 'BJ', 'Botswana': 'BW',
    'Burkina Faso': 'BF', 'Burundi': 'BI', 'Cabo Verde(Cape Verde)': 'CV', 'Cameroon': 'CM',
    'Central African Republic': 'CF', 'Chad': 'TD', 'Comoros': 'KM', 'Congo': 'CG',
    'Côte d\'Ivoire(Ivory Coast)': 'CI', 'Democratic Republic of the Congo': 'CD',
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

for country in excel_data['countries']:
    name = country['name']
    iso_code = iso_codes.get(name, name[:2].upper() if len(name) >= 2 else 'XX')
    
    # Parse languages
    langs_str = str(country.get('Official Language(s)', ''))
    langs = [l.strip() for l in langs_str.split(',') if l.strip()]
    langs_json = json.dumps(langs) if langs else '[]'
    
    # Parse GDP
    gdp_str = str(country.get('GDP (latest, USD)', '0'))
    gdp = 0
    if 'million' in gdp_str.lower():
        try:
            num_str = re.sub(r'[^\d.]', '', gdp_str.split('million')[0])
            gdp = float(num_str) * 1000000 if num_str else 0
        except:
            gdp = 0
    
    # Parse GDP per capita
    gdp_pc_str = str(country.get('GDP per Capita (USD)', '0'))
    gdp_per_capita = 0
    try:
        gdp_per_capita = float(re.sub(r'[^\d.]', '', gdp_pc_str.split('(')[0])) if gdp_pc_str != '0' else 0
    except:
        gdp_per_capita = 0
    
    restore_sql.append(f"""INSERT INTO africa_countries (name, capital, currency, flag, population, languages, gdp, gdp_per_capita, area, iso_code, longitude, latitude) VALUES
({esc(name)}, {esc(country.get('Capital City', ''))}, {esc(country.get('Currency', ''))}, 
{esc(country.get('National Flag (URL)', ''))}, {country.get('population', 0)}, '{langs_json}', 
{gdp}, {gdp_per_capita}, {country.get('area', 0)}, 
{esc(iso_code)}, 0.0, 0.0);""")

# 2. GLOSSARY TERMS
restore_sql.append("")
restore_sql.append("-- ==============================================")
restore_sql.append("-- GLOSSARY TERMS (from Excel)")
restore_sql.append("-- ==============================================")
restore_sql.append("")

# Create table if not exists
restore_sql.append("""
CREATE TABLE IF NOT EXISTS glossary_terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    category ENUM('funding', 'regulation', 'clinical', 'business', 'technical') DEFAULT 'funding',
    related_terms JSON DEFAULT NULL,
    examples TEXT,
    source VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_term_category (term, category),
    INDEX idx_category (category),
    INDEX idx_term (term)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")
restore_sql.append("")

# Clinical terms
restore_sql.append("-- Clinical Trial Terms")
for term in excel_data['clinical_terms']:
    if term.get('term') and term['term'] != 'nan' and term['term'].lower() != 'terms':
        restore_sql.append(f"""INSERT INTO glossary_terms (term, definition, category, source) VALUES
({esc(term['term'])}, {esc(term.get('definition', ''))}, 
{esc(term.get('category', 'clinical'))}, 'Clinical Trial Registry');""")

restore_sql.append("")
restore_sql.append("-- Funding & Grants Terms")
for term in excel_data['grants_terms']:
    if term.get('term') and term['term'] != 'nan' and term['term'].lower() != 'terms':
        restore_sql.append(f"""INSERT INTO glossary_terms (term, definition, category, source) VALUES
({esc(term['term'])}, {esc(term.get('definition', ''))}, 
{esc(term.get('category', 'funding'))}, 'Industry Standard');""")

restore_sql.append("")
restore_sql.append("-- Regulatory Terms")
for term in excel_data['regulatory_terms']:
    if term.get('term') and term['term'] != 'nan' and term['term'].lower() != 'terms':
        restore_sql.append(f"""INSERT INTO glossary_terms (term, definition, category, source) VALUES
({esc(term['term'])}, {esc(term.get('definition', ''))}, 
{esc(term.get('category', 'regulatory'))}, 'Regulatory Authority');""")

restore_sql.append("")

# Insert at the beginning (after SET FOREIGN_KEY_CHECKS = 0)
new_sql = sql_content[:insert_point] + '\n' + '\n'.join(restore_sql) + '\n' + sql_content[insert_point:]

# Write back
with open('scripts/seed_real_data_comprehensive.sql', 'w', encoding='utf-8') as f:
    f.write(new_sql)

print("=" * 60)
print("RESTORED MISSING SECTIONS!")
print("=" * 60)
print(f"✓ Africa Countries: {len(excel_data['countries'])} records restored")
print(f"✓ Glossary Terms: {len(excel_data['clinical_terms']) + len(excel_data['grants_terms']) + len(excel_data['regulatory_terms'])} records restored")
print("\nAll modules now complete!")






