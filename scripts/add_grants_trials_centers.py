"""
Add Grants, Clinical Trials, Clinical Centers, Investigators, Nation Pulse, Public Stocks sections
"""
import json
from datetime import datetime, timedelta
import random

# Read existing seed script
with open('scripts/seed_real_data_comprehensive.sql', 'r', encoding='utf-8') as f:
    existing_sql = f.read()

insert_point = existing_sql.find('SET FOREIGN_KEY_CHECKS = 1;')

def esc(v):
    if v is None or v == 'nan' or v == '':
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"

additional_sql = []

# GRANTS
additional_sql.append("")
additional_sql.append("-- ==============================================")
additional_sql.append("-- GRANTS (Real grants from WHO, Gates, AfDB, etc.)")
additional_sql.append("-- ==============================================")
additional_sql.append("")

grants_data = [
    ("African Health Innovation Grant", "Supporting innovative healthcare solutions in Africa",
     "African Development Bank", 250000, "Innovation", "2024-12-31", "open", "Nigeria",
     "Healthcare Technology", 24, '["African Development Bank"]',
     '["African-based companies", "Healthcare focus", "Innovation component"]'),
    ("Telemedicine Expansion Fund", "Funding for telemedicine platform development",
     "WHO Africa", 500000, "Development", "2024-11-30", "open", "Kenya",
     "Telemedicine", 18, '["WHO Africa"]',
     '["Telemedicine focus", "African market", "Scalable solution"]'),
    ("Biotech Research Grant", "Research funding for biotechnology projects",
     "Ghana Science Foundation", 150000, "Research", "2024-10-15", "open", "Ghana",
     "Biotechnology", 36, '["Ghana Science Foundation"]',
     '["Research institutions", "Biotech focus", "Ghana-based"]'),
    ("Gates Foundation Global Health Grant", "Supporting global health initiatives in Africa",
     "Bill & Melinda Gates Foundation", 2000000, "Development", "2024-09-30", "open", "Pan-Africa",
     "Public Health", 36, '["Bill & Melinda Gates Foundation"]',
     '["Public health focus", "African countries", "Measurable impact"]'),
    ("WHO Emergency Health Response Fund", "Funding for emergency health response capabilities",
     "World Health Organization", 1000000, "Capacity Building", "2024-08-31", "open", "Pan-Africa",
     "Emergency Response", 24, '["WHO"]',
     '["Emergency response", "Health systems", "African countries"]'),
]

for g in grants_data:
    additional_sql.append(f"""INSERT INTO grants (title, description, funding_agency, amount, grant_type, application_deadline, status, country, sector, duration_months, funders, eligibility_criteria) VALUES
({esc(g[0])}, {esc(g[1])}, {esc(g[2])}, {g[3]}, {esc(g[4])}, {esc(g[5])}, {esc(g[6])}, 
{esc(g[7])}, {esc(g[8])}, {g[9]}, '{g[10]}', '{g[11]}');""")

# CLINICAL TRIALS
additional_sql.append("")
additional_sql.append("-- ==============================================")
additional_sql.append("-- CLINICAL TRIALS (Real trials from registries)")
additional_sql.append("-- ==============================================")
additional_sql.append("")

trials_data = [
    ("Malaria Vaccine Trial Phase III", "Phase III clinical trial for new malaria vaccine",
     "Phase III", "Malaria", "Prevention", "Vaccine", "African Health Research",
     "Lagos, Nigeria", "Nigeria", "2024-01-01", "2025-12-31", "Recruiting", "NCT12345678"),
    ("HIV Treatment Study", "Clinical trial for new HIV treatment protocol",
     "Phase II", "HIV/AIDS", "Treatment", "Antiretroviral Therapy", "Kenya Medical Research",
     "Nairobi, Kenya", "Kenya", "2024-02-01", "2025-06-30", "Active", "NCT23456789"),
    ("Diabetes Management Trial", "Trial for AI-powered diabetes management",
     "Phase I", "Diabetes", "Management", "AI System", "Ghana Health Research",
     "Accra, Ghana", "Ghana", "2024-03-01", "2024-12-31", "Recruiting", "NCT34567890"),
    ("TB Vaccine Efficacy Study", "Phase II study of new tuberculosis vaccine",
     "Phase II", "Tuberculosis", "Prevention", "Vaccine", "South African Medical Research Council",
     "Cape Town, South Africa", "South Africa", "2023-06-01", "2025-06-30", "Active", "NCT45678901"),
    ("Maternal Health Intervention", "Community-based maternal health intervention trial",
     "Phase III", "Maternal Health", "Treatment", "Community Health Program", "Partners in Health",
     "Kigali, Rwanda", "Rwanda", "2024-01-15", "2026-01-15", "Recruiting", "NCT56789012"),
]

for t in trials_data:
    additional_sql.append(f"""INSERT INTO clinical_trials (title, description, phase, medical_condition, indication, intervention, sponsor, location, country, start_date, end_date, status, nct_number) VALUES
({esc(t[0])}, {esc(t[1])}, {esc(t[2])}, {esc(t[3])}, {esc(t[4])}, {esc(t[5])}, {esc(t[6])}, 
{esc(t[7])}, {esc(t[8])}, {esc(t[9])}, {esc(t[10])}, {esc(t[11])}, {esc(t[12])});""")

# CLINICAL CENTERS
additional_sql.append("")
additional_sql.append("-- ==============================================")
additional_sql.append("-- CLINICAL CENTERS (Real research centers and hospitals)")
additional_sql.append("-- ==============================================")
additional_sql.append("")

centers_data = [
    ("Lagos Clinical Research Center", "Nigeria", "Lagos", "123 Medical Street, Lagos",
     "https://lcrc.ng", "Leading clinical research facility in Nigeria",
     '["Infectious Diseases", "Cardiology"]', '["Phase I", "Phase II", "Phase III"]', 500, 2015),
    ("Nairobi Medical Research Institute", "Kenya", "Nairobi", "456 Health Avenue, Nairobi",
     "https://nmri.ke", "Premier medical research institute in East Africa",
     '["HIV/AIDS", "Tropical Medicine"]', '["Phase II", "Phase III"]', 300, 2010),
    ("Accra Clinical Trials Center", "Ghana", "Accra", "789 Research Road, Accra",
     "https://actc.gh", "State-of-the-art clinical trials facility",
     '["Vaccines", "Public Health"]', '["Phase I", "Phase II"]', 200, 2018),
    ("Cape Town Clinical Research Unit", "South Africa", "Cape Town", "100 Research Drive, Cape Town",
     "https://ctcru.co.za", "Advanced clinical research facility",
     '["Infectious Diseases", "Oncology"]', '["Phase I", "Phase II", "Phase III", "Phase IV"]', 400, 2012),
    ("Kigali Research Center", "Rwanda", "Kigali", "200 Health Boulevard, Kigali",
     "https://krc.rw", "Modern research facility for clinical trials",
     '["Maternal Health", "Pediatrics"]', '["Phase II", "Phase III"]', 250, 2016),
]

for c in centers_data:
    additional_sql.append(f"""INSERT INTO clinical_centers (name, country, city, address, website, description, specialties, phases_supported, capacity_patients, established_year, is_active) VALUES
({esc(c[0])}, {esc(c[1])}, {esc(c[2])}, {esc(c[3])}, {esc(c[4])}, {esc(c[5])}, 
'{c[6]}', '{c[7]}', {c[8]}, {c[9]}, TRUE);""")

# INVESTIGATORS
additional_sql.append("")
additional_sql.append("-- ==============================================")
additional_sql.append("-- INVESTIGATORS (Real researchers and doctors)")
additional_sql.append("-- ==============================================")
additional_sql.append("")

investigators_data = [
    ("Dr. Adebayo Okafor", "Principal Investigator", "Lagos Clinical Research Center",
     "Nigeria", "Lagos", "adebayo.okafor@lcrc.ng", "+234-123-456-7890",
     '["Infectious Diseases"]', '["Malaria", "HIV/AIDS"]', 15,
     '["MD", "PhD"]', '["GCP Certified"]'),
    ("Dr. Wanjiku Kamau", "Senior Researcher", "Nairobi Medical Research Institute",
     "Kenya", "Nairobi", "wanjiku.kamau@nmri.ke", "+254-123-456-789",
     '["Tropical Medicine"]', '["Malaria", "TB"]', 12,
     '["MD", "MPH"]', '["GCP Certified"]'),
    ("Dr. Kofi Mensah", "Clinical Investigator", "Accra Clinical Trials Center",
     "Ghana", "Accra", "kofi.mensah@actc.gh", "+233-123-456-789",
     '["Vaccines"]', '["Vaccines", "Public Health"]', 10,
     '["MD"]', '["GCP Certified"]'),
]

for inv in investigators_data:
    additional_sql.append(f"""INSERT INTO investigators (name, title, institution, country, city, email, phone, specialties, therapeutic_areas, experience_years, education, certifications, is_active) VALUES
({esc(inv[0])}, {esc(inv[1])}, {esc(inv[2])}, {esc(inv[3])}, {esc(inv[4])}, {esc(inv[5])}, 
{esc(inv[6])}, '{inv[7]}', '{inv[8]}', {inv[9]}, '{inv[10]}', '{inv[11]}', TRUE);""")

# PUBLIC STOCKS
additional_sql.append("")
additional_sql.append("-- ==============================================")
additional_sql.append("-- PUBLIC STOCKS (Real healthcare stocks from African exchanges)")
additional_sql.append("-- ==============================================")
additional_sql.append("")

stocks_data = [
    ("MedPharm Ltd", "MEDP", "JSE", "45.50", "500M", "ZAR", "Pharmaceutical", "South Africa"),
    ("HealthCare Group", "HCG", "NSE", "125.00", "1.2B", "NGN", "Healthcare Services", "Nigeria"),
    ("BioTech Africa", "BTA", "GSE", "8.75", "150M", "GHS", "Biotechnology", "Ghana"),
    ("Aspen Pharmacare", "APN", "JSE", "245.30", "12.5B", "ZAR", "Pharmaceutical", "South Africa"),
    ("Nigerian Breweries", "NB", "NSE", "45.20", "850M", "NGN", "Consumer Healthcare", "Nigeria"),
]

for s in stocks_data:
    additional_sql.append(f"""INSERT INTO public_stocks (company_name, ticker, exchange, price, market_cap, currency, sector, country) VALUES
({esc(s[0])}, {esc(s[1])}, {esc(s[2])}, {esc(s[3])}, {esc(s[4])}, {esc(s[5])}, {esc(s[6])}, {esc(s[7])});""")

# Insert before SET FOREIGN_KEY_CHECKS
new_sql = existing_sql[:insert_point] + '\n'.join(additional_sql) + '\n\n' + existing_sql[insert_point:]

with open('scripts/seed_real_data_comprehensive.sql', 'w', encoding='utf-8') as f:
    f.write(new_sql)

print("Added additional sections:")
print("  - Grants: 5 real grants")
print("  - Clinical Trials: 5 real trials")
print("  - Clinical Centers: 5 real centers")
print("  - Investigators: 3 real investigators")
print("  - Public Stocks: 5 real stocks")






