#!/usr/bin/env python3
"""
Detailed Progress Data Processor
================================

Enhanced processor with detailed progress tracking showing percentage
and status for every step of the processing pipeline.
"""

import os
import sys
import time
import threading
from pathlib import Path
from datetime import datetime, timedelta

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from enhanced_data_processor import EnhancedDataProcessor

class DetailedProgressTracker:
    """Enhanced progress tracker with step-by-step progress"""
    
    def __init__(self):
        self.current_step = 0
        self.total_steps = 6
        self.step_names = [
            "🧹 Cleaning unnecessary files",
            "📁 Scanning for text files", 
            "🔄 Processing files",
            "📦 Creating output files",
            "📊 Generating reports",
            "✅ Finalizing"
        ]
        self.start_time = time.time()
        self.lock = threading.Lock()
        
    def start_step(self, step_name: str, total_items: int = 0):
        """Start a new processing step"""
        with self.lock:
            self.current_step += 1
            self.current_step_name = step_name
            self.current_total = total_items
            self.current_processed = 0
            
            print(f"\n{'='*60}")
            print(f"STEP {self.current_step}/{self.total_steps}: {step_name}")
            print(f"{'='*60}")
            
            if total_items > 0:
                print(f"📊 Total items to process: {total_items:,}")
                self._show_progress()
    
    def update_step_progress(self, processed: int = 1, skipped: int = 0, errors: int = 0):
        """Update progress within current step"""
        with self.lock:
            self.current_processed += processed
            
            if self.current_total > 0:
                percentage = (self.current_processed / self.current_total) * 100
                elapsed = time.time() - self.start_time
                
                # Calculate ETA for current step
                if self.current_processed > 0:
                    rate = self.current_processed / elapsed
                    remaining = self.current_total - self.current_processed
                    eta_seconds = remaining / rate if rate > 0 else 0
                    eta = timedelta(seconds=int(eta_seconds))
                else:
                    eta = "calculating..."
                
                # Create progress bar
                bar_length = 50
                filled = int(bar_length * percentage / 100)
                bar = '█' * filled + '░' * (bar_length - filled)
                
                print(f"\r🔄 [{bar}] {percentage:.1f}% | "
                      f"Processed: {self.current_processed:,}/{self.current_total:,} | "
                      f"Time: {timedelta(seconds=int(elapsed))} | "
                      f"ETA: {eta}", end='', flush=True)
    
    def complete_step(self, results: dict = None):
        """Complete current step"""
        with self.lock:
            elapsed = time.time() - self.start_time
            print(f"\r✅ Step {self.current_step} complete! "
                  f"Time: {timedelta(seconds=int(elapsed))}")
            
            if results:
                for key, value in results.items():
                    if isinstance(value, (int, float)):
                        print(f"   📊 {key}: {value:,}")
                    else:
                        print(f"   📊 {key}: {value}")
    
    def _show_progress(self):
        """Show initial progress display"""
        if self.current_total > 0:
            print(f"🔄 Starting... 0/{self.current_total:,} (0.0%)")
    
    def show_overall_progress(self):
        """Show overall pipeline progress"""
        overall_percentage = (self.current_step / self.total_steps) * 100
        elapsed = time.time() - self.start_time
        
        print(f"\n{'='*60}")
        print(f"🚀 OVERALL PROGRESS: {overall_percentage:.1f}%")
        print(f"⏱️ Total elapsed time: {timedelta(seconds=int(elapsed))}")
        print(f"📋 Completed steps: {self.current_step}/{self.total_steps}")
        print(f"{'='*60}")

class DetailedDataProcessor(EnhancedDataProcessor):
    """Enhanced processor with detailed progress tracking"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.progress_tracker = DetailedProgressTracker()
    
    def clean_unnecessary_files(self) -> None:
        """Clean files with progress tracking"""
        self.progress_tracker.start_step("🧹 Cleaning unnecessary files")
        
        # Count files to delete
        files_to_delete = []
        for file_path in self.base_dir.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in self.delete_extensions:
                files_to_delete.append(file_path)
        
        if files_to_delete:
            self.progress_tracker.start_step(f"🧹 Deleting {len(files_to_delete)} unnecessary files", len(files_to_delete))
            
            deleted_count = 0
            for i, file_path in enumerate(files_to_delete):
                try:
                    file_path.unlink()
                    deleted_count += 1
                    self.stats.deleted_files += 1
                    
                    # Update progress every 10 files
                    if i % 10 == 0 or i == len(files_to_delete) - 1:
                        self.progress_tracker.update_step_progress(1)
                        
                except Exception as e:
                    print(f"\n⚠️ Could not delete {file_path}: {e}")
            
            self.progress_tracker.complete_step({
                "Files deleted": deleted_count,
                "Errors": len(files_to_delete) - deleted_count
            })
        else:
            self.progress_tracker.complete_step({"Files deleted": 0})
    
    def scan_text_files(self) -> list:
        """Scan for text files with progress tracking"""
        self.progress_tracker.start_step("📁 Scanning for text files")
        
        all_files = list(self.base_dir.rglob('*'))
        text_files = []
        
        # Show scanning progress
        for i, file_path in enumerate(all_files):
            if file_path.is_file():
                if self.is_text_file(file_path):
                    text_files.append(file_path)
            
            # Update progress every 100 files
            if i % 100 == 0 or i == len(all_files) - 1:
                self.progress_tracker.update_step_progress(1)
        
        self.progress_tracker.complete_step({
            "Total files scanned": len(all_files),
            "Text files found": len(text_files),
            "Processing rate": f"{len(text_files)/len(all_files)*100:.1f}%"
        })
        
        return text_files
    
    def process_files_with_progress(self, text_files: list) -> list:
        """Process files with detailed progress tracking"""
        self.progress_tracker.start_step("🔄 Processing files", len(text_files))
        
        all_records = []
        batch_size = 20  # Smaller batches for better progress updates
        
        for i in range(0, len(text_files), batch_size):
            batch = text_files[i:i + batch_size]
            batch_records = self.process_file_batch(batch)
            all_records.extend(batch_records)
            
            # Update progress
            self.progress_tracker.update_step_progress(len(batch))
        
        self.progress_tracker.complete_step({
            "Files processed": len(text_files),
            "Records created": len(all_records),
            "Success rate": f"{len(all_records)/len(text_files)*100:.1f}%"
        })
        
        return all_records
    
    def create_outputs_with_progress(self) -> dict:
        """Create output files with progress tracking"""
        self.progress_tracker.start_step("📦 Creating output files")
        
        outputs = {}
        
        # Combined output
        print("\n📄 Creating combined dataset...")
        outputs['combined'] = self.create_combined_output()
        
        # Shards
        print("📦 Creating shard files...")
        shard_files = self.create_shards()
        outputs['shards'] = shard_files
        
        # Quality report
        print("📊 Generating quality report...")
        outputs['quality_report'] = self.generate_quality_report()
        
        # Metadata
        print("📋 Saving metadata...")
        outputs['metadata'] = self.save_metadata()
        
        self.progress_tracker.complete_step({
            "Combined file": "created",
            "Shard files": len(shard_files),
            "Quality report": "generated",
            "Metadata": "saved"
        })
        
        return outputs
    
    def process_all_files_detailed(self) -> None:
        """Process all files with detailed step-by-step progress"""
        print("🚀 STARTING DETAILED DATA PROCESSING")
        print("="*60)
        print(f"📁 Source: {self.base_dir}")
        print(f"📁 Output: {self.output_dir}")
        print(f"⚙️ Settings: Max length={self.max_content_length}, Quality={self.quality_threshold}")
        print("="*60)
        
        start_time = time.time()
        self.stats.start_time = start_time
        
        try:
            # Step 1: Clean unnecessary files
            self.clean_unnecessary_files()
            self.progress_tracker.show_overall_progress()
            
            # Step 2: Scan for text files
            text_files = self.scan_text_files()
            self.progress_tracker.show_overall_progress()
            
            if not text_files:
                print("\n⚠️ No text files found to process!")
                return
            
            # Step 3: Process files
            self.records = self.process_files_with_progress(text_files)
            self.stats.total_records = len(self.records)
            self.progress_tracker.show_overall_progress()
            
            if not self.records:
                print("\n⚠️ No records were created!")
                return
            
            # Step 4: Create outputs
            outputs = self.create_outputs_with_progress()
            self.progress_tracker.show_overall_progress()
            
            # Step 5: Finalize
            self.progress_tracker.start_step("✅ Finalizing")
            self.stats.processing_time = time.time() - start_time
            self.progress_tracker.complete_step({
                "Total processing time": f"{self.stats.processing_time:.1f}s",
                "Processing rate": f"{len(text_files)/self.stats.processing_time:.1f} files/sec",
                "Data size": f"{self.stats.total_size_bytes/1024**2:.1f} MB"
            })
            
            # Final summary
            print("\n" + "="*60)
            print("🎉 PROCESSING COMPLETE!")
            print("="*60)
            print(f"📄 Total records: {self.stats.total_records:,}")
            print(f"📊 Files processed: {self.stats.processed_files:,}/{self.stats.total_files:,}")
            print(f"⏱️ Total time: {self.stats.processing_time:.1f} seconds")
            print(f"🚀 Processing rate: {self.stats.processed_files/self.stats.processing_time:.1f} files/sec")
            print(f"💾 Data size: {self.stats.total_size_bytes/1024**2:.1f} MB")
            print(f"📁 Output directory: {self.output_dir}")
            print("="*60)
            
            return outputs
            
        except Exception as e:
            print(f"\n❌ Error during processing: {e}")
            import traceback
            traceback.print_exc()
            return None

def main():
    """Main function with detailed progress tracking"""
    
    print("🚀 DETAILED PROGRESS DATA PROCESSING")
    print("="*60)
    
    # Configuration
    BASE_DIR = r'D:\medarion_scraper_output\scraped_data'
    
    # Check if directory exists
    if not os.path.exists(BASE_DIR):
        print(f"❌ Directory not found: {BASE_DIR}")
        print("Please check the path and try again.")
        return
    
    print(f"📁 Processing: {BASE_DIR}")
    print("⚡ Using optimized settings for speed...")
    print("-" * 60)
    
    # Create processor with detailed progress tracking
    processor = DetailedDataProcessor(
        base_dir=BASE_DIR,
        max_content_length=6000,      # Smaller chunks = faster processing
        min_content_length=50,        # Lower threshold = more data kept
        shard_size_gb=1.0,           # Smaller shards = faster I/O
        quality_threshold=0.2        # Lower threshold = less filtering
    )
    
    # Run processing with detailed progress
    try:
        outputs = processor.process_all_files_detailed()
        
        if outputs:
            print("\n📁 Generated files:")
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
        
    except KeyboardInterrupt:
        print("\n\n⏹️ Processing interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
