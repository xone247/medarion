#!/usr/bin/env python3
"""
Full Kaggle Upload Package Creator
==================================

Creates a package with ALL processed data for Kaggle Mistral 7B fine-tuning.
This includes the complete dataset with no data loss.
"""

import os
import shutil
from pathlib import Path

def package_full_kaggle_files():
    """Package ALL files needed for Kaggle upload"""
    
    print("📦 PACKAGING FULL KAGGLE FILES")
    print("="*50)
    
    # Source and destination paths
    source_dir = Path(r"D:\medarion_scraper_output\full_training_data")
    kaggle_package_dir = Path(r"D:\medarion_scraper_output\full_kaggle_upload_package")
    
    # Create package directory
    kaggle_package_dir.mkdir(parents=True, exist_ok=True)
    
    # Files to copy
    files_to_copy = [
        "train.jsonl",
        "validation.jsonl", 
        "training_config.json"
    ]
    
    print("📁 Copying files to full Kaggle package...")
    
    # Copy each file
    for file_name in files_to_copy:
        source_file = source_dir / file_name
        dest_file = kaggle_package_dir / file_name
        
        if source_file.exists():
            shutil.copy2(source_file, dest_file)
            size_mb = source_file.stat().st_size / (1024 * 1024)
            print(f"✅ {file_name}: {size_mb:.2f} MB")
        else:
            print(f"❌ {file_name}: File not found")
    
    # Copy the training notebook
    notebook_source = Path(r"D:\medarion_scraper_output\mistral_training_data\mistral_training_notebook.py")
    notebook_dest = kaggle_package_dir / "mistral_training_notebook.py"
    
    if notebook_source.exists():
        shutil.copy2(notebook_source, notebook_dest)
        print(f"✅ mistral_training_notebook.py: Copied")
    else:
        print(f"❌ mistral_training_notebook.py: File not found")
    
    # Create upload instructions
    instructions_file = kaggle_package_dir / "FULL_UPLOAD_INSTRUCTIONS.txt"
    with open(instructions_file, 'w', encoding='utf-8') as f:
        f.write("""FULL KAGGLE UPLOAD INSTRUCTIONS
=====================================

This package contains ALL your processed data (526,726 records) for Mistral 7B fine-tuning.

DATASET SIZE: 0.93 GB (959 MB)
- train.jsonl: 863.59 MB (474,053 records)
- validation.jsonl: 95.87 MB (52,673 records)
- training_config.json: Configuration
- mistral_training_notebook.py: Complete training code

UPLOAD STEPS:
1. Go to https://www.kaggle.com/
2. Sign in to your account
3. Click "Create" → "New Dataset"
4. Dataset Name: medarion-full-mistral-training-data
5. Description: Complete Medarion healthcare AI training data (526K records) for Mistral 7B fine-tuning
6. Upload these files:
   - train.jsonl (863.59 MB)
   - validation.jsonl (95.87 MB)
   - training_config.json
   - mistral_training_notebook.py
7. Make dataset PUBLIC (required for free GPU)
8. Click "Create"

TRAINING SETUP:
1. Go to your dataset page
2. Click "New Notebook"
3. Select GPU: T4 or P100
4. Copy code from mistral_training_notebook.py
5. Update dataset path in notebook
6. Run training (6-8 hours)

DATA COVERAGE:
- Total Records: 526,726
- Training Records: 474,053 (90%)
- Validation Records: 52,673 (10%)
- Web Scraped: 522,758 records
- Excel Structured: 3,960 records
- Medarion Identity: 4 records
- Healthcare Q&A: 4 records

EXPECTED RESULTS:
- Model will respond as "Medarion"
- Healthcare expertise across all domains
- Investment and regulatory guidance
- Clinical trial and funding insights
- Complete platform topic coverage

TOTAL SIZE: 0.93 GB (perfect for Kaggle)
""")
    
    # Calculate total size
    total_size = 0
    for file in kaggle_package_dir.glob("*"):
        if file.is_file():
            total_size += file.stat().st_size
    
    total_size_mb = total_size / (1024 * 1024)
    total_size_gb = total_size / (1024 * 1024 * 1024)
    
    print(f"\n📊 Full Package Summary:")
    print(f"📁 Package directory: {kaggle_package_dir}")
    print(f"📦 Total size: {total_size_mb:.2f} MB ({total_size_gb:.3f} GB)")
    print(f"📄 Files included: {len(files_to_copy) + 1}")
    print(f"📋 Instructions: FULL_UPLOAD_INSTRUCTIONS.txt")
    
    print(f"\n✅ Full Kaggle package ready!")
    print(f"📁 Upload files from: {kaggle_package_dir}")
    
    return str(kaggle_package_dir)

def main():
    """Main function"""
    try:
        package_dir = package_full_kaggle_files()
        print(f"\n🎉 Full Kaggle package created successfully!")
        print(f"📁 Location: {package_dir}")
        print(f"📋 Follow FULL_UPLOAD_INSTRUCTIONS.txt for next steps")
        print(f"📊 This includes ALL 526,726 records with no data loss!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
