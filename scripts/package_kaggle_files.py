#!/usr/bin/env python3
"""
Kaggle Upload Package Creator
============================

Creates a package with all files needed for Kaggle Mistral 7B fine-tuning.
"""

import os
import shutil
from pathlib import Path

def package_kaggle_files():
    """Package all files needed for Kaggle upload"""
    
    print("📦 PACKAGING KAGGLE FILES")
    print("="*50)
    
    # Source and destination paths
    source_dir = Path(r"D:\medarion_scraper_output\mistral_training_data")
    kaggle_package_dir = Path(r"D:\medarion_scraper_output\kaggle_upload_package")
    
    # Create package directory
    kaggle_package_dir.mkdir(parents=True, exist_ok=True)
    
    # Files to copy
    files_to_copy = [
        "train.jsonl",
        "validation.jsonl", 
        "training_config.json",
        "mistral_training_notebook.py"
    ]
    
    print("📁 Copying files to Kaggle package...")
    
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
    
    # Create upload instructions
    instructions_file = kaggle_package_dir / "UPLOAD_INSTRUCTIONS.txt"
    with open(instructions_file, 'w', encoding='utf-8') as f:
        f.write("""KAGGLE UPLOAD INSTRUCTIONS
========================

1. Go to https://www.kaggle.com/
2. Sign in to your account
3. Click "Create" → "New Dataset"
4. Dataset Name: medarion-mistral-training-data
5. Description: Medarion healthcare AI training data for Mistral 7B fine-tuning
6. Upload these files:
   - train.jsonl (510.49 MB)
   - validation.jsonl (56.69 MB)
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
6. Run training (4-6 hours)

FILES INCLUDED:
- train.jsonl: 474,053 training records
- validation.jsonl: 52,673 validation records  
- training_config.json: Training configuration
- mistral_training_notebook.py: Complete training code

TOTAL SIZE: 0.56 GB (perfect for Kaggle)
""")
    
    # Calculate total size
    total_size = 0
    for file in kaggle_package_dir.glob("*"):
        if file.is_file():
            total_size += file.stat().st_size
    
    total_size_mb = total_size / (1024 * 1024)
    total_size_gb = total_size / (1024 * 1024 * 1024)
    
    print(f"\n📊 Package Summary:")
    print(f"📁 Package directory: {kaggle_package_dir}")
    print(f"📦 Total size: {total_size_mb:.2f} MB ({total_size_gb:.3f} GB)")
    print(f"📄 Files included: {len(files_to_copy)}")
    print(f"📋 Instructions: UPLOAD_INSTRUCTIONS.txt")
    
    print(f"\n✅ Kaggle package ready!")
    print(f"📁 Upload files from: {kaggle_package_dir}")
    
    return str(kaggle_package_dir)

def main():
    """Main function"""
    try:
        package_dir = package_kaggle_files()
        print(f"\n🎉 Kaggle package created successfully!")
        print(f"📁 Location: {package_dir}")
        print(f"📋 Follow UPLOAD_INSTRUCTIONS.txt for next steps")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
