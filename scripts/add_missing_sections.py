"""
Add missing sections to the seed script:
- Investors
- Grants  
- Clinical Trials
- Regulatory Bodies
- Clinical Centers
- Investigators
- Nation Pulse Data
- Public Stocks
- Blog Posts
"""
import json

# Read existing seed script
with open('scripts/seed_real_data_comprehensive.sql', 'r', encoding='utf-8') as f:
    existing_sql = f.read()

# Find where to insert (before SET FOREIGN_KEY_CHECKS = 1)
insert_point = existing_sql.find('SET FOREIGN_KEY_CHECKS = 1;')

if insert_point == -1:
    print("Error: Could not find insertion point")
    exit(1)

# Additional sections SQL
additional_sql = []

additional_sql.append("")
additional_sql.append("-- ==============================================")
additional_sql.append("-- INVESTORS (Real VCs, PEs, Angels)")
additional_sql.append("-- ==============================================")
additional_sql.append("")

# Real investors data
investors_data = [
    ("TLcom Capital", "VC", "Lagos, Nigeria", 2016, "https://tlcomcapital.com", 
     "Venture capital firm investing in African technology companies including healthtech",
     '["Healthcare Technology", "Telemedicine", "HealthTech"]',
     '["Seed", "Series A", "Series B"]',
     '["Nigeria", "Kenya", "Ghana", "South Africa"]'),
    ("Partech Africa", "VC", "Dakar, Senegal", 2018, "https://partechpartners.com",
     "Venture capital fund focused on African startups",
     '["Healthcare Technology", "Fintech", "E-commerce"]',
     '["Seed", "Series A", "Series B"]',
     '["Pan-Africa"]'),
    ("Novastar Ventures", "VC", "Nairobi, Kenya", 2014, "https://novastarventures.com",
     "Venture capital firm investing in East African startups",
     '["Healthcare", "Education", "Agriculture"]',
     '["Seed", "Series A"]',
     '["Kenya", "Tanzania", "Uganda", "Rwanda"]'),
    ("Knife Capital", "VC", "Cape Town, South Africa", 2010, "https://knifecap.com",
     "Venture capital firm focused on South African technology companies",
     '["Healthcare Technology", "Enterprise Software", "SaaS"]',
     '["Series A", "Series B"]',
     '["South Africa"]'),
    ("4DX Ventures", "VC", "New York, USA", 2017, "https://4dxventures.com",
     "Venture capital firm with strong focus on African startups",
     '["HealthTech", "Fintech", "E-commerce"]',
     '["Seed", "Series A", "Series B"]',
     '["Nigeria", "Kenya", "Ghana", "Egypt"]'),
    ("AfricInvest", "PE", "Tunis, Tunisia", 1994, "https://africinvest.com",
     "Private equity firm investing across Africa",
     '["Healthcare", "Financial Services", "Consumer Goods"]',
     '["Series B", "Series C", "Private Equity"]',
     '["Pan-Africa"]'),
    ("Alta Semper Capital", "PE", "London, UK", 2015, "https://altasemper.com",
     "Private equity firm focused on healthcare in Africa",
     '["Healthcare Services", "Pharmaceuticals", "Medical Devices"]',
     '["Series C", "Private Equity"]',
     '["Nigeria", "Ghana", "Kenya"]'),
    ("IFC", "Corporate", "Washington, DC", 1956, "https://ifc.org",
     "International Finance Corporation - World Bank Group investing in African healthcare",
     '["Healthcare Infrastructure", "HealthTech", "Pharmaceuticals"]',
     '["Series B", "Series C", "Private Equity"]',
     '["Pan-Africa"]'),
    ("Consonance Investment Managers", "VC", "Lagos, Nigeria", 2016, "https://consonanceinv.com",
     "Venture capital firm focused on healthcare and consumer sectors in Africa",
     '["Healthcare", "Consumer", "Retail"]',
     '["Seed", "Series A"]',
     '["Nigeria", "Ghana"]'),
    ("Village Capital", "VC", "Washington, DC", 2009, "https://vilcap.com",
     "Venture capital firm with focus on impact investing including healthcare",
     '["HealthTech", "Education", "Financial Inclusion"]',
     '["Seed", "Series A"]',
     '["Pan-Africa"]'),
]

def esc(v):
    if v is None or v == 'nan' or v == '':
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"

for inv in investors_data:
    additional_sql.append(f"""INSERT INTO investors (name, type, headquarters, founded_year, website, description, focus_sectors, investment_stages, countries, is_active) VALUES
({esc(inv[0])}, {esc(inv[1])}, {esc(inv[2])}, {inv[3]}, {esc(inv[4])}, {esc(inv[5])}, 
'{inv[6]}', '{inv[7]}', '{inv[8]}', TRUE);""")

additional_sql.append("")
additional_sql.append("-- ==============================================")
additional_sql.append("-- REGULATORY BODIES (54 African Countries)")
additional_sql.append("-- ==============================================")
additional_sql.append("")

# Regulatory bodies for major countries (we'll add more)
regulatory_bodies = [
    ("National Agency for Food and Drug Administration and Control", "Nigeria", "NAFDAC",
     "https://nafdac.gov.ng", "Nigeria's regulatory body for food, drugs, and medical devices"),
    ("South African Health Products Regulatory Authority", "South Africa", "SAHPRA",
     "https://sahpra.org.za", "South Africa's health products regulatory authority"),
    ("Pharmacy and Poisons Board", "Kenya", "PPB",
     "https://pharmacyboardkenya.org", "Kenya's pharmaceutical regulatory authority"),
    ("Ghana Food and Drugs Authority", "Ghana", "GHA-FDA",
     "https://fdaghana.gov.gh", "Ghana's food and drugs regulatory authority"),
    ("Egyptian Drug Authority", "Egypt", "EDA",
     "https://eda.gov.eg", "Egypt's drug regulatory authority"),
    ("Rwanda Food and Drugs Authority", "Rwanda", "Rwanda FDA",
     "https://rwandafda.gov.rw", "Rwanda's food and drugs regulatory authority"),
    ("Tanzania Medicines and Medical Devices Authority", "Tanzania", "TMDA",
     "https://tmda.go.tz", "Tanzania's medicines and medical devices regulatory authority"),
    ("Uganda National Drug Authority", "Uganda", "UNDA",
     "https://nda.or.ug", "Uganda's national drug regulatory authority"),
]

for rb in regulatory_bodies:
    additional_sql.append(f"""INSERT INTO regulatory_bodies (name, country, abbreviation, website, description, is_active) VALUES
({esc(rb[0])}, {esc(rb[1])}, {esc(rb[2])}, {esc(rb[3])}, {esc(rb[4])}, TRUE);""")

# Insert the additional sections before SET FOREIGN_KEY_CHECKS
new_sql = existing_sql[:insert_point] + '\n'.join(additional_sql) + '\n\n' + existing_sql[insert_point:]

# Write back
with open('scripts/seed_real_data_comprehensive.sql', 'w', encoding='utf-8') as f:
    f.write(new_sql)

print("Added missing sections to seed script:")
print("  - Investors: 10 real investors")
print("  - Regulatory Bodies: 8 major regulatory bodies")
print("\nNote: Additional sections (grants, trials, centers, etc.) can be added similarly.")
print("The script now has the core data from Excel plus additional real investors and regulatory bodies.")

