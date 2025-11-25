import pandas as pd
import json
from datetime import datetime

def parse_funding_file(path):
    """Parse funding/deals file - header is in row 5"""
    df = pd.read_excel(path, sheet_name='Batch 3', header=5)
    df = df.dropna(how='all')  # Remove empty rows
    
    deals = []
    for _, row in df.iterrows():
        if pd.isna(row.get('Country')) or pd.isna(row.get('Company')):
            continue
            
        # Parse amount
        amount_str = str(row.get('Amount', '0')).replace('$', '').replace(',', '').replace('M', '000000').replace('K', '000').strip()
        try:
            amount = float(amount_str) if amount_str and amount_str != 'nan' and amount_str != '-' else 0
        except:
            amount = 0
        
        # Parse date
        deal_date = row.get('Announced')
        if pd.notna(deal_date):
            if isinstance(deal_date, datetime):
                deal_date = deal_date.strftime('%Y-%m-%d')
            else:
                deal_date = str(deal_date)
        else:
            deal_date = None
        
        deal = {
            'company_name': str(row.get('Company', '')).strip(),
            'country': str(row.get('Country', '')).strip(),
            'deal_type': str(row.get('Round', 'Unknown')).strip(),
            'amount': amount,
            'deal_date': deal_date,
            'description': str(row.get('Description', '')).strip(),
            'status': 'closed' if str(row.get('Status', '')).lower() == 'completed' else 'announced',
            'lead_investor': str(row.get('Lead Investor This Round', '')).strip(),
            'website': str(row.get('Website', '')).strip(),
            'sector': str(row.get('Primary TA', '')).strip(),
            'source_url': str(row.get('Sources', '')).strip()
        }
        deals.append(deal)
    
    return deals

def parse_clinical_trials_file(path):
    """Parse clinical trials file - appears to be glossary terms"""
    df = pd.read_excel(path, sheet_name='Clinical Trial ', header=1)
    df = df.dropna(how='all')
    
    terms = []
    for _, row in df.iterrows():
        term = str(row.iloc[1]).strip() if len(row) > 1 else None
        definition = str(row.iloc[2]).strip() if len(row) > 2 else None
        
        if term and term != 'nan' and term.lower() != 'terms':
            terms.append({
                'term': term,
                'definition': definition,
                'category': 'clinical'
            })
    
    return terms

def parse_countries_file(path):
    """Parse countries file"""
    df = pd.read_excel(path, sheet_name='Country Info', header=0)
    countries = []
    
    for _, row in df.iterrows():
        # Parse population
        pop_str = str(row.get('Population (2025)', '0')).replace(',', '').strip()
        try:
            population = int(float(pop_str)) if pop_str and pop_str != 'nan' else 0
        except:
            population = 0
        
        # Parse GDP
        gdp_str = str(row.get('GDP (latest, USD)', '0')).replace('million', '').replace(',', '').replace('(', '').replace(')', '').strip()
        try:
            gdp = float(gdp_str) * 1000000 if 'million' in str(row.get('GDP (latest, USD)', '')) else float(gdp_str) if gdp_str and gdp_str != 'nan' else 0
        except:
            gdp = 0
        
        # Parse GDP per capita
        gdp_pc_str = str(row.get('GDP per Capita (USD)', '0')).replace(',', '').replace('(', '').replace(')', '').strip()
        try:
            gdp_per_capita = float(gdp_pc_str) if gdp_pc_str and gdp_pc_str != 'nan' else 0
        except:
            gdp_per_capita = 0
        
        # Parse area
        area_str = str(row.get('Area (km²)', '0')).replace(',', '').strip()
        try:
            area = float(area_str) if area_str and area_str != 'nan' else 0
        except:
            area = 0
        
        country = {
            'name': str(row.get('Country', '')).strip(),
            'capital': str(row.get('Capital City', '')).strip(),
            'currency': str(row.get('Currency', '')).strip(),
            'flag_url': str(row.get('National Flag (URL)', '')).strip(),
            'population': population,
            'languages': str(row.get('Official Language(s)', '')).strip(),
            'gdp': gdp,
            'gdp_per_capita': gdp_per_capita,
            'area': area
        }
        countries.append(country)
    
    return countries

def parse_grants_file(path):
    """Parse grants file - appears to be glossary terms"""
    df = pd.read_excel(path, sheet_name='Funding & Grants', header=1)
    df = df.dropna(how='all')
    
    terms = []
    for _, row in df.iterrows():
        term = str(row.iloc[1]).strip() if len(row) > 1 else None
        definition = str(row.iloc[2]).strip() if len(row) > 2 else None
        
        if term and term != 'nan' and term.lower() != 'terms':
            terms.append({
                'term': term,
                'definition': definition,
                'category': 'funding'
            })
    
    return terms

def parse_regulatory_file(path):
    """Parse regulatory file - appears to be glossary terms"""
    df = pd.read_excel(path, sheet_name='Regulatory', header=1)
    df = df.dropna(how='all')
    
    terms = []
    for _, row in df.iterrows():
        term = str(row.iloc[1]).strip() if len(row) > 1 else None
        definition = str(row.iloc[2]).strip() if len(row) > 2 else None
        
        if term and term != 'nan' and term.lower() != 'terms':
            terms.append({
                'term': term,
                'definition': definition,
                'category': 'regulatory'
            })
    
    return terms

def parse_service_provider_file(path):
    """Parse service provider file - might be companies or clinical centers"""
    df = pd.read_excel(path, sheet_name='Data', header=None)
    
    # Find header row
    header_row = None
    for i in range(min(10, len(df))):
        row_vals = [str(v).lower() for v in df.iloc[i].values if pd.notna(v)]
        if any('company' in v or 'name' in v or 'provider' in v for v in row_vals):
            header_row = i
            break
    
    if header_row is None:
        header_row = 0
    
    df = pd.read_excel(path, sheet_name='Data', header=header_row)
    df = df.dropna(how='all')
    
    providers = []
    for _, row in df.iterrows():
        # Try to extract name
        name = None
        for col in df.columns:
            val = str(row.get(col, '')).strip()
            if val and val != 'nan' and len(val) > 2:
                name = val
                break
        
        if name:
            provider = {'name': name, 'raw_data': row.to_dict()}
            providers.append(provider)
    
    return providers

# Parse all files
print("Parsing Excel files...\n")

funding_data = parse_funding_file('public/excel docs/Copy of 07202025 Funding_Validated.xlsx')
print(f"Funding/Deals: {len(funding_data)} records")

clinical_terms = parse_clinical_trials_file('public/excel docs/Copy of Clinical Trial.xlsx')
print(f"Clinical Trial Terms: {len(clinical_terms)} records")

countries_data = parse_countries_file('public/excel docs/Copy of Countries.xlsx')
print(f"Countries: {len(countries_data)} records")

grants_terms = parse_grants_file('public/excel docs/Copy of Funding & Grants.xlsx')
print(f"Grants/Funding Terms: {len(grants_terms)} records")

regulatory_terms = parse_regulatory_file('public/excel docs/Copy of Regulatory.xlsx')
print(f"Regulatory Terms: {len(regulatory_terms)} records")

service_providers = parse_service_provider_file('public/excel docs/Copy of Service Provider.xlsx')
print(f"Service Providers: {len(service_providers)} records")

# Save parsed data
parsed_data = {
    'deals': funding_data,
    'clinical_terms': clinical_terms,
    'countries': countries_data,
    'grants_terms': grants_terms,
    'regulatory_terms': regulatory_terms,
    'service_providers': service_providers
}

with open('parsed_excel_data.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_data, f, indent=2, default=str)

print(f"\nParsed data saved to parsed_excel_data.json")
print(f"Total records: {sum(len(v) if isinstance(v, list) else 0 for v in parsed_data.values())}")






