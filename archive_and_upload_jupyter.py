#!/usr/bin/env python3
"""
Run this script from the EXTRACTED folder in Jupyter terminal
Archives all files to TAR.GZ, verifies structure, and uploads to S3
"""
import boto3
import tarfile
import os
import sys
from tqdm import tqdm

# ============================================================================
# CONFIGURATION
# ============================================================================
AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID'
AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY'
AWS_REGION = 'us-east-2'
BUCKET = "medarion7b-model-2025-ue2"
TARGZ_KEY = "medarion-final-model.tar.gz"

# Working directory - script runs from extracted folder
CURRENT_DIR = os.getcwd()  # Current directory (extracted folder)
TAR_LOCAL = os.path.join(os.path.dirname(CURRENT_DIR), "output.tar.gz")  # One level up

# ============================================================================

def format_size(size_bytes):
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} GB"

print("=" * 70)
print("📦 ARCHIVE TO TAR.GZ AND UPLOAD TO S3")
print("=" * 70)
print(f"📁 Current directory: {CURRENT_DIR}")
print(f"📦 Output TAR.GZ: {TAR_LOCAL}")
print(f"☁️  S3 target: s3://{BUCKET}/{TARGZ_KEY}")
print("=" * 70)

# Initialize S3 client
s3 = boto3.client('s3', 
                  region_name=AWS_REGION,
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

# ============================================================================
# STEP 1: Verify structure before archiving
# ============================================================================
print("\n" + "=" * 70)
print("🔍 STEP 1: Verifying file structure")
print("=" * 70)

try:
    all_files = []
    safetensors_files = []
    
    for root, dirs, filenames in os.walk(CURRENT_DIR):
        # Skip .ipynb_checkpoints directory
        if '.ipynb_checkpoints' in root:
            continue
            
        for filename in filenames:
            filepath = os.path.join(root, filename)
            relpath = os.path.relpath(filepath, CURRENT_DIR)
            
            # Skip checkpoint files
            if 'checkpoint' in filename.lower() or '.ipynb_checkpoints' in relpath:
                continue
                
            all_files.append(relpath)
            
            # Only count actual .safetensors files (not .json files)
            if filename.lower().endswith('.safetensors') and 'safetensors' in filename.lower():
                safetensors_files.append((relpath, filepath))
    
    print(f"   Total files: {len(all_files)}")
    print(f"   Safetensors files: {len(safetensors_files)}")
    
    # Check for all 3 safetensors files
    if len(safetensors_files) == 3:
        print("   ✅ All 3 safetensors files found (required for Mistral 7B)")
        for relpath, filepath in sorted(safetensors_files):
            size = os.path.getsize(filepath)
            print(f"      - {relpath} ({format_size(size)})")
    elif len(safetensors_files) > 0:
        print(f"   ❌ ERROR: Found {len(safetensors_files)} safetensors files, expected 3!")
        for relpath, filepath in sorted(safetensors_files):
            print(f"      - {relpath}")
        sys.exit(1)
    else:
        print("   ❌ ERROR: No safetensors files found!")
        sys.exit(1)
    
    # Check inference.py
    inference_path = os.path.join(CURRENT_DIR, "inference.py")
    if os.path.exists(inference_path):
        size = os.path.getsize(inference_path)
        print(f"   ✅ inference.py found ({format_size(size)})")
    else:
        print("   ❌ ERROR: inference.py not found!")
        print(f"      Expected at: {inference_path}")
        sys.exit(1)
    
    # Check config.json
    if any('config.json' in f for f in all_files):
        print("   ✅ config.json found")
    else:
        print("   ⚠️  WARNING: config.json not found")
    
    # Check model.safetensors.index.json (REQUIRED - must be in TAR.GZ)
    index_json_files = [f for f in all_files if 'safetensors.index.json' in f.lower() and 
                        not 'checkpoint' in f.lower()]
    if index_json_files:
        print(f"   ✅ model.safetensors.index.json found: {index_json_files[0]}")
        print("      (REQUIRED for loading 3 safetensors files - will be included in TAR.GZ)")
    else:
        print("   ❌ ERROR: model.safetensors.index.json not found!")
        print("      This file is REQUIRED when using multiple safetensors files")
        print("      The model will NOT load without it!")
        sys.exit(1)
    
    print("\n   ✅ Structure verification complete!")
    
except Exception as e:
    print(f"   ❌ Verification failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ============================================================================
# STEP 2: Create TAR.GZ (all files in root level)
# ============================================================================
print("\n" + "=" * 70)
print("📦 STEP 2: Creating TAR.GZ (all files in root level)")
print("=" * 70)

try:
    # Collect all files and flatten to root level
    files_to_archive = []
    for root, dirs, filenames in os.walk(CURRENT_DIR):
        # Skip .ipynb_checkpoints directory (but keep model.safetensors.index.json)
        if '.ipynb_checkpoints' in root:
            continue
            
        for filename in filenames:
            filepath = os.path.join(root, filename)
            relpath = os.path.relpath(filepath, CURRENT_DIR)
            
            # Skip checkpoint files (but keep model.safetensors.index.json)
            if 'checkpoint' in filename.lower() and '.ipynb_checkpoints' in relpath:
                continue
            
            # Use just filename for root-level placement
            arcname = os.path.basename(relpath) if '/' in relpath else relpath
            files_to_archive.append((filepath, arcname))
    
    print(f"   Archiving {len(files_to_archive)} files to root level...")
    
    # Create parent directory if needed
    os.makedirs(os.path.dirname(TAR_LOCAL), exist_ok=True)
    
    with tarfile.open(TAR_LOCAL, 'w:gz') as tar:
        with tqdm(total=len(files_to_archive), desc='   Creating TAR.GZ', 
                 unit='files', ncols=100) as pbar:
            for filepath, arcname in files_to_archive:
                tar.add(filepath, arcname=arcname)
                pbar.update(1)
                if pbar.n % 50 == 0:
                    pbar.set_postfix(file=arcname[:40])
    
    tar_size = os.path.getsize(TAR_LOCAL)
    print(f"   ✅ Created TAR.GZ: {format_size(tar_size)}")
    print(f"   Location: {TAR_LOCAL}")
    
except Exception as e:
    print(f"   ❌ TAR.GZ creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ============================================================================
# STEP 3: Verify TAR.GZ structure
# ============================================================================
print("\n" + "=" * 70)
print("🔍 STEP 3: Verifying TAR.GZ structure")
print("=" * 70)

try:
    with tarfile.open(TAR_LOCAL, 'r:gz') as tar:
        members = tar.getmembers()
        files = [m for m in members if m.isfile()]
        
        root_files = [m for m in files if '/' not in m.name]
        nested_files = [m for m in files if '/' in m.name]
        
        print(f"   Files in TAR.GZ: {len(files)}")
        print(f"   Root-level: {len(root_files)}")
        print(f"   Nested: {len(nested_files)}")
        
        # Check safetensors
        safetensors = [m for m in files if 'safetensors' in m.name.lower()]
        print(f"\n   Safetensors files: {len(safetensors)}")
        if len(safetensors) == 3:
            print("   ✅ All 3 safetensors files present")
        else:
            print(f"   ⚠️  Expected 3, found {len(safetensors)}")
        
        # Check inference.py
        inference = [m for m in files if 'inference.py' in m.name]
        if inference:
            print(f"   ✅ inference.py present: {inference[0].name}")
        else:
            print("   ❌ inference.py NOT FOUND!")
            sys.exit(1)
        
        # Check index.json
        index_json = [m for m in files if 'safetensors.index.json' in m.name.lower()]
        if index_json:
            print(f"   ✅ model.safetensors.index.json present: {index_json[0].name}")
        else:
            print("   ⚠️  model.safetensors.index.json NOT FOUND!")
        
        if len(root_files) == len(files) and len(safetensors) == 3:
            print("\n   ✅ TAR.GZ structure is CORRECT!")
        else:
            print("\n   ⚠️  TAR.GZ structure has issues")
            if len(root_files) != len(files):
                print(f"      - Some files are nested (expected all in root)")
            if len(safetensors) != 3:
                print(f"      - Missing safetensors files")
                
except Exception as e:
    print(f"   ❌ Verification failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ============================================================================
# STEP 4: Upload TAR.GZ to S3
# ============================================================================
print("\n" + "=" * 70)
print("☁️  STEP 4: Uploading TAR.GZ to S3")
print("=" * 70)

try:
    file_size = os.path.getsize(TAR_LOCAL)
    print(f"   Size: {format_size(file_size)}")
    print(f"   Uploading to: s3://{BUCKET}/{TARGZ_KEY}")
    
    class UploadCallback:
        def __init__(self, total_size):
            self.pbar = tqdm(total=total_size, unit='B', unit_scale=True,
                           desc='   Uploading', ncols=100)
        def __call__(self, bytes_amount):
            self.pbar.update(bytes_amount)
        def close(self):
            self.pbar.close()
    
    callback = UploadCallback(file_size)
    s3.upload_file(
        TAR_LOCAL,
        BUCKET,
        TARGZ_KEY,
        ExtraArgs={'ContentType': 'application/gzip'},
        Callback=callback
    )
    callback.close()
    
    # Verify upload
    response = s3.head_object(Bucket=BUCKET, Key=TARGZ_KEY)
    uploaded_size = response['ContentLength']
    print(f"   ✅ Upload complete!")
    print(f"   ✅ Verified: {format_size(uploaded_size)}")
    print(f"   ✅ File available at: s3://{BUCKET}/{TARGZ_KEY}")
    
except Exception as e:
    print(f"   ❌ Upload failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ============================================================================
# DONE!
# ============================================================================
print("\n" + "=" * 70)
print("✅ ALL STEPS COMPLETE!")
print("=" * 70)
print(f"\n📦 TAR.GZ uploaded to: s3://{BUCKET}/{TARGZ_KEY}")
print(f"📁 TAR.GZ location: {TAR_LOCAL}")
print("\n💡 Next step: Redeploy SageMaker endpoint")
print("=" * 70)

