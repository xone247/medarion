#!/usr/bin/env python3
"""
Excel Data Processor
====================

Specialized processor for Excel files that extracts structured data
and adds it to the existing JSON dataset.
"""

import os
import sys
import json
import pandas as pd
from pathlib import Path
from datetime import datetime
import hashlib

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

def install_required_packages():
    """Install required packages for Excel processing"""
    try:
        import pandas as pd
        import openpyxl
    except ImportError:
        print("📦 Installing required packages for Excel processing...")
        os.system("pip install pandas openpyxl xlrd")
        print("✅ Packages installed successfully!")

def extract_excel_data(file_path, sheet_name=None):
    """Extract data from Excel file"""
    try:
        # Read Excel file
        if sheet_name:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
        else:
            # Try to read all sheets
            excel_file = pd.ExcelFile(file_path)
            all_data = {}
            
            for sheet in excel_file.sheet_names:
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet)
                    if not df.empty:
                        all_data[sheet] = df.to_dict('records')
                except Exception as e:
                    print(f"⚠️ Could not read sheet '{sheet}': {e}")
            
            return all_data
    
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")
        return None

def clean_excel_data(data):
    """Clean and structure Excel data"""
    if isinstance(data, dict):
        # Multiple sheets
        cleaned_data = {}
        for sheet_name, records in data.items():
            cleaned_records = []
            for record in records:
                # Clean each record
                cleaned_record = {}
                for key, value in record.items():
                    if pd.notna(value):  # Skip NaN values
                        # Clean column names
                        clean_key = str(key).strip().replace('\n', ' ').replace('\r', ' ')
                        # Clean values
                        clean_value = str(value).strip() if pd.notna(value) else ""
                        if clean_value:
                            cleaned_record[clean_key] = clean_value
                
                if cleaned_record:  # Only add non-empty records
                    cleaned_records.append(cleaned_record)
            
            if cleaned_records:
                cleaned_data[sheet_name] = cleaned_records
        
        return cleaned_data
    
    elif isinstance(data, list):
        # Single sheet
        cleaned_records = []
        for record in data:
            cleaned_record = {}
            for key, value in record.items():
                if pd.notna(value):
                    clean_key = str(key).strip().replace('\n', ' ').replace('\r', ' ')
                    clean_value = str(value).strip() if pd.notna(value) else ""
                    if clean_value:
                        cleaned_record[clean_key] = clean_value
            
            if cleaned_record:
                cleaned_records.append(cleaned_record)
        
        return cleaned_records
    
    return data

def create_excel_record(file_path, sheet_data, sheet_name=None):
    """Create a structured record from Excel data"""
    file_name = Path(file_path).stem
    
    # Generate unique ID
    record_id = hashlib.sha256(f"{file_path}_{sheet_name}_{datetime.now()}".encode()).hexdigest()[:16]
    
    # Create content summary
    if isinstance(sheet_data, dict):
        # Multiple sheets
        content_parts = []
        for sheet, records in sheet_data.items():
            content_parts.append(f"Sheet: {sheet}")
            content_parts.append(f"Records: {len(records)}")
            if records:
                # Add sample data
                sample_record = records[0]
                sample_keys = list(sample_record.keys())[:5]  # First 5 columns
                content_parts.append(f"Columns: {', '.join(sample_keys)}")
        content = "\n".join(content_parts)
    else:
        # Single sheet
        content_parts = [f"Records: {len(sheet_data)}"]
        if sheet_data:
            sample_record = sheet_data[0]
            sample_keys = list(sample_record.keys())[:5]
            content_parts.append(f"Columns: {', '.join(sample_keys)}")
        content = "\n".join(content_parts)
    
    # Create metadata
    metadata = {
        'file_type': 'excel',
        'file_name': file_name,
        'sheet_name': sheet_name,
        'total_records': sum(len(records) if isinstance(records, list) else 1 for records in (sheet_data.values() if isinstance(sheet_data, dict) else [sheet_data])),
        'sheets': list(sheet_data.keys()) if isinstance(sheet_data, dict) else [sheet_name or 'Sheet1'],
        'file_size': Path(file_path).stat().st_size,
        'created_at': datetime.now().isoformat()
    }
    
    # Create the record
    record = {
        'id': record_id,
        'source_file': str(file_path),
        'content': content,
        'excel_data': sheet_data,  # Full structured data
        'metadata': metadata,
        'quality_score': 0.9  # High quality for structured data
    }
    
    return record

def process_excel_files(excel_dir, output_file):
    """Process all Excel files in directory"""
    print("📊 EXCEL DATA PROCESSING")
    print("="*50)
    
    excel_path = Path(excel_dir)
    if not excel_path.exists():
        print(f"❌ Directory not found: {excel_dir}")
        return
    
    # Get all Excel files
    excel_files = list(excel_path.glob("*.xlsx")) + list(excel_path.glob("*.xls"))
    print(f"📁 Found {len(excel_files)} Excel files to process")
    
    if not excel_files:
        print("⚠️ No Excel files found!")
        return
    
    # Process each file
    all_records = []
    processed_count = 0
    error_count = 0
    
    for i, file_path in enumerate(excel_files, 1):
        print(f"\n📊 Processing {i}/{len(excel_files)}: {file_path.name}")
        
        try:
            # Extract data from all sheets
            excel_data = extract_excel_data(file_path)
            
            if excel_data:
                # Clean the data
                cleaned_data = clean_excel_data(excel_data)
                
                if cleaned_data:
                    # Create record
                    record = create_excel_record(file_path, cleaned_data)
                    all_records.append(record)
                    processed_count += 1
                    
                    print(f"✅ Processed: {record['metadata']['total_records']} records from {len(record['metadata']['sheets'])} sheets")
                else:
                    print("⚠️ No data found in file")
                    error_count += 1
            else:
                print("❌ Could not extract data")
                error_count += 1
                
        except Exception as e:
            print(f"❌ Error processing {file_path.name}: {e}")
            error_count += 1
    
    # Save results
    if all_records:
        print(f"\n💾 Saving {len(all_records)} Excel records...")
        
        # Load existing data if file exists
        existing_records = []
        if Path(output_file).exists():
            print("📄 Loading existing records...")
            with open(output_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        existing_records.append(json.loads(line))
        
        # Add new Excel records
        all_records.extend(existing_records)
        
        # Save combined data
        with open(output_file, 'w', encoding='utf-8') as f:
            for record in all_records:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
        
        print(f"✅ Saved {len(all_records)} total records to {output_file}")
        
        # Create summary
        summary = {
            'excel_files_processed': processed_count,
            'excel_files_errors': error_count,
            'total_records': len(all_records),
            'excel_records_added': len([r for r in all_records if r.get('metadata', {}).get('file_type') == 'excel']),
            'processing_time': datetime.now().isoformat()
        }
        
        summary_file = Path(output_file).parent / 'excel_processing_summary.json'
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"📋 Summary saved to {summary_file}")
        
        # Show sample data
        print("\n📊 Sample Excel Data:")
        for record in all_records[:3]:
            if record.get('metadata', {}).get('file_type') == 'excel':
                print(f"  📁 {record['metadata']['file_name']}")
                print(f"     Sheets: {', '.join(record['metadata']['sheets'])}")
                print(f"     Records: {record['metadata']['total_records']}")
                print(f"     Columns: {list(record['excel_data'].keys())[:3]}...")
                break
    
    else:
        print("⚠️ No Excel data was processed successfully")

def main():
    """Main function"""
    print("🚀 EXCEL DATA PROCESSOR")
    print("="*60)
    
    # Install required packages
    install_required_packages()
    
    # Configuration
    EXCEL_DIR = r"D:\medarion_scraper_output\excel files"
    OUTPUT_FILE = r"D:\medarion_scraper_output\processed_data\cleaned_data_with_excel.jsonl"
    
    print(f"📁 Excel directory: {EXCEL_DIR}")
    print(f"📁 Output file: {OUTPUT_FILE}")
    print("-" * 60)
    
    try:
        process_excel_files(EXCEL_DIR, OUTPUT_FILE)
        
        print("\n" + "="*60)
        print("🎉 EXCEL PROCESSING COMPLETE!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
