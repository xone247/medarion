import pandas as pd
import json
import os

# Excel files to analyze
files = {
    'Funding': 'public/excel docs/Copy of 07202025 Funding_Validated.xlsx',
    'Clinical_Trials': 'public/excel docs/Copy of Clinical Trial.xlsx',
    'Countries': 'public/excel docs/Copy of Countries.xlsx',
    'Grants': 'public/excel docs/Copy of Funding & Grants.xlsx',
    'Language': 'public/excel docs/Copy of Language Equivalent.xlsx',
    'Regulatory': 'public/excel docs/Copy of Regulatory.xlsx',
    'Service_Provider': 'public/excel docs/Copy of Service Provider.xlsx'
}

results = {}

for name, path in files.items():
    print(f"\n{'='*80}")
    print(f"Analyzing: {name}")
    print(f"File: {path}")
    print('='*80)
    
    try:
        # Read the Excel file
        df = pd.read_excel(path)
        
        # Get basic info
        total_rows = len(df)
        columns = list(df.columns)
        
        print(f"\nTotal Rows: {total_rows}")
        print(f"Total Columns: {len(columns)}")
        print(f"\nColumns:")
        for i, col in enumerate(columns, 1):
            print(f"  {i}. {col}")
        
        # Show first few rows
        print(f"\nFirst 3 rows:")
        print(df.head(3).to_string())
        
        # Check for empty/null values
        print(f"\nNull values per column:")
        null_counts = df.isnull().sum()
        for col, count in null_counts.items():
            if count > 0:
                print(f"  {col}: {count} ({count/total_rows*100:.1f}%)")
        
        # Store results
        results[name] = {
            'file': path,
            'total_rows': total_rows,
            'columns': columns,
            'sample_data': df.head(5).to_dict('records'),
            'null_counts': null_counts.to_dict()
        }
        
    except Exception as e:
        print(f"ERROR reading {name}: {e}")
        results[name] = {'error': str(e)}

# Save summary
with open('excel_data_analysis.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, default=str)

print(f"\n\n{'='*80}")
print("Analysis complete! Summary saved to excel_data_analysis.json")
print('='*80)













