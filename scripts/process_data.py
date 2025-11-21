#!/usr/bin/env python3
"""
Simple Data Processing Wrapper
==============================

Easy-to-use wrapper for the enhanced data processor.
This script provides a simple interface to process your scraped data.
"""

import os
import sys
from pathlib import Path

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from enhanced_data_processor import EnhancedDataProcessor

def main():
    """Simple main function with default settings"""
    
    # Default configuration
    base_dir = r'D:\medarion_scraper_output'  # Change this to your actual path
    output_dir = None  # Will use base_dir/processed_output
    
    # Check if base directory exists
    if not os.path.exists(base_dir):
        print(f"❌ Base directory not found: {base_dir}")
        print("Please update the base_dir variable in this script to point to your data directory.")
        return
    
    print("🚀 Starting Enhanced Data Processing...")
    print(f"📁 Source directory: {base_dir}")
    print(f"📁 Output directory: {output_dir or os.path.join(base_dir, 'processed_output')}")
    print("-" * 60)
    
    # Create processor with optimized settings
    processor = EnhancedDataProcessor(
        base_dir=base_dir,
        output_dir=output_dir,
        max_content_length=8000,      # Limit content length
        min_content_length=100,       # Minimum content to keep
        shard_size_gb=2.0,           # 2GB shards
        quality_threshold=0.3        # Lower threshold to keep more data
    )
    
    # Run the full pipeline
    try:
        outputs = processor.run_full_pipeline()
        
        print("\n" + "="*60)
        print("🎉 PROCESSING COMPLETE!")
        print("="*60)
        print(f"📄 Total records processed: {processor.stats.total_records}")
        print(f"📊 Files processed: {processor.stats.processed_files}/{processor.stats.total_files}")
        print(f"⏱️ Processing time: {processor.stats.processing_time:.2f} seconds")
        print(f"💾 Total data size: {processor.stats.total_size_bytes / 1024**2:.1f} MB")
        print(f"🧹 Files cleaned up: {processor.stats.deleted_files}")
        print("="*60)
        
        if outputs:
            print("\n📁 Output files created:")
            for key, value in outputs.items():
                if isinstance(value, list):
                    print(f"  {key}: {len(value)} files")
                    for item in value[:3]:  # Show first 3
                        print(f"    - {os.path.basename(item)}")
                    if len(value) > 3:
                        print(f"    ... and {len(value) - 3} more")
                else:
                    print(f"  {key}: {os.path.basename(value)}")
        
        print(f"\n✅ All processed data saved to: {processor.output_dir}")
        
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
