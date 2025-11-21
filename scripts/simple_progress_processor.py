#!/usr/bin/env python3
"""
Simple Progress Data Processor
=============================

Simple processor with immediate progress updates and frequent status reports.
"""

import os
import sys
import time
from pathlib import Path
from datetime import datetime, timedelta

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

def show_progress(current, total, step_name, start_time):
    """Show progress with percentage and ETA"""
    if total == 0:
        return
    
    percentage = (current / total) * 100
    elapsed = time.time() - start_time
    
    # Calculate ETA
    if current > 0:
        rate = current / elapsed
        remaining = total - current
        eta_seconds = remaining / rate if rate > 0 else 0
        eta = timedelta(seconds=int(eta_seconds))
    else:
        eta = "calculating..."
    
    # Create progress bar
    bar_length = 40
    filled = int(bar_length * percentage / 100)
    bar = '█' * filled + '░' * (bar_length - filled)
    
    print(f"\r🔄 {step_name}: [{bar}] {percentage:.1f}% | "
          f"{current:,}/{total:,} | "
          f"Time: {timedelta(seconds=int(elapsed))} | "
          f"ETA: {eta}", end='', flush=True)

def clean_files_simple(base_dir, delete_extensions):
    """Clean files with simple progress"""
    print("🧹 Step 1/4: Cleaning unnecessary files...")
    
    base_path = Path(base_dir)
    files_to_delete = []
    
    # Find files to delete
    print("📁 Scanning for files to delete...")
    for file_path in base_path.rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in delete_extensions:
            files_to_delete.append(file_path)
    
    if not files_to_delete:
        print("✅ No unnecessary files found to delete.")
        return 0
    
    print(f"🗑️ Found {len(files_to_delete)} files to delete...")
    
    deleted = 0
    start_time = time.time()
    
    for i, file_path in enumerate(files_to_delete):
        try:
            file_path.unlink()
            deleted += 1
        except Exception as e:
            print(f"\n⚠️ Could not delete {file_path}: {e}")
        
        # Show progress every 10 files or at the end
        if i % 10 == 0 or i == len(files_to_delete) - 1:
            show_progress(i + 1, len(files_to_delete), "Deleting files", start_time)
    
    print(f"\n✅ Deleted {deleted} unnecessary files.")
    return deleted

def scan_text_files_simple(base_dir, allowed_extensions):
    """Scan for text files with simple progress"""
    print("\n📁 Step 2/4: Scanning for text files...")
    
    base_path = Path(base_dir)
    all_files = []
    text_files = []
    
    # Get all files first
    print("📂 Getting file list...")
    for file_path in base_path.rglob('*'):
        if file_path.is_file():
            all_files.append(file_path)
    
    print(f"📊 Found {len(all_files)} total files to check...")
    
    start_time = time.time()
    
    for i, file_path in enumerate(all_files):
        # Simple text file detection
        if file_path.suffix.lower() in allowed_extensions:
            text_files.append(file_path)
        
        # Show progress every 100 files
        if i % 100 == 0 or i == len(all_files) - 1:
            show_progress(i + 1, len(all_files), "Scanning files", start_time)
    
    print(f"\n✅ Found {len(text_files)} text files to process.")
    return text_files

def process_files_simple(text_files, max_length=6000, min_length=50):
    """Process files with simple progress"""
    print(f"\n🔄 Step 3/4: Processing {len(text_files)} files...")
    
    records = []
    processed = 0
    skipped = 0
    errors = 0
    
    start_time = time.time()
    
    for i, file_path in enumerate(text_files):
        try:
            # Simple file processing
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Simple text cleaning
            cleaned = content.replace('<script', '').replace('<style', '')
            cleaned = ''.join(c for c in cleaned if c.isprintable() or c.isspace())
            cleaned = ' '.join(cleaned.split())
            
            if len(cleaned) >= min_length:
                if len(cleaned) > max_length:
                    cleaned = cleaned[:max_length]
                
                record = {
                    'id': f"{file_path.stem}_{i}",
                    'source_file': str(file_path.relative_to(file_path.parents[1])),
                    'content': cleaned,
                    'metadata': {
                        'file_size': file_path.stat().st_size,
                        'word_count': len(cleaned.split()),
                        'created_at': datetime.fromtimestamp(file_path.stat().st_ctime).isoformat()
                    },
                    'quality_score': min(len(cleaned) / 1000, 1.0)
                }
                records.append(record)
                processed += 1
            else:
                skipped += 1
                
        except Exception as e:
            errors += 1
            print(f"\n⚠️ Error processing {file_path}: {e}")
        
        # Show progress every 10 files
        if i % 10 == 0 or i == len(text_files) - 1:
            show_progress(i + 1, len(text_files), "Processing files", start_time)
    
    print(f"\n✅ Processing complete!")
    print(f"📊 Processed: {processed}, Skipped: {skipped}, Errors: {errors}")
    return records

def save_outputs_simple(records, output_dir):
    """Save outputs with simple progress"""
    print(f"\n💾 Step 4/4: Saving {len(records)} records...")
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save combined file
    print("📄 Creating combined dataset...")
    combined_path = output_path / 'cleaned_data.jsonl'
    
    start_time = time.time()
    with open(combined_path, 'w', encoding='utf-8') as f:
        for i, record in enumerate(records):
            f.write(f"{record['id']}|{record['source_file']}|{record['content'][:100]}...\n")
            
            if i % 100 == 0 or i == len(records) - 1:
                show_progress(i + 1, len(records), "Saving records", start_time)
    
    print(f"\n✅ Saved {len(records)} records to {combined_path}")
    
    # Create simple summary
    summary_path = output_path / 'processing_summary.txt'
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write(f"Data Processing Summary\n")
        f.write(f"=======================\n")
        f.write(f"Total records: {len(records)}\n")
        f.write(f"Average content length: {sum(len(r['content']) for r in records) / len(records) if records else 0:.0f} chars\n")
        f.write(f"Processing time: {time.time() - start_time:.1f} seconds\n")
        f.write(f"Generated at: {datetime.now().isoformat()}\n")
    
    print(f"📋 Summary saved to {summary_path}")
    return str(combined_path)

def main():
    """Main function with simple progress tracking"""
    
    print("🚀 SIMPLE PROGRESS DATA PROCESSING")
    print("="*50)
    
    # Configuration
    BASE_DIR = r'D:\medarion_scraper_output\scraped_data'
    OUTPUT_DIR = r'D:\medarion_scraper_output\processed_data'
    
    # File type settings
    ALLOWED_EXTENSIONS = {'.html', '.htm', '.txt', '.csv', '.json', '.jsonl', '.xml', '.md'}
    DELETE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.css', '.js', '.woff', '.ttf', '.ico', '.pdf'}
    
    # Check if directory exists
    if not os.path.exists(BASE_DIR):
        print(f"❌ Directory not found: {BASE_DIR}")
        print("Please check the path and try again.")
        return
    
    print(f"📁 Source: {BASE_DIR}")
    print(f"📁 Output: {OUTPUT_DIR}")
    print("-" * 50)
    
    start_time = time.time()
    
    try:
        # Step 1: Clean files
        deleted = clean_files_simple(BASE_DIR, DELETE_EXTENSIONS)
        
        # Step 2: Scan for text files
        text_files = scan_text_files_simple(BASE_DIR, ALLOWED_EXTENSIONS)
        
        if not text_files:
            print("⚠️ No text files found to process!")
            return
        
        # Step 3: Process files
        records = process_files_simple(text_files)
        
        if not records:
            print("⚠️ No records were created!")
            return
        
        # Step 4: Save outputs
        output_file = save_outputs_simple(records, OUTPUT_DIR)
        
        # Final summary
        total_time = time.time() - start_time
        print("\n" + "="*50)
        print("🎉 PROCESSING COMPLETE!")
        print("="*50)
        print(f"📄 Total records: {len(records):,}")
        print(f"📊 Files processed: {len(text_files):,}")
        print(f"⏱️ Total time: {total_time:.1f} seconds")
        print(f"🚀 Processing rate: {len(text_files)/total_time:.1f} files/sec")
        print(f"📁 Output: {OUTPUT_DIR}")
        print("="*50)
        
    except KeyboardInterrupt:
        print("\n\n⏹️ Processing interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
