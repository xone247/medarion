"""
Extract ALL real deals from Excel files
Focus on real company names and funding amounts
"""
import pandas as pd
import json
from datetime import datetime

def parse_funding_file(path):
    """Parse funding/deals file - get ALL real deals"""
    try:
        df = pd.read_excel(path, sheet_name='Batch 3', header=5)
        df = df.dropna(how='all')
        
        deals = []
        for _, row in df.iterrows():
            company = str(row.get('Company', '')).strip()
            country = str(row.get('Country', '')).strip()
            
            # Skip if no company or country
            if not company or company == 'nan' or not country or country == 'nan':
                continue
            
            # Skip placeholder names
            if 'Healthcare Company' in company or company.startswith('Placeholder'):
                continue
            
            # Parse amount
            amount_str = str(row.get('Amount', '0')).replace('$', '').replace(',', '').strip()
            # Handle M (million) and K (thousand)
            if 'M' in amount_str.upper():
                amount_str = amount_str.upper().replace('M', '').strip()
                try:
                    amount = float(amount_str) * 1000000
                except:
                    amount = 0
            elif 'K' in amount_str.upper():
                amount_str = amount_str.upper().replace('K', '').strip()
                try:
                    amount = float(amount_str) * 1000
                except:
                    amount = 0
            else:
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
                'company_name': company,
                'country': country,
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
    except Exception as e:
        print(f"Error parsing funding file: {e}")
        return []

def main():
    excel_path = 'public/excel docs/Copy of 07202025 Funding_Validated.xlsx'
    
    print("=" * 60)
    print("EXTRACTING REAL DEALS FROM EXCEL")
    print("=" * 60)
    
    deals = parse_funding_file(excel_path)
    
    # Filter out deals with $0 amount (unless they're grants/programs)
    real_deals = []
    for deal in deals:
        if deal['amount'] > 0:
            real_deals.append(deal)
        elif 'grant' in deal['description'].lower() or 'program' in deal['description'].lower():
            real_deals.append(deal)
    
    print(f"\nFound {len(real_deals)} real deals with funding > 0 or grants")
    print(f"\nSample deals:")
    for i, deal in enumerate(real_deals[:10], 1):
        print(f"{i}. {deal['company_name']} - ${deal['amount']:,.0f} ({deal['country']})")
    
    # Save to JSON
    with open('real_deals_from_excel.json', 'w') as f:
        json.dump(real_deals, f, indent=2)
    
    print(f"\n✅ Saved {len(real_deals)} real deals to real_deals_from_excel.json")
    
    return real_deals

if __name__ == '__main__':
    main()

