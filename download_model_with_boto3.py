#!/usr/bin/env python3
"""
Download and extract model from S3 using boto3
This script downloads the model, extracts it, and verifies the setup
"""

import os
import sys
import boto3
import tarfile
from pathlib import Path

# Configuration
WORKDIR = "/workspace/model_api"
MODEL_DIR = os.path.join(WORKDIR, "extracted")
TAR_FILE = os.path.join(WORKDIR, "medarion-final-model.tar.gz")
BUCKET = "medarion7b-model-2025-ue2"
TARGZ_KEY = "medarion-final-model.tar.gz"
REGION = "us-east-2"

# AWS Credentials
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "YOUR_AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "YOUR_AWS_SECRET_ACCESS_KEY")

def format_size(size_bytes):
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

print("=" * 70)
print("🚀 Downloading and Setting Up Model from S3")
print("=" * 70)
print(f"📦 Bucket: s3://{BUCKET}/{TARGZ_KEY}")
print(f"📁 Working directory: {WORKDIR}")
print(f"📂 Model directory: {MODEL_DIR}")
print("=" * 70)

# Create working directory
os.makedirs(WORKDIR, exist_ok=True)
os.chdir(WORKDIR)

# Initialize S3 client
print("\n📡 Connecting to S3...")
try:
    s3 = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=REGION
    )
    print("   ✅ S3 connection established")
except Exception as e:
    print(f"   ❌ S3 connection failed: {e}")
    sys.exit(1)

# Step 1: Download model from S3
print("\n📥 Step 1: Downloading model from S3...")
print("-" * 70)

if os.path.exists(TAR_FILE):
    size = os.path.getsize(TAR_FILE)
    print(f"   ✅ Model file already exists: {format_size(size)}")
    print(f"   Location: {TAR_FILE}")
    print("   Skipping download...")
else:
    try:
        # Get file size
        response = s3.head_object(Bucket=BUCKET, Key=TARGZ_KEY)
        total_size = response['ContentLength']
        print(f"   Size: {format_size(total_size)}")
        print(f"   Downloading to: {TAR_FILE}")
        print("   This may take 10-20 minutes depending on connection...")
        
        # Download with progress
        class ProgressCallback:
            def __init__(self, total):
                self.total = total
                self.downloaded = 0
            def __call__(self, bytes_amount):
                self.downloaded += bytes_amount
                percent = (self.downloaded / self.total) * 100
                print(f"\r   Progress: {percent:.1f}% ({format_size(self.downloaded)} / {format_size(self.total)})", end='', flush=True)
        
        callback = ProgressCallback(total_size)
        s3.download_file(BUCKET, TARGZ_KEY, TAR_FILE, Callback=callback)
        print()  # New line after progress
        
        # Verify download
        if os.path.exists(TAR_FILE):
            actual_size = os.path.getsize(TAR_FILE)
            if actual_size == total_size:
                print(f"   ✅ Download complete: {format_size(actual_size)}")
            else:
                print(f"   ⚠️  Size mismatch: expected {format_size(total_size)}, got {format_size(actual_size)}")
        else:
            print("   ❌ Download failed - file not found")
            sys.exit(1)
            
    except Exception as e:
        print(f"   ❌ Download failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Step 2: Extract model
print("\n📂 Step 2: Extracting model...")
print("-" * 70)

if os.path.exists(MODEL_DIR) and os.listdir(MODEL_DIR):
    print("   ✅ Model already extracted")
    print(f"   Location: {MODEL_DIR}")
    print("   Contents:")
    for item in os.listdir(MODEL_DIR)[:5]:
        item_path = os.path.join(MODEL_DIR, item)
        if os.path.isfile(item_path):
            size = os.path.getsize(item_path)
            print(f"      {item}: {format_size(size)}")
        else:
            print(f"      {item}/ (directory)")
else:
    try:
        print("   Extracting (this may take 5-10 minutes)...")
        os.makedirs(MODEL_DIR, exist_ok=True)
        
        with tarfile.open(TAR_FILE, 'r:gz') as tar:
            # Get total members for progress
            members = tar.getmembers()
            total = len(members)
            print(f"   Extracting {total} files...")
            
            for i, member in enumerate(members):
                tar.extract(member, MODEL_DIR)
                if (i + 1) % 100 == 0 or i == total - 1:
                    print(f"\r   Progress: {i + 1}/{total} files", end='', flush=True)
            
            print()  # New line after progress
        
        # Verify extraction
        if os.path.exists(MODEL_DIR) and os.listdir(MODEL_DIR):
            total_size = sum(
                os.path.getsize(os.path.join(dirpath, filename))
                for dirpath, dirnames, filenames in os.walk(MODEL_DIR)
                for filename in filenames
            )
            print(f"   ✅ Extraction complete: {format_size(total_size)}")
            print("   Key files:")
            for item in os.listdir(MODEL_DIR)[:5]:
                print(f"      {item}")
        else:
            print("   ❌ Extraction failed - directory empty")
            sys.exit(1)
            
    except Exception as e:
        print(f"   ❌ Extraction failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Step 3: Verify model files
print("\n🔍 Step 3: Verifying model files...")
print("-" * 70)

required_files = ["config.json"]
optional_files = ["pytorch_model.bin", "pytorch_model.bin.index.json", "tokenizer_config.json", "vocab.json"]

found_required = []
missing_required = []

for file in required_files:
    file_path = os.path.join(MODEL_DIR, file)
    if os.path.exists(file_path):
        found_required.append(file)
        size = os.path.getsize(file_path)
        print(f"   ✅ {file}: {format_size(size)}")
    else:
        missing_required.append(file)
        print(f"   ❌ {file}: NOT FOUND")

if missing_required:
    print(f"\n   ⚠️  Missing required files: {', '.join(missing_required)}")
    print("   Listing all files in model directory:")
    for item in os.listdir(MODEL_DIR):
        print(f"      {item}")
else:
    print("\n   ✅ All required files found")

# Check for optional files
found_optional = [f for f in optional_files if os.path.exists(os.path.join(MODEL_DIR, f))]
if found_optional:
    print(f"   ✅ Optional files found: {', '.join(found_optional)}")

print("\n" + "=" * 70)
print("✅ Model Setup Complete!")
print("=" * 70)
print(f"📂 Model location: {MODEL_DIR}")
print("🚀 Ready for API to load!")
print("=" * 70)

