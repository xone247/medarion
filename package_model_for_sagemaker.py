#!/usr/bin/env python3
"""
Package model files from D:\medarion-merged into TAR.GZ for SageMaker
Uses improved inference.py and ensures all files are in root
"""
import os
import tarfile
import shutil
import boto3
from tqdm import tqdm
from pathlib import Path

# Configuration
SOURCE_DIR = r"D:\medarion-merged"
IMPROVED_INFERENCE = r"C:\xampp\htdocs\medarion\improved_inference.py"
OUTPUT_TAR = r"D:\medarion-final-model-sagemaker.tar.gz"

AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID'
AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY'
AWS_REGION = 'us-east-2'
BUCKET = "medarion7b-model-2025-ue2"
S3_KEY = "medarion-final-model.tar.gz"

def format_size(size_bytes):
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"

print("=" * 70)
print("📦 PACKAGING MODEL FOR SAGEMAKER")
print("=" * 70)
print(f"📁 Source: {SOURCE_DIR}")
print(f"📦 Output: {OUTPUT_TAR}")
print(f"☁️  S3 Target: s3://{BUCKET}/{S3_KEY}")
print("=" * 70)

# Step 1: Verify source directory
print("\n📋 Step 1: Verifying source directory...")
if not os.path.exists(SOURCE_DIR):
    print(f"❌ Source directory not found: {SOURCE_DIR}")
    exit(1)

files = list(Path(SOURCE_DIR).glob("*"))
files = [f for f in files if f.is_file()]

print(f"✅ Found {len(files)} files in source directory")

# Check for required files
required_files = ['config.json', 'inference.py']
model_files = [f for f in files if 'model' in f.name.lower() or 'safetensors' in f.name.lower()]
tokenizer_files = [f for f in files if 'tokenizer' in f.name.lower()]

print(f"\n📊 File Analysis:")
print(f"   Model files: {len(model_files)}")
for mf in model_files:
    size_mb = mf.stat().st_size / (1024 * 1024)
    print(f"      - {mf.name} ({size_mb:.2f} MB)")

print(f"   Tokenizer files: {len(tokenizer_files)}")
for tf in tokenizer_files:
    print(f"      - {tf.name}")

print(f"   Config files: {len([f for f in files if 'config' in f.name.lower()])}")
print(f"   Total files: {len(files)}")

# Check for inference.py
has_inference = any(f.name == 'inference.py' for f in files)
if has_inference:
    print(f"\n✅ inference.py found in source")
else:
    print(f"\n⚠️  inference.py not found in source")

# Step 2: Use improved inference.py
print("\n📋 Step 2: Preparing inference.py...")
if os.path.exists(IMPROVED_INFERENCE):
    print(f"✅ Found improved inference.py: {IMPROVED_INFERENCE}")
    # We'll use this when creating the TAR
    use_improved = True
else:
    print(f"⚠️  Improved inference.py not found, using existing one")
    use_improved = False

# Step 3: Create TAR.GZ with all files in root
print("\n📋 Step 3: Creating TAR.GZ archive...")
print("   All files will be in root level for SageMaker compatibility")

total_size = sum(f.stat().st_size for f in files)
print(f"   Total size: {format_size(total_size)}")

try:
    with tarfile.open(OUTPUT_TAR, 'w:gz') as tar:
        file_count = 0
        
        with tqdm(total=len(files), desc='   Archiving', unit='files', ncols=100) as pbar:
            for file_path in files:
                # Use just the filename (root level)
                arcname = file_path.name
                
                # If this is inference.py and we have improved version, use improved
                if arcname == 'inference.py' and use_improved:
                    print(f"\n   📝 Using improved inference.py")
                    tar.add(IMPROVED_INFERENCE, arcname=arcname)
                else:
                    tar.add(file_path, arcname=arcname)
                
                file_count += 1
                pbar.update(1)
                
                if pbar.n % 5 == 0:
                    pbar.set_postfix(file=arcname[:40])
    
    output_size = os.path.getsize(OUTPUT_TAR)
    print(f"\n   ✅ Created TAR.GZ: {format_size(output_size)}")
    print(f"   ✅ Archived {file_count} files")
    
except Exception as e:
    print(f"   ❌ Archive creation failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Step 4: Verify TAR.GZ contents
print("\n📋 Step 4: Verifying TAR.GZ structure...")
try:
    with tarfile.open(OUTPUT_TAR, 'r:gz') as tar:
        members = tar.getmembers()
        files_in_tar = [m for m in members if m.isfile()]
        
        print(f"   ✅ TAR.GZ contains {len(files_in_tar)} files")
        
        # Check all files are in root
        root_files = [m for m in files_in_tar if '/' not in m.name]
        nested_files = [m for m in files_in_tar if '/' in m.name]
        
        print(f"   ✅ Root-level files: {len(root_files)}")
        if nested_files:
            print(f"   ⚠️  Nested files: {len(nested_files)}")
            for nf in nested_files[:5]:
                print(f"      - {nf.name}")
        else:
            print("   ✅ All files are in root (perfect for SageMaker!)")
        
        # Check for inference.py
        has_inference = any('inference.py' in m.name for m in files_in_tar)
        if has_inference:
            inference_files = [m for m in files_in_tar if 'inference.py' in m.name]
            print(f"\n   ✅ inference.py found:")
            for inf in inference_files:
                print(f"      - {inf.name} ({format_size(inf.size)})")
        else:
            print("\n   ❌ inference.py NOT FOUND in TAR.GZ!")
        
        # Check for model files
        model_files_in_tar = [m for m in files_in_tar if 'model' in m.name.lower() or 'safetensors' in m.name.lower()]
        print(f"\n   ✅ Model files: {len(model_files_in_tar)}")
        for mf in model_files_in_tar:
            print(f"      - {mf.name} ({format_size(mf.size)})")
        
        # Check for config.json
        has_config = any('config.json' in m.name for m in files_in_tar)
        if has_config:
            print(f"   ✅ config.json found")
        else:
            print(f"   ❌ config.json NOT FOUND!")
        
except Exception as e:
    print(f"   ❌ Verification failed: {e}")

# Step 5: Upload to S3
print("\n📋 Step 5: Uploading to S3...")
print(f"   Target: s3://{BUCKET}/{S3_KEY}")

s3 = boto3.client('s3', region_name=AWS_REGION,
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

try:
    file_size = os.path.getsize(OUTPUT_TAR)
    
    class UploadCallback:
        def __init__(self, total_size, desc):
            self.pbar = tqdm(total=total_size, unit='B', unit_scale=True, desc=desc, ncols=100)
        def __call__(self, bytes_amount):
            self.pbar.update(bytes_amount)
        def close(self):
            self.pbar.close()
    
    callback = UploadCallback(file_size, "   Uploading")
    s3.upload_file(
        OUTPUT_TAR,
        BUCKET,
        S3_KEY,
        ExtraArgs={'ContentType': 'application/gzip'},
        Callback=callback
    )
    callback.close()
    
    print("   ✅ Upload complete")
    
    # Verify upload
    print("   Verifying upload...")
    response = s3.head_object(Bucket=BUCKET, Key=S3_KEY)
    uploaded_size = response['ContentLength']
    print(f"   ✅ Verified size: {format_size(uploaded_size)}")
    
except Exception as e:
    print(f"   ❌ Upload failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Step 6: Also upload improved inference.py to S3
print("\n📋 Step 6: Uploading improved inference.py to S3...")
if use_improved:
    try:
        s3.upload_file(
            IMPROVED_INFERENCE,
            BUCKET,
            "inference.py",
            ExtraArgs={'ContentType': 'text/plain'}
        )
        print("   ✅ Improved inference.py uploaded to S3")
    except Exception as e:
        print(f"   ⚠️  Could not upload inference.py: {e}")

print("\n" + "=" * 70)
print("✅ PACKAGING COMPLETE!")
print("=" * 70)
print(f"📦 TAR.GZ created: {OUTPUT_TAR}")
print(f"📦 TAR.GZ uploaded: s3://{BUCKET}/{S3_KEY}")
print(f"✅ All files are in root level")
print(f"✅ inference.py included (improved version)")
print("=" * 70)
print("\n💡 Next step: Redeploy SageMaker endpoint")
print("   Run: python deploy_sagemaker.py")

