#!/usr/bin/env python3
"""
Enhanced Data Processing Pipeline for Medarion
==============================================

This script provides a comprehensive data cleaning, validation, and organization pipeline
for processing scraped data into training-ready datasets.

Features:
- Intelligent file type detection and filtering
- Advanced text cleaning and normalization
- Data quality validation and metrics
- Efficient chunking and sharding
- Progress tracking and error handling
- Metadata preservation and enrichment
- Multiple output formats (JSONL, Parquet, etc.)
"""

import os
import re
import json
import math
import hashlib
import logging
import argparse
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from collections import defaultdict, Counter
import mimetypes
import chardet
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configure logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_processing.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ProcessingStats:
    """Track processing statistics"""
    total_files: int = 0
    processed_files: int = 0
    skipped_files: int = 0
    error_files: int = 0
    total_records: int = 0
    total_size_bytes: int = 0
    deleted_files: int = 0
    processing_time: float = 0.0
    start_time: float = 0.0
    last_update_time: float = 0.0

@dataclass
class DataRecord:
    """Standardized data record structure"""
    id: str
    source_file: str
    content: str
    metadata: Dict[str, Any]
    created_at: str
    quality_score: float

class ProgressTracker:
    """Real-time progress tracking with ETA calculation"""
    
    def __init__(self, total_files: int):
        self.total_files = total_files
        self.processed = 0
        self.skipped = 0
        self.errors = 0
        self.start_time = time.time()
        self.last_update = time.time()
        self.records_created = 0
        self.lock = threading.Lock()
        
    def update(self, processed: int = 0, skipped: int = 0, errors: int = 0, records: int = 0):
        """Thread-safe progress update"""
        with self.lock:
            self.processed += processed
            self.skipped += skipped
            self.errors += errors
            self.records_created += records
            
            current_time = time.time()
            if current_time - self.last_update >= 1.0:  # Update every second
                self._display_progress()
                self.last_update = current_time
    
    def _display_progress(self):
        """Display current progress with ETA"""
        total_processed = self.processed + self.skipped + self.errors
        if total_processed == 0:
            return
            
        percentage = (total_processed / self.total_files) * 100
        elapsed_time = time.time() - self.start_time
        
        if self.processed > 0:
            # Calculate ETA based on processing rate
            rate = self.processed / elapsed_time
            remaining_files = self.total_files - total_processed
            eta_seconds = remaining_files / rate if rate > 0 else 0
            eta = timedelta(seconds=int(eta_seconds))
        else:
            eta = "calculating..."
        
        # Create progress bar
        bar_length = 40
        filled_length = int(bar_length * percentage / 100)
        bar = '█' * filled_length + '░' * (bar_length - filled_length)
        
        print(f"\r🔄 Progress: [{bar}] {percentage:.1f}% | "
              f"Files: {total_processed}/{self.total_files} | "
              f"Records: {self.records_created} | "
              f"Time: {timedelta(seconds=int(elapsed_time))} | "
              f"ETA: {eta}", end='', flush=True)
    
    def finish(self):
        """Display final progress"""
        total_processed = self.processed + self.skipped + self.errors
        percentage = (total_processed / self.total_files) * 100
        elapsed_time = time.time() - self.start_time
        
        print(f"\r✅ Complete: [{'█' * 40}] {percentage:.1f}% | "
              f"Files: {total_processed}/{self.total_files} | "
              f"Records: {self.records_created} | "
              f"Time: {timedelta(seconds=int(elapsed_time))}")
        
        return {
            'total_files': self.total_files,
            'processed': self.processed,
            'skipped': self.skipped,
            'errors': self.errors,
            'records': self.records_created,
            'elapsed_time': elapsed_time
        }

class EnhancedDataProcessor:
    """Enhanced data processing pipeline with validation and quality checks"""
    
    def __init__(self, 
                 base_dir: str,
                 output_dir: str = None,
                 max_content_length: int = 8000,
                 min_content_length: int = 100,
                 shard_size_gb: float = 2.0,
                 quality_threshold: float = 0.5):
        
        self.base_dir = Path(base_dir)
        self.output_dir = Path(output_dir) if output_dir else self.base_dir / 'processed_output'
        self.max_content_length = max_content_length
        self.min_content_length = min_content_length
        self.shard_size_bytes = int(shard_size_gb * 1024**3)
        self.quality_threshold = quality_threshold
        
        # File type configurations
        self.allowed_extensions = {
            '.html', '.htm', '.txt', '.csv', '.json', '.jsonl', 
            '.xml', '.md', '.rst', '.log', '.yaml', '.yml'
        }
        
        self.delete_extensions = {
            '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp',
            '.css', '.js', '.woff', '.woff2', '.ttf', '.otf', '.eot',
            '.ico', '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
            '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',
            '.mp3', '.wav', '.flac', '.aac', '.ogg'
        }
        
        # Text cleaning patterns
        self.cleanup_patterns = [
            (r'<script[^>]*>.*?</script>', '', re.DOTALL | re.IGNORECASE),
            (r'<style[^>]*>.*?</style>', '', re.DOTALL | re.IGNORECASE),
            (r'<[^>]+>', '', re.IGNORECASE),  # Remove HTML tags
            (r'\s+', ' ', re.MULTILINE),      # Collapse whitespace
            (r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}\"\'\/\@\#\$\%\&\*\+\=\<\>\|\\\~\`]', '', re.UNICODE),  # Remove special chars
            (r'\n\s*\n', '\n', re.MULTILINE),  # Remove empty lines
        ]
        
        self.stats = ProcessingStats()
        self.records: List[DataRecord] = []
        self.progress_tracker = None
        
        # Create output directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        (self.output_dir / 'shards').mkdir(exist_ok=True)
        (self.output_dir / 'metadata').mkdir(exist_ok=True)
        (self.output_dir / 'quality_reports').mkdir(exist_ok=True)

    def detect_encoding(self, file_path: Path) -> str:
        """Detect file encoding using chardet"""
        try:
            with open(file_path, 'rb') as f:
                raw_data = f.read(10000)  # Read first 10KB
                result = chardet.detect(raw_data)
                return result.get('encoding', 'utf-8')
        except Exception:
            return 'utf-8'

    def is_text_file(self, file_path: Path) -> bool:
        """Enhanced file type detection"""
        # Check extension
        if file_path.suffix.lower() in self.allowed_extensions:
            return True
        
        # Check MIME type
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if mime_type and mime_type.startswith('text/'):
            return True
        
        # Check file content (first 1KB)
        try:
            encoding = self.detect_encoding(file_path)
            with open(file_path, 'r', encoding=encoding, errors='ignore') as f:
                content = f.read(1024)
                # Check if content is mostly printable
                printable_ratio = sum(1 for c in content if c.isprintable() or c.isspace()) / len(content)
                return printable_ratio > 0.8
        except Exception:
            return False

    def clean_text(self, text: str) -> str:
        """Advanced text cleaning with multiple patterns"""
        if not text:
            return ""
        
        cleaned = text
        for pattern, replacement, flags in self.cleanup_patterns:
            cleaned = re.sub(pattern, replacement, cleaned, flags=flags)
        
        # Final cleanup
        cleaned = cleaned.strip()
        
        # Remove excessive whitespace
        cleaned = re.sub(r'\s{3,}', ' ', cleaned)
        
        return cleaned

    def calculate_quality_score(self, content: str, metadata: Dict) -> float:
        """Calculate content quality score (0-1)"""
        if not content:
            return 0.0
        
        score = 0.0
        
        # Length score (optimal range)
        length = len(content)
        if self.min_content_length <= length <= self.max_content_length:
            score += 0.3
        elif length > self.min_content_length:
            score += 0.2
        
        # Content diversity (unique words ratio)
        words = content.lower().split()
        if words:
            unique_ratio = len(set(words)) / len(words)
            score += unique_ratio * 0.2
        
        # Sentence structure (basic)
        sentences = re.split(r'[.!?]+', content)
        if len(sentences) > 1:
            avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
            if 5 <= avg_sentence_length <= 50:
                score += 0.2
        
        # Metadata completeness
        if metadata.get('title') and metadata.get('source_url'):
            score += 0.1
        
        # No excessive repetition
        if len(set(words)) > len(words) * 0.3:
            score += 0.2
        
        return min(score, 1.0)

    def extract_metadata(self, file_path: Path, content: str) -> Dict[str, Any]:
        """Extract and enrich metadata from file"""
        metadata = {
            'source_file': str(file_path.relative_to(self.base_dir)),
            'file_size': file_path.stat().st_size,
            'file_extension': file_path.suffix,
            'created_at': datetime.fromtimestamp(file_path.stat().st_ctime).isoformat(),
            'modified_at': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
        }
        
        # Try to extract title from content
        title_match = re.search(r'<title[^>]*>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
        if title_match:
            metadata['title'] = self.clean_text(title_match.group(1))
        
        # Extract potential URLs
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, content)
        if urls:
            metadata['extracted_urls'] = list(set(urls[:10]))  # Limit to 10 unique URLs
        
        # Extract potential email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, content)
        if emails:
            metadata['extracted_emails'] = list(set(emails[:5]))  # Limit to 5 unique emails
        
        # Content statistics
        metadata['word_count'] = len(content.split())
        metadata['char_count'] = len(content)
        metadata['line_count'] = content.count('\n') + 1
        
        return metadata

    def process_file(self, file_path: Path) -> Optional[DataRecord]:
        """Process a single file and return a DataRecord"""
        try:
            self.stats.total_files += 1
            
            # Detect encoding and read content
            encoding = self.detect_encoding(file_path)
            with open(file_path, 'r', encoding=encoding, errors='ignore') as f:
                content = f.read()
            
            # Clean the content
            cleaned_content = self.clean_text(content)
            
            if len(cleaned_content) < self.min_content_length:
                self.stats.skipped_files += 1
                logger.debug(f"Skipped {file_path}: content too short")
                return None
            
            # Extract metadata
            metadata = self.extract_metadata(file_path, content)
            
            # Calculate quality score
            quality_score = self.calculate_quality_score(cleaned_content, metadata)
            
            if quality_score < self.quality_threshold:
                self.stats.skipped_files += 1
                logger.debug(f"Skipped {file_path}: quality score too low ({quality_score:.2f})")
                return None
            
            # Truncate content if too long
            if len(cleaned_content) > self.max_content_length:
                cleaned_content = cleaned_content[:self.max_content_length]
                metadata['truncated'] = True
            
            # Generate unique ID
            record_id = hashlib.sha256(
                f"{file_path}|{len(cleaned_content)}|{metadata.get('modified_at', '')}".encode()
            ).hexdigest()[:16]
            
            record = DataRecord(
                id=record_id,
                source_file=str(file_path.relative_to(self.base_dir)),
                content=cleaned_content,
                metadata=metadata,
                created_at=datetime.utcnow().isoformat() + 'Z',
                quality_score=quality_score
            )
            
            self.stats.processed_files += 1
            self.stats.total_size_bytes += len(cleaned_content.encode('utf-8'))
            
            return record
            
        except Exception as e:
            self.stats.error_files += 1
            logger.error(f"Error processing {file_path}: {e}")
            return None

    def clean_unnecessary_files(self) -> None:
        """Remove unnecessary files to save space"""
        logger.info("🧹 Cleaning up unnecessary files...")
        
        for file_path in self.base_dir.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in self.delete_extensions:
                try:
                    file_path.unlink()
                    self.stats.deleted_files += 1
                except Exception as e:
                    logger.warning(f"Could not delete {file_path}: {e}")

    def process_file_batch(self, file_paths: List[Path]) -> List[DataRecord]:
        """Process a batch of files in parallel"""
        records = []
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit all files for processing
            future_to_file = {
                executor.submit(self.process_file, file_path): file_path 
                for file_path in file_paths
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_file):
                file_path = future_to_file[future]
                try:
                    record = future.result()
                    if record:
                        records.append(record)
                        self.progress_tracker.update(processed=1, records=1)
                    else:
                        self.progress_tracker.update(skipped=1)
                except Exception as e:
                    logger.error(f"Error processing {file_path}: {e}")
                    self.progress_tracker.update(errors=1)
        
        return records

    def process_all_files(self) -> None:
        """Process all files in the directory with progress tracking"""
        print(f"🚀 Starting enhanced data processing from {self.base_dir}")
        start_time = time.time()
        self.stats.start_time = start_time
        
        # Clean unnecessary files first
        print("🧹 Cleaning up unnecessary files...")
        self.clean_unnecessary_files()
        
        # Get all text files first
        print("📁 Scanning for text files...")
        text_files = []
        for file_path in self.base_dir.rglob('*'):
            if file_path.is_file() and self.is_text_file(file_path):
                text_files.append(file_path)
        
        self.stats.total_files = len(text_files)
        print(f"📊 Found {self.stats.total_files} text files to process")
        
        if not text_files:
            print("⚠️ No text files found to process!")
            return
        
        # Initialize progress tracker
        self.progress_tracker = ProgressTracker(self.stats.total_files)
        
        # Process files in batches for better performance
        batch_size = 50  # Process 50 files at a time
        all_records = []
        
        print("🔄 Starting parallel processing...")
        for i in range(0, len(text_files), batch_size):
            batch = text_files[i:i + batch_size]
            batch_records = self.process_file_batch(batch)
            all_records.extend(batch_records)
        
        # Update stats
        self.records = all_records
        self.stats.total_records = len(all_records)
        self.stats.processing_time = time.time() - start_time
        
        # Final progress display
        final_stats = self.progress_tracker.finish()
        
        print(f"\n✅ Processing complete!")
        print(f"📊 Files processed: {final_stats['processed']}/{final_stats['total_files']}")
        print(f"📄 Total records: {final_stats['records']}")
        print(f"⏱️ Processing time: {final_stats['elapsed_time']:.2f}s")
        print(f"🚀 Processing rate: {final_stats['processed']/final_stats['elapsed_time']:.1f} files/sec")

    def create_shards(self) -> List[str]:
        """Create sharded output files"""
        logger.info("📦 Creating shards...")
        
        shard_files = []
        current_shard = []
        current_size = 0
        shard_count = 0
        
        for record in self.records:
            record_size = len(json.dumps(asdict(record), ensure_ascii=False).encode('utf-8'))
            
            if current_size + record_size > self.shard_size_bytes and current_shard:
                # Write current shard
                shard_path = self.output_dir / 'shards' / f'shard_{shard_count:03d}.jsonl'
                with open(shard_path, 'w', encoding='utf-8') as f:
                    for rec in current_shard:
                        f.write(json.dumps(asdict(rec), ensure_ascii=False) + '\n')
                
                shard_files.append(str(shard_path))
                logger.info(f"Created shard {shard_count}: {len(current_shard)} records, {current_size / 1024**2:.1f} MB")
                
                # Reset for next shard
                current_shard = []
                current_size = 0
                shard_count += 1
            
            current_shard.append(record)
            current_size += record_size
        
        # Write final shard if it has content
        if current_shard:
            shard_path = self.output_dir / 'shards' / f'shard_{shard_count:03d}.jsonl'
            with open(shard_path, 'w', encoding='utf-8') as f:
                for rec in current_shard:
                    f.write(json.dumps(asdict(rec), ensure_ascii=False) + '\n')
            shard_files.append(str(shard_path))
            logger.info(f"Created final shard {shard_count}: {len(current_shard)} records, {current_size / 1024**2:.1f} MB")
        
        return shard_files

    def create_combined_output(self) -> str:
        """Create a single combined output file"""
        logger.info("📄 Creating combined output...")
        
        combined_path = self.output_dir / 'cleaned_data.jsonl'
        
        with open(combined_path, 'w', encoding='utf-8') as f:
            for record in self.records:
                f.write(json.dumps(asdict(record), ensure_ascii=False) + '\n')
        
        logger.info(f"✅ Combined dataset written to: {combined_path}")
        return str(combined_path)

    def generate_quality_report(self) -> str:
        """Generate a comprehensive quality report"""
        logger.info("📊 Generating quality report...")
        
        quality_scores = [r.quality_score for r in self.records]
        word_counts = [r.metadata.get('word_count', 0) for r in self.records]
        
        report = {
            'processing_stats': asdict(self.stats),
            'quality_metrics': {
                'avg_quality_score': sum(quality_scores) / len(quality_scores) if quality_scores else 0,
                'min_quality_score': min(quality_scores) if quality_scores else 0,
                'max_quality_score': max(quality_scores) if quality_scores else 0,
                'quality_distribution': dict(Counter([round(s, 1) for s in quality_scores]))
            },
            'content_metrics': {
                'avg_word_count': sum(word_counts) / len(word_counts) if word_counts else 0,
                'min_word_count': min(word_counts) if word_counts else 0,
                'max_word_count': max(word_counts) if word_counts else 0,
                'total_size_mb': self.stats.total_size_bytes / 1024**2
            },
            'file_type_distribution': Counter([r.metadata.get('file_extension', 'unknown') for r in self.records]),
            'generated_at': datetime.utcnow().isoformat()
        }
        
        report_path = self.output_dir / 'quality_reports' / 'processing_report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📊 Quality report saved to: {report_path}")
        return str(report_path)

    def save_metadata(self) -> str:
        """Save processing metadata"""
        metadata = {
            'processing_config': {
                'base_dir': str(self.base_dir),
                'output_dir': str(self.output_dir),
                'max_content_length': self.max_content_length,
                'min_content_length': self.min_content_length,
                'shard_size_gb': self.shard_size_bytes / 1024**3,
                'quality_threshold': self.quality_threshold
            },
            'processing_stats': asdict(self.stats),
            'file_counts': {
                'total_files_found': self.stats.total_files,
                'files_processed': self.stats.processed_files,
                'files_skipped': self.stats.skipped_files,
                'files_with_errors': self.stats.error_files,
                'unnecessary_files_deleted': self.stats.deleted_files
            },
            'output_files': {
                'total_records': self.stats.total_records,
                'total_size_mb': self.stats.total_size_bytes / 1024**2,
                'avg_record_size_kb': (self.stats.total_size_bytes / self.stats.total_records / 1024) if self.stats.total_records else 0
            },
            'generated_at': datetime.utcnow().isoformat()
        }
        
        metadata_path = self.output_dir / 'metadata' / 'processing_metadata.json'
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📋 Metadata saved to: {metadata_path}")
        return str(metadata_path)

    def run_full_pipeline(self) -> Dict[str, str]:
        """Run the complete data processing pipeline"""
        logger.info("🚀 Starting enhanced data processing pipeline...")
        
        # Process all files
        self.process_all_files()
        
        if not self.records:
            logger.warning("⚠️ No records to process!")
            return {}
        
        # Create outputs
        outputs = {}
        
        # Combined output
        outputs['combined'] = self.create_combined_output()
        
        # Sharded outputs
        shard_files = self.create_shards()
        outputs['shards'] = shard_files
        
        # Quality report
        outputs['quality_report'] = self.generate_quality_report()
        
        # Metadata
        outputs['metadata'] = self.save_metadata()
        
        # Final summary
        logger.info("🎉 Pipeline completed successfully!")
        logger.info(f"📊 Processed {self.stats.total_records} records from {self.stats.processed_files} files")
        logger.info(f"📁 Output directory: {self.output_dir}")
        logger.info(f"⏱️ Total processing time: {self.stats.processing_time:.2f}s")
        
        return outputs

def main():
    """Main entry point with command line interface"""
    parser = argparse.ArgumentParser(description='Enhanced Data Processing Pipeline')
    parser.add_argument('--base-dir', required=True, help='Base directory containing scraped data')
    parser.add_argument('--output-dir', help='Output directory (default: base_dir/processed_output)')
    parser.add_argument('--max-length', type=int, default=8000, help='Maximum content length')
    parser.add_argument('--min-length', type=int, default=100, help='Minimum content length')
    parser.add_argument('--shard-size', type=float, default=2.0, help='Shard size in GB')
    parser.add_argument('--quality-threshold', type=float, default=0.5, help='Minimum quality score')
    parser.add_argument('--no-cleanup', action='store_true', help='Skip file cleanup')
    
    args = parser.parse_args()
    
    # Create processor
    processor = EnhancedDataProcessor(
        base_dir=args.base_dir,
        output_dir=args.output_dir,
        max_content_length=args.max_length,
        min_content_length=args.min_length,
        shard_size_gb=args.shard_size,
        quality_threshold=args.quality_threshold
    )
    
    # Run pipeline
    outputs = processor.run_full_pipeline()
    
    print("\n" + "="*60)
    print("🎉 PROCESSING COMPLETE!")
    print("="*60)
    print(f"📁 Output directory: {processor.output_dir}")
    print(f"📄 Total records: {processor.stats.total_records}")
    print(f"📊 Files processed: {processor.stats.processed_files}/{processor.stats.total_files}")
    print(f"⏱️ Processing time: {processor.stats.processing_time:.2f}s")
    print(f"💾 Total size: {processor.stats.total_size_bytes / 1024**2:.1f} MB")
    print("="*60)

if __name__ == "__main__":
    main()
