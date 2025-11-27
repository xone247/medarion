import pandas as pd
import json
import os

# Read Excel files with proper header detection
files = {
    'Funding': ('public/excel docs/Copy of 07202025 Funding_Validated.xlsx', 'Batch 3'),
    'Clinical_Trials': ('public/excel docs/Copy of Clinical Trial.xlsx', 'Clinical Trial '),
    'Countries': ('public/excel docs/Copy of Countries.xlsx', 'Country Info'),
    'Grants': ('public/excel docs/Copy of Funding & Grants.xlsx', 'Funding & Grants'),
    'Language': ('public/excel docs/Copy of Language Equivalent.xlsx', 'Regional Language Equivalents ('),
    'Regulatory': ('public/excel docs/Copy of Regulatory.xlsx', 'Regulatory'),
    'Service_Provider': ('public/excel docs/Copy of Service Provider.xlsx', 'Data')
}

all_data = {}

for name, (path, sheet) in files.items():
    print(f"\nReading {name}...")
    try:
        # Try reading with header in row 0
        df = pd.read_excel(path, sheet_name=sheet, header=0)
        
        # If first row looks like headers, use it
        if df.empty or df.iloc[0].isna().all():
            # Try skipping first few rows
            for skip in [1, 2, 3]:
                df = pd.read_excel(path, sheet_name=sheet, header=skip)
                if not df.empty and not df.iloc[0].isna().all():
                    break
        
        # Clean column names
        df.columns = [str(col).strip() if pd.notna(col) else f'col_{i}' for i, col in enumerate(df.columns)]
        
        # Remove completely empty rows
        df = df.dropna(how='all')
        
        print(f"  Rows: {len(df)}, Columns: {len(df.columns)}")
        print(f"  Column names: {list(df.columns)[:10]}...")
        
        # Save sample
        all_data[name] = {
            'total_rows': len(df),
            'columns': list(df.columns),
            'sample': df.head(10).to_dict('records'),
            'data': df.to_dict('records')
        }
        
    except Exception as e:
        print(f"  ERROR: {e}")
        all_data[name] = {'error': str(e)}

# Save to JSON for inspection
with open('excel_data_full.json', 'w', encoding='utf-8') as f:
    json.dump(all_data, f, indent=2, default=str)

print(f"\n\nAll data saved to excel_data_full.json")
print(f"Total files processed: {len([k for k, v in all_data.items() if 'error' not in v])}")













