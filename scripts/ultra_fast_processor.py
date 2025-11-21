#!/usr/bin/env python3
"""
Ultra-Fast Data Processor with Resume Functionality
===================================================

Ultra-fast processor using all CPU cores with resume capability.
Processes files in parallel and can resume from where it left off.
"""

import os
import sys
import json
import time
import pickle
import multiprocessing as mp
from pathlib import Path
from datetime import datetime, timedelta
from concurrent.futures import ProcessPoolExecutor, as_completed
import threading
from queue import Queue

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

class ProgressTracker:
    """Thread-safe progress tracker"""
    
    def __init__(self, total_files):
        self.total_files = total_files
        self.processed = 0
        self.skipped = 0
        self.errors = 0
        self.records = 0
        self.start_time = time.time()
        self.lock = threading.Lock()
        self.last_update = time.time()
        
    def update(self, processed=0, skipped=0, errors=0, records=0):
        with self.lock:
            self.processed += processed
            self.skipped += skipped
            self.errors += errors
            self.records += records
            
            current_time = time.time()
            if current_time - self.last_update >= 0.5:  # Update every 0.5 seconds
                self._display_progress()
                self.last_update = current_time
    
    def _display_progress(self):
        total_done = self.processed + self.skipped + self.errors
        if total_done == 0:
            return
            
        percentage = (total_done / self.total_files) * 100
        elapsed = time.time() - self.start_time
        
        # Calculate ETA
        if self.processed > 0:
            rate = self.processed / elapsed
            remaining = self.total_files - total_done
            eta_seconds = remaining / rate if rate > 0 else 0
            eta = timedelta(seconds=int(eta_seconds))
        else:
            eta = "calculating..."
        
        # Progress bar
        bar_length = 50
        filled = int(bar_length * percentage / 100)
        bar = '█' * filled + '░' * (bar_length - filled)
        
        print(f"\r🚀 [{bar}] {percentage:.1f}% | "
              f"Files: {total_done:,}/{self.total_files:,} | "
              f"Records: {self.records:,} | "
              f"Rate: {self.processed/elapsed:.1f}/s | "
              f"ETA: {eta}", end='', flush=True)
    
    def finish(self):
        elapsed = time.time() - self.start_time
        print(f"\r✅ Complete! [{'█' * 50}] 100.0% | "
              f"Files: {self.processed + self.skipped + self.errors:,}/{self.total_files:,} | "
              f"Records: {self.records:,} | "
              f"Time: {timedelta(seconds=int(elapsed))}")
        return {
            'processed': self.processed,
            'skipped': self.skipped,
            'errors': self.errors,
            'records': self.records,
            'elapsed': elapsed
        }

def process_single_file(file_path, max_length=6000, min_length=50):
    """Process a single file - optimized for speed"""
    try:
        # Fast file reading
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Ultra-fast text cleaning
        if len(content) < min_length:
            return None
        
        # Simple but fast cleaning
        cleaned = content
        # Remove HTML tags quickly
        import re
        cleaned = re.sub(r'<[^>]+>', '', cleaned)
        # Remove extra whitespace
        cleaned = ' '.join(cleaned.split())
        
        if len(cleaned) < min_length:
            return None
        
        # Truncate if too long
        if len(cleaned) > max_length:
            cleaned = cleaned[:max_length]
        
        # Create record
        record = {
            'id': f"{file_path.stem}_{hash(str(file_path)) % 100000}",
            'source_file': str(file_path),
            'content': cleaned,
            'metadata': {
                'file_size': len(content),
                'word_count': len(cleaned.split()),
                'created_at': datetime.now().isoformat()
            },
            'quality_score': min(len(cleaned) / 1000, 1.0)
        }
        
        return record
        
    except Exception as e:
        return {'error': str(e), 'file': str(file_path)}

def process_file_batch(file_paths, max_length=6000, min_length=50):
    """Process a batch of files in parallel"""
    results = []
    errors = []
    
    # Use ProcessPoolExecutor for true parallel processing
    with ProcessPoolExecutor(max_workers=mp.cpu_count()) as executor:
        # Submit all files
        future_to_file = {
            executor.submit(process_single_file, fp, max_length, min_length): fp 
            for fp in file_paths
        }
        
        # Collect results
        for future in as_completed(future_to_file):
            result = future.result()
            if result:
                if 'error' in result:
                    errors.append(result)
                else:
                    results.append(result)
    
    return results, errors

def save_checkpoint(processed_files, output_dir, checkpoint_file):
    """Save processing checkpoint"""
    checkpoint_data = {
        'processed_files': processed_files,
        'timestamp': datetime.now().isoformat(),
        'output_dir': str(output_dir)
    }
    
    checkpoint_path = Path(output_dir) / checkpoint_file
    with open(checkpoint_path, 'w') as f:
        json.dump(checkpoint_data, f)

def load_checkpoint(output_dir, checkpoint_file):
    """Load processing checkpoint"""
    checkpoint_path = Path(output_dir) / checkpoint_file
    if checkpoint_path.exists():
        with open(checkpoint_path, 'r') as f:
            return json.load(f)
    return None

def get_text_files_fast(base_dir, allowed_extensions):
    """Fast file scanning using os.walk"""
    text_files = []
    allowed_exts = tuple(allowed_extensions)
    
    print("📁 Scanning for text files...")
    start_time = time.time()
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith(allowed_exts):
                text_files.append(Path(root) / file)
                
                # Show progress every 1000 files
                if len(text_files) % 1000 == 0:
                    elapsed = time.time() - start_time
                    print(f"\r📁 Found {len(text_files):,} text files... ({elapsed:.1f}s)", end='', flush=True)
    
    print(f"\n✅ Found {len(text_files):,} text files to process")
    return text_files

def clean_files_fast(base_dir, delete_extensions):
    """Fast file cleanup"""
    print("🧹 Cleaning unnecessary files...")
    
    files_to_delete = []
    delete_exts = tuple(delete_extensions)
    
    # Fast scan for files to delete
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith(delete_exts):
                files_to_delete.append(Path(root) / file)
    
    if not files_to_delete:
        print("✅ No unnecessary files found")
        return 0
    
    print(f"🗑️ Deleting {len(files_to_delete):,} unnecessary files...")
    
    deleted = 0
    for i, file_path in enumerate(files_to_delete):
        try:
            file_path.unlink()
            deleted += 1
        except:
            pass
        
        if i % 100 == 0:
            print(f"\r🗑️ Deleted {deleted:,}/{len(files_to_delete):,} files...", end='', flush=True)
    
    print(f"\n✅ Deleted {deleted:,} unnecessary files")
    return deleted

def main():
    """Main ultra-fast processing function"""
    
    print("🚀 ULTRA-FAST DATA PROCESSING")
    print("="*60)
    print(f"💻 Using {mp.cpu_count()} CPU cores")
    print("="*60)
    
    # Configuration
    BASE_DIR = r'D:\medarion_scraper_output\scraped_data'
    OUTPUT_DIR = r'D:\medarion_scraper_output\processed_data'
    CHECKPOINT_FILE = 'processing_checkpoint.json'
    
    # File settings
    ALLOWED_EXTENSIONS = {'.html', '.htm', '.txt', '.csv', '.json', '.jsonl', '.xml', '.md'}
    DELETE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.css', '.js', '.woff', '.ttf', '.ico', '.pdf'}
    
    # Processing settings
    MAX_LENGTH = 6000
    MIN_LENGTH = 50
    BATCH_SIZE = 100  # Process 100 files at a time
    
    # Check if directory exists
    if not os.path.exists(BASE_DIR):
        print(f"❌ Directory not found: {BASE_DIR}")
        return
    
    # Create output directory
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    
    print(f"📁 Source: {BASE_DIR}")
    print(f"📁 Output: {OUTPUT_DIR}")
    print("-" * 60)
    
    start_time = time.time()
    
    try:
        # Check for existing checkpoint
        checkpoint = load_checkpoint(OUTPUT_DIR, CHECKPOINT_FILE)
        processed_files = set()
        
        if checkpoint:
            print("🔄 Found checkpoint - resuming from previous session...")
            processed_files = set(checkpoint.get('processed_files', []))
            print(f"📊 Previously processed: {len(processed_files):,} files")
        
        # Step 1: Clean files (only if no checkpoint)
        if not checkpoint:
            clean_files_fast(BASE_DIR, DELETE_EXTENSIONS)
        
        # Step 2: Get text files
        text_files = get_text_files_fast(BASE_DIR, ALLOWED_EXTENSIONS)
        
        if not text_files:
            print("⚠️ No text files found!")
            return
        
        # Filter out already processed files
        if processed_files:
            text_files = [f for f in text_files if str(f) not in processed_files]
            print(f"📊 Remaining files to process: {len(text_files):,}")
        
        if not text_files:
            print("✅ All files already processed!")
            return
        
        # Step 3: Process files in parallel batches
        print(f"\n🚀 Processing {len(text_files):,} files using {mp.cpu_count()} cores...")
        
        progress_tracker = ProgressTracker(len(text_files))
        all_records = []
        all_errors = []
        
        # Process in batches
        for i in range(0, len(text_files), BATCH_SIZE):
            batch = text_files[i:i + BATCH_SIZE]
            
            # Process batch in parallel
            batch_records, batch_errors = process_file_batch(batch, MAX_LENGTH, MIN_LENGTH)
            
            all_records.extend(batch_records)
            all_errors.extend(batch_errors)
            
            # Update progress
            progress_tracker.update(
                processed=len(batch_records),
                skipped=len(batch) - len(batch_records) - len(batch_errors),
                errors=len(batch_errors),
                records=len(batch_records)
            )
            
            # Save checkpoint every 1000 files
            if (i + len(batch)) % 1000 == 0:
                processed_files.update(str(f) for f in batch)
                save_checkpoint(list(processed_files), OUTPUT_DIR, CHECKPOINT_FILE)
        
        # Final progress
        final_stats = progress_tracker.finish()
        
        # Step 4: Save outputs
        print(f"\n💾 Saving {len(all_records):,} records...")
        
        # Save combined file
        combined_path = Path(OUTPUT_DIR) / 'cleaned_data.jsonl'
        with open(combined_path, 'w', encoding='utf-8') as f:
            for record in all_records:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
        
        # Save summary
        summary_path = Path(OUTPUT_DIR) / 'processing_summary.json'
        summary = {
            'total_records': len(all_records),
            'total_errors': len(all_errors),
            'processing_time': time.time() - start_time,
            'files_processed': final_stats['processed'],
            'files_skipped': final_stats['skipped'],
            'files_with_errors': final_stats['errors'],
            'processing_rate': final_stats['processed'] / final_stats['elapsed'],
            'generated_at': datetime.now().isoformat()
        }
        
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        # Remove checkpoint file
        checkpoint_path = Path(OUTPUT_DIR) / CHECKPOINT_FILE
        if checkpoint_path.exists():
            checkpoint_path.unlink()
        
        # Final summary
        total_time = time.time() - start_time
        print("\n" + "="*60)
        print("🎉 ULTRA-FAST PROCESSING COMPLETE!")
        print("="*60)
        print(f"📄 Total records: {len(all_records):,}")
        print(f"📊 Files processed: {final_stats['processed']:,}")
        print(f"⏱️ Total time: {total_time:.1f} seconds")
        print(f"🚀 Processing rate: {final_stats['processed']/total_time:.1f} files/sec")
        print(f"💾 Data size: {sum(len(r['content']) for r in all_records)/1024**2:.1f} MB")
        print(f"📁 Output: {OUTPUT_DIR}")
        print("="*60)
        
    except KeyboardInterrupt:
        print("\n\n⏹️ Processing interrupted - checkpoint saved for resume")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
