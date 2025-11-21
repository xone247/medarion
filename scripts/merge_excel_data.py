#!/usr/bin/env python3
"""
Excel Data Merger
=================

Merges Excel data with existing JSON dataset, adding Excel records
to the existing 522,758 records.
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

def extract_excel_data(file_path):
    """Extract data from Excel file"""
    try:
        # Read Excel file
        excel_file = pd.ExcelFile(file_path)
        all_data = {}
        
        for sheet in excel_file.sheet_names:
            try:
                df = pd.read_excel(file_path, sheet_name=sheet)
                if not df.empty:
                    # Convert to records
                    records = df.to_dict('records')
                    # Clean the records
                    cleaned_records = []
                    for record in records:
                        cleaned_record = {}
                        for key, value in record.items():
                            if pd.notna(value):
                                clean_key = str(key).strip().replace('\n', ' ').replace('\r', ' ')
                                clean_value = str(value).strip() if pd.notna(value) else ""
                                if clean_value and clean_value != 'nan':
                                    cleaned_record[clean_key] = clean_value
                        
                        if cleaned_record:
                            cleaned_records.append(cleaned_record)
                    
                    if cleaned_records:
                        all_data[sheet] = cleaned_records
            except Exception as e:
                print(f"⚠️ Could not read sheet '{sheet}': {e}")
        
        return all_data
    
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")
        return None

def create_excel_records(file_path, excel_data):
    """Create multiple records from Excel data (one per row)"""
    records = []
    file_name = Path(file_path).stem
    
    for sheet_name, sheet_records in excel_data.items():
        for i, row_data in enumerate(sheet_records):
            # Generate unique ID for each row
            record_id = hashlib.sha256(f"{file_path}_{sheet_name}_{i}_{datetime.now()}".encode()).hexdigest()[:16]
            
            # Create content from row data
            content_parts = []
            for key, value in row_data.items():
                content_parts.append(f"{key}: {value}")
            content = "\n".join(content_parts)
            
            # Create metadata
            metadata = {
                'file_type': 'excel',
                'file_name': file_name,
                'sheet_name': sheet_name,
                'row_number': i + 1,
                'total_columns': len(row_data),
                'file_size': Path(file_path).stat().st_size,
                'created_at': datetime.now().isoformat()
            }
            
            # Create the record
            record = {
                'id': record_id,
                'source_file': str(file_path),
                'content': content,
                'excel_data': row_data,  # Individual row data
                'metadata': metadata,
                'quality_score': 0.9  # High quality for structured data
            }
            
            records.append(record)
    
    return records

def merge_excel_with_existing(excel_dir, existing_file, output_file):
    """Merge Excel data with existing JSON dataset"""
    print("🔄 MERGING EXCEL DATA WITH EXISTING DATASET")
    print("="*60)
    
    # Load existing records
    print("📄 Loading existing records...")
    existing_records = []
    if Path(existing_file).exists():
        with open(existing_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    existing_records.append(json.loads(line))
        print(f"✅ Loaded {len(existing_records):,} existing records")
    else:
        print("⚠️ No existing records found")
    
    # Process Excel files
    excel_path = Path(excel_dir)
    excel_files = list(excel_path.glob("*.xlsx")) + list(excel_path.glob("*.xls"))
    print(f"📊 Found {len(excel_files)} Excel files to process")
    
    all_excel_records = []
    total_excel_rows = 0
    
    for i, file_path in enumerate(excel_files, 1):
        print(f"\n📊 Processing {i}/{len(excel_files)}: {file_path.name}")
        
        try:
            # Extract Excel data
            excel_data = extract_excel_data(file_path)
            
            if excel_data:
                # Create records for each row
                file_records = create_excel_records(file_path, excel_data)
                all_excel_records.extend(file_records)
                
                # Count total rows
                file_rows = sum(len(records) for records in excel_data.values())
                total_excel_rows += file_rows
                
                print(f"✅ Processed: {file_rows} rows from {len(excel_data)} sheets")
            else:
                print("⚠️ No data found in file")
                
        except Exception as e:
            print(f"❌ Error processing {file_path.name}: {e}")
    
    # Combine all records
    print(f"\n🔄 Merging {len(existing_records):,} existing + {len(all_excel_records):,} Excel records...")
    all_records = existing_records + all_excel_records
    
    # Save combined dataset
    print(f"💾 Saving {len(all_records):,} total records...")
    with open(output_file, 'w', encoding='utf-8') as f:
        for record in all_records:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    
    # Create summary
    summary = {
        'original_records': len(existing_records),
        'excel_records_added': len(all_excel_records),
        'total_records': len(all_records),
        'excel_files_processed': len(excel_files),
        'total_excel_rows': total_excel_rows,
        'excel_data_types': {
            'funding': len([r for r in all_excel_records if 'funding' in r['metadata']['file_name'].lower()]),
            'clinical_trials': len([r for r in all_excel_records if 'clinical' in r['metadata']['file_name'].lower()]),
            'countries': len([r for r in all_excel_records if 'countries' in r['metadata']['file_name'].lower()]),
            'regulatory': len([r for r in all_excel_records if 'regulatory' in r['metadata']['file_name'].lower()]),
            'service_providers': len([r for r in all_excel_records if 'service' in r['metadata']['file_name'].lower()]),
            'language': len([r for r in all_excel_records if 'language' in r['metadata']['file_name'].lower()])
        },
        'processing_time': datetime.now().isoformat()
    }
    
    summary_file = Path(output_file).parent / 'merged_dataset_summary.json'
    with open(summary_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"📋 Summary saved to {summary_file}")
    
    # Show final statistics
    print("\n" + "="*60)
    print("🎉 MERGE COMPLETE!")
    print("="*60)
    print(f"📄 Original records: {len(existing_records):,}")
    print(f"📊 Excel records added: {len(all_excel_records):,}")
    print(f"📈 Total records: {len(all_records):,}")
    print(f"📁 Excel files processed: {len(excel_files)}")
    print(f"📊 Total Excel rows: {total_excel_rows:,}")
    print("="*60)
    
    # Show data type breakdown
    print("\n📊 Excel Data Breakdown:")
    for data_type, count in summary['excel_data_types'].items():
        if count > 0:
            print(f"  {data_type.replace('_', ' ').title()}: {count:,} records")
    
    return all_records

def main():
    """Main function"""
    print("🚀 EXCEL DATA MERGER")
    print("="*60)
    
    # Configuration
    EXCEL_DIR = r"D:\medarion_scraper_output\excel files"
    EXISTING_FILE = r"D:\medarion_scraper_output\processed_data\cleaned_data.jsonl"
    OUTPUT_FILE = r"D:\medarion_scraper_output\processed_data\merged_dataset.jsonl"
    
    print(f"📁 Excel directory: {EXCEL_DIR}")
    print(f"📁 Existing dataset: {EXISTING_FILE}")
    print(f"📁 Output file: {OUTPUT_FILE}")
    print("-" * 60)
    
    try:
        merge_excel_with_existing(EXCEL_DIR, EXISTING_FILE, OUTPUT_FILE)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
