#!/usr/bin/env python3
"""
Fast Data Processing Script
===========================

Ultra-fast data processing with real-time progress tracking,
percentage completion, and time estimation.
"""

import os
import sys
import time
from pathlib import Path

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from enhanced_data_processor import EnhancedDataProcessor

def main():
    """Fast processing with progress tracking"""
    
    print("🚀 FAST DATA PROCESSING")
    print("=" * 50)
    
    # Configuration for speed
    BASE_DIR = r'D:\medarion_scraper_output\scraped_data'  # Your actual scraped data directory
    
    # Check if directory exists
    if not os.path.exists(BASE_DIR):
        print(f"❌ Directory not found: {BASE_DIR}")
        print("Please update the BASE_DIR variable in this script.")
        return
    
    print(f"📁 Processing: {BASE_DIR}")
    print("⚡ Using optimized settings for speed...")
    print("-" * 50)
    
    # Create processor with speed-optimized settings
    processor = EnhancedDataProcessor(
        base_dir=BASE_DIR,
        max_content_length=6000,      # Smaller chunks = faster processing
        min_content_length=50,        # Lower threshold = more data kept
        shard_size_gb=1.0,           # Smaller shards = faster I/O
        quality_threshold=0.2        # Lower threshold = less filtering
    )
    
    # Run processing with progress tracking
    start_time = time.time()
    
    try:
        print("🔄 Starting fast processing...")
        processor.process_all_files()
        
        if processor.records:
            print("\n📦 Creating output files...")
            outputs = processor.run_full_pipeline()
            
            print("\n" + "="*60)
            print("🎉 FAST PROCESSING COMPLETE!")
            print("="*60)
            print(f"📄 Total records: {processor.stats.total_records:,}")
            print(f"📊 Files processed: {processor.stats.processed_files:,}/{processor.stats.total_files:,}")
            print(f"⏱️ Total time: {time.time() - start_time:.1f} seconds")
            print(f"🚀 Processing rate: {processor.stats.processed_files/(time.time() - start_time):.1f} files/sec")
            print(f"💾 Data size: {processor.stats.total_size_bytes / 1024**2:.1f} MB")
            print(f"📁 Output: {processor.output_dir}")
            print("="*60)
            
            if outputs:
                print("\n📁 Generated files:")
                for key, value in outputs.items():
                    if isinstance(value, list):
                        print(f"  {key}: {len(value)} files")
                    else:
                        print(f"  {key}: {os.path.basename(value)}")
        else:
            print("⚠️ No records were processed. Check your data directory.")
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Processing interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
