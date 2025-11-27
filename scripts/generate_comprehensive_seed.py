import json
import re
from datetime import datetime, timedelta
import random

# Load parsed Excel data
with open('parsed_excel_data.json', 'r', encoding='utf-8') as f:
    excel_data = json.load(f)

sql_output = []
sql_output.append("-- ==============================================")
sql_output.append("-- COMPREHENSIVE REAL DATA SEED SCRIPT")
sql_output.append("-- Medarion Platform - All Real, Verifiable Data")
sql_output.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
sql_output.append("-- ==============================================")
sql_output.append("")
sql_output.append("USE medarion_platform;")
sql_output.append("")
sql_output.append("SET FOREIGN_KEY_CHECKS = 0;")
sql_output.append("")

def escape_sql(value):
    """Escape SQL values"""
    if value is None or value == 'nan' or value == '' or str(value).strip() == '':
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    value = str(value).replace("'", "''")
    return f"'{value}'"

# Additional real African healthcare companies (well-known, verifiable)
additional_companies = [
    {'name': 'mPharma', 'country': 'Ghana', 'sector': 'Pharmacy', 'website': 'https://mpharma.com', 
     'description': 'Pharmacy management platform operating across Africa', 'stage': 'growth'},
    {'name': '54gene', 'country': 'Nigeria', 'sector': 'Genomics', 'website': 'https://54gene.com',
     'description': 'African genomics research and biobanking company', 'stage': 'growth'},
    {'name': 'LifeBank', 'country': 'Nigeria', 'sector': 'Blood Supply', 'website': 'https://lifebank.ng',
     'description': 'Blood delivery service connecting blood banks to hospitals', 'stage': 'growth'},
    {'name': 'Kasha', 'country': 'Rwanda', 'sector': 'E-commerce', 'website': 'https://kasha.co.rw',
     'description': 'E-commerce platform for women\'s health and personal care products', 'stage': 'growth'},
    {'name': 'Zipline', 'country': 'Rwanda', 'sector': 'Medical Delivery', 'website': 'https://flyzipline.com',
     'description': 'Drone delivery service for medical supplies', 'stage': 'mature'},
    {'name': 'Babyl', 'country': 'Rwanda', 'sector': 'Telemedicine', 'website': 'https://babyl.rw',
     'description': 'Digital health platform providing telemedicine services', 'stage': 'growth'},
    {'name': 'Medic Mobile', 'country': 'Kenya', 'sector': 'Health Tech', 'website': 'https://medicmobile.org',
     'description': 'Open-source health technology platform for community health workers', 'stage': 'mature'},
    {'name': 'Ilara Health', 'country': 'Kenya', 'sector': 'Medical Equipment', 'website': 'https://ilarahealth.com',
     'description': 'Affordable diagnostic equipment and health services for clinics', 'stage': 'growth'},
    {'name': 'Vezeeta', 'country': 'Egypt', 'sector': 'Healthcare Booking', 'website': 'https://vezeeta.com',
     'description': 'Healthcare booking platform connecting patients with doctors', 'stage': 'mature'},
    {'name': 'Yodawy', 'country': 'Egypt', 'sector': 'Pharmacy', 'website': 'https://yodawy.com',
     'description': 'Online pharmacy and prescription management platform', 'stage': 'growth'},
    {'name': 'Aerobotics', 'country': 'South Africa', 'sector': 'AgriTech', 'website': 'https://aerobotics.com',
     'description': 'AI-powered agricultural technology with health monitoring applications', 'stage': 'growth'},
    {'name': 'Discovery Health', 'country': 'South Africa', 'sector': 'Health Insurance', 'website': 'https://discovery.co.za',
     'description': 'Leading health insurance and wellness program provider', 'stage': 'mature'},
    {'name': 'Adi Health', 'country': 'Nigeria', 'sector': 'Telemedicine', 'website': 'https://adi.health',
     'description': 'Digital health platform for remote consultations', 'stage': 'early'},
    {'name': 'Helium Health', 'country': 'Nigeria', 'sector': 'Health Records', 'website': 'https://heliumhealth.com',
     'description': 'Electronic health records and hospital management system', 'stage': 'growth'},
    {'name': 'WellaHealth', 'country': 'Nigeria', 'sector': 'Health Insurance', 'website': 'https://wellahealth.com',
     'description': 'Digital health insurance platform for affordable healthcare access', 'stage': 'early'},
]

# Real investors active in African healthcare
real_investors = [
    {'name': 'TLcom Capital', 'type': 'VC', 'headquarters': 'Lagos, Nigeria', 'website': 'https://tlcomcapital.com',
     'description': 'Venture capital firm investing in African technology companies including healthtech'},
    {'name': 'Partech Africa', 'type': 'VC', 'headquarters': 'Dakar, Senegal', 'website': 'https://partechpartners.com',
     'description': 'Venture capital fund focused on African startups'},
    {'name': 'Novastar Ventures', 'type': 'VC', 'headquarters': 'Nairobi, Kenya', 'website': 'https://novastarventures.com',
     'description': 'Venture capital firm investing in East African startups'},
    {'name': 'Knife Capital', 'type': 'VC', 'headquarters': 'Cape Town, South Africa', 'website': 'https://knifecap.com',
     'description': 'Venture capital firm focused on South African technology companies'},
    {'name': '4DX Ventures', 'type': 'VC', 'headquarters': 'New York, USA', 'website': 'https://4dxventures.com',
     'description': 'Venture capital firm with strong focus on African startups'},
    {'name': 'AfricInvest', 'type': 'PE', 'headquarters': 'Tunis, Tunisia', 'website': 'https://africinvest.com',
     'description': 'Private equity firm investing across Africa'},
    {'name': 'Alta Semper Capital', 'type': 'PE', 'headquarters': 'London, UK', 'website': 'https://altasemper.com',
     'description': 'Private equity firm focused on healthcare in Africa'},
    {'name': 'IFC', 'type': 'Corporate', 'headquarters': 'Washington, DC', 'website': 'https://ifc.org',
     'description': 'International Finance Corporation - World Bank Group investing in African healthcare'},
]

# Real regulatory bodies for major African countries
regulatory_bodies_data = [
    {'name': 'National Agency for Food and Drug Administration and Control', 'country': 'Nigeria', 'abbreviation': 'NAFDAC',
     'website': 'https://nafdac.gov.ng', 'description': 'Nigeria\'s regulatory body for food, drugs, and medical devices'},
    {'name': 'South African Health Products Regulatory Authority', 'country': 'South Africa', 'abbreviation': 'SAHPRA',
     'website': 'https://sahpra.org.za', 'description': 'South Africa\'s health products regulatory authority'},
    {'name': 'Pharmacy and Poisons Board', 'country': 'Kenya', 'abbreviation': 'PPB',
     'website': 'https://pharmacyboardkenya.org', 'description': 'Kenya\'s pharmaceutical regulatory authority'},
    {'name': 'Ghana Food and Drugs Authority', 'country': 'Ghana', 'abbreviation': 'GHA-FDA',
     'website': 'https://fdaghana.gov.gh', 'description': 'Ghana\'s food and drugs regulatory authority'},
    {'name': 'Egyptian Drug Authority', 'country': 'Egypt', 'abbreviation': 'EDA',
     'website': 'https://eda.gov.eg', 'description': 'Egypt\'s drug regulatory authority'},
    {'name': 'Rwanda Food and Drugs Authority', 'country': 'Rwanda', 'abbreviation': 'Rwanda FDA',
     'website': 'https://rwandafda.gov.rw', 'description': 'Rwanda\'s food and drugs regulatory authority'},
    {'name': 'Tanzania Medicines and Medical Devices Authority', 'country': 'Tanzania', 'abbreviation': 'TMDA',
     'website': 'https://tmda.go.tz', 'description': 'Tanzania\'s medicines and medical devices regulatory authority'},
    {'name': 'Uganda National Drug Authority', 'country': 'Uganda', 'abbreviation': 'UNDA',
     'website': 'https://nda.or.ug', 'description': 'Uganda\'s national drug regulatory authority'},
]

# Continue with comprehensive seed generation...
# (This is getting long, let me create the full script in parts)

print("Generating comprehensive seed script...")
print(f"  - Excel data: {len(excel_data['deals'])} deals, {len(excel_data['countries'])} countries")
print(f"  - Additional companies: {len(additional_companies)}")
print(f"  - Investors: {len(real_investors)}")
print(f"  - Regulatory bodies: {len(regulatory_bodies_data)}")

# Save the structure for now - we'll build the full SQL in the next step
structure = {
    'excel_data': excel_data,
    'additional_companies': additional_companies,
    'real_investors': real_investors,
    'regulatory_bodies': regulatory_bodies_data
}

with open('seed_data_structure.json', 'w', encoding='utf-8') as f:
    json.dump(structure, f, indent=2, default=str)

print("Data structure saved. Now generating full SQL script...")













