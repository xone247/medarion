# Enhanced Data Processing Pipeline

A comprehensive data cleaning, validation, and organization pipeline for processing scraped data into training-ready datasets.

## 🚀 Quick Start

### 1. Basic Usage
```bash
# Simple processing with default settings
python process_data.py
```

### 2. Advanced Usage
```bash
# Use the full processor with custom settings
python enhanced_data_processor.py --base-dir "D:\your_data_directory" --output-dir "D:\processed_output" --quality-threshold 0.5
```

## 📁 Output Structure

After processing, you'll get:

```
processed_output/
├── cleaned_data.jsonl          # Combined dataset
├── shards/                     # Sharded files (2GB each)
│   ├── shard_000.jsonl
│   ├── shard_001.jsonl
│   └── ...
├── metadata/                   # Processing metadata
│   └── processing_metadata.json
└── quality_reports/            # Quality analysis
    └── processing_report.json
```

## 🔧 Configuration Options

### Processing Configurations

| Configuration | Description | Quality Threshold | Max Length | Use Case |
|---------------|-------------|-------------------|------------|----------|
| `default` | Balanced quality/quantity | 0.3 | 8000 | General purpose |
| `high_quality` | Strict filtering | 0.7 | 5000 | Premium datasets |
| `bulk_processing` | Keep more data | 0.2 | 12000 | Large-scale processing |
| `training_ready` | ML optimized | 0.5 | 6000 | Training datasets |

### Command Line Options

```bash
python enhanced_data_processor.py \
  --base-dir "D:\medarion_scraper_output" \
  --output-dir "D:\processed_output" \
  --max-length 8000 \
  --min-length 100 \
  --shard-size 2.0 \
  --quality-threshold 0.3
```

## 📊 Quality Metrics

The processor calculates quality scores based on:

- **Content Length**: Optimal range (100-8000 chars)
- **Text Diversity**: Unique word ratio
- **Sentence Structure**: Average sentence length
- **Metadata Completeness**: Title, URL presence
- **Repetition Detection**: Avoids excessive duplication

## 🧹 File Cleanup

Automatically removes unnecessary files:
- Images: `.png`, `.jpg`, `.gif`, etc.
- Stylesheets: `.css`, `.js`
- Fonts: `.woff`, `.ttf`, etc.
- Archives: `.zip`, `.tar`, etc.
- Media: `.mp4`, `.mp3`, etc.

## 📈 Processing Statistics

The pipeline tracks:
- Files processed vs. skipped
- Quality score distribution
- Content size metrics
- Processing time
- Error handling

## 🔍 Data Record Structure

Each processed record contains:

```json
{
  "id": "unique_16_char_id",
  "source_file": "relative/path/to/source",
  "content": "cleaned_text_content",
  "metadata": {
    "title": "extracted_title",
    "source_url": "original_url",
    "word_count": 1234,
    "quality_score": 0.85,
    "extracted_urls": ["url1", "url2"],
    "extracted_emails": ["email@example.com"]
  },
  "created_at": "2024-01-01T00:00:00Z",
  "quality_score": 0.85
}
```

## 🛠️ Advanced Features

### Custom Text Cleaning
- HTML tag removal
- Script/style tag removal
- Whitespace normalization
- Special character filtering
- Encoding detection

### Intelligent File Detection
- Extension-based filtering
- MIME type detection
- Content analysis
- Encoding detection

### Quality Assessment
- Multi-factor scoring
- Content diversity analysis
- Metadata completeness
- Repetition detection

## 📋 Requirements

### Minimum Requirements
```bash
pip install chardet
```

### Optional Enhancements
```bash
pip install pandas numpy tqdm click pyyaml jsonschema
```

## 🚨 Troubleshooting

### Common Issues

1. **Encoding Errors**
   - The processor auto-detects encoding
   - Falls back to UTF-8 with error handling

2. **Memory Issues**
   - Uses streaming processing
   - Configurable shard sizes
   - Progress tracking

3. **Quality Threshold Too High**
   - Lower the `--quality-threshold` parameter
   - Check quality report for distribution

### Performance Tips

1. **Large Datasets**
   - Use smaller shard sizes (1GB)
   - Increase quality threshold to reduce records

2. **Quality Focus**
   - Use `high_quality` configuration
   - Increase minimum content length

3. **Speed Optimization**
   - Use `bulk_processing` configuration
   - Lower quality threshold

## 📊 Example Output

```
🚀 Starting Enhanced Data Processing...
📁 Source directory: D:\medarion_scraper_output
📁 Output directory: D:\medarion_scraper_output\processed_output
------------------------------------------------------------
🧹 Cleaning up unnecessary files...
Processed 100 records...
Processed 200 records...
...
✅ Processing complete!
📊 Stats: 1,234/1,500 files processed
📄 Total records: 1,234
⏱️ Processing time: 45.67s
📦 Creating shards...
Created shard 0: 500 records, 1.8 GB
Created shard 1: 500 records, 1.9 GB
Created final shard 2: 234 records, 0.8 GB
📄 Creating combined output...
✅ Combined dataset written to: cleaned_data.jsonl
📊 Generating quality report...
📋 Metadata saved to: processing_metadata.json

============================================================
🎉 PROCESSING COMPLETE!
============================================================
📄 Total records processed: 1,234
📊 Files processed: 1,234/1,500
⏱️ Processing time: 45.67 seconds
💾 Total data size: 4.5 MB
🧹 Files cleaned up: 266
============================================================
```

## 🔄 Integration with Existing Pipeline

This processor integrates with your existing data pipeline:

1. **Raw Data** → `enhanced_data_processor.py` → **Cleaned Data**
2. **Cleaned Data** → `normalize.py` → **Normalized Data**
3. **Normalized Data** → `chunk.py` → **Training Chunks**

## 📞 Support

For issues or questions:
1. Check the processing logs
2. Review quality reports
3. Adjust configuration parameters
4. Check file permissions and paths
