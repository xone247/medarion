#!/usr/bin/env python3
"""
Quick Data Processing Script
===========================

One-liner script to process your data with sensible defaults.
Just update the BASE_DIR path and run!
"""

import os
import sys
from pathlib import Path

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from enhanced_data_processor import EnhancedDataProcessor

# =============================================================================
# CONFIGURATION - UPDATE THIS PATH TO YOUR DATA DIRECTORY
# =============================================================================
BASE_DIR = r'D:\medarion_scraper_output'  # ← UPDATE THIS PATH

# =============================================================================
# PROCESSING SETTINGS - ADJUST AS NEEDED
# =============================================================================
SETTINGS = {
    'max_content_length': 8000,      # Maximum content length to keep
    'min_content_length': 100,       # Minimum content length to keep
    'shard_size_gb': 2.0,           # Size of each shard file in GB
    'quality_threshold': 0.3,        # Minimum quality score (0-1)
}

def main():
    """Quick processing with your settings"""
    
    print("🚀 Quick Data Processing")
    print("=" * 50)
    print(f"📁 Processing: {BASE_DIR}")
    
    # Check if directory exists
    if not os.path.exists(BASE_DIR):
        print(f"❌ Directory not found: {BASE_DIR}")
        print("Please update the BASE_DIR variable in this script.")
        return
    
    # Create processor
    processor = EnhancedDataProcessor(
        base_dir=BASE_DIR,
        **SETTINGS
    )
    
    # Run processing
    try:
        outputs = processor.run_full_pipeline()
        
        print("\n🎉 SUCCESS!")
        print(f"📄 Records: {processor.stats.total_records}")
        print(f"📊 Files: {processor.stats.processed_files}/{processor.stats.total_files}")
        print(f"⏱️ Time: {processor.stats.processing_time:.1f}s")
        print(f"💾 Size: {processor.stats.total_size_bytes / 1024**2:.1f} MB")
        print(f"📁 Output: {processor.output_dir}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
