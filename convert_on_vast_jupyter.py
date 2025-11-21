#!/usr/bin/env python3
"""
Run this script directly in Jupyter terminal on Vast.ai
Downloads ZIP, extracts, adds inference.py, creates TAR.GZ, uploads to S3
Copy and paste this entire script into Jupyter terminal and run it
"""
import boto3
import zipfile
import tarfile
import os
import shutil
from tqdm import tqdm

# ============================================================================
# CONFIGURATION
# ============================================================================
AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID'
AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY'
AWS_REGION = 'us-east-2'
BUCKET = "medarion7b-model-2025-ue2"

# S3 Keys
ZIP_KEY = "medarion-final-model.zip"
INFERENCE_KEY = "inference.py"
TARGZ_KEY = "medarion-final-model.tar.gz"

# Working directory (100GB available in /workspace)
WORKDIR = "/workspace/model_convert"

# ============================================================================

def format_size(size_bytes):
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} GB"

print("=" * 70)
print("🚀 ZIP TO TAR.GZ CONVERSION ON VAST.AI")
print("=" * 70)
print(f"📦 Source ZIP: s3://{BUCKET}/{ZIP_KEY}")
print(f"📝 Inference: s3://{BUCKET}/{INFERENCE_KEY}")
print(f"📦 Output TAR.GZ: s3://{BUCKET}/{TARGZ_KEY}")
print(f"📁 Working directory: {WORKDIR}")
print("=" * 70)

# Initialize S3 client
s3 = boto3.client('s3', 
                  region_name=AWS_REGION,
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

# Create working directory
os.makedirs(WORKDIR, exist_ok=True)
ZIP_LOCAL = os.path.join(WORKDIR, "source.zip")
EXTRACT_DIR = os.path.join(WORKDIR, "extracted")
TAR_LOCAL = os.path.join(WORKDIR, "output.tar.gz")

# ============================================================================
# STEP 1: Download ZIP from S3
# ============================================================================
print("\n" + "=" * 70)
print("📥 STEP 1: Downloading ZIP from S3")
print("=" * 70)

try:
    response = s3.head_object(Bucket=BUCKET, Key=ZIP_KEY)
    total_size = response['ContentLength']
    print(f"   Size: {format_size(total_size)}")
    
    class ProgressCallback:
        def __init__(self, total_size):
            self.pbar = tqdm(total=total_size, unit='B', unit_scale=True, 
                           desc='   Downloading', ncols=100)
        def __call__(self, bytes_amount):
            self.pbar.update(bytes_amount)
        def close(self):
            self.pbar.close()
    
    callback = ProgressCallback(total_size)
    s3.download_file(BUCKET, ZIP_KEY, ZIP_LOCAL, Callback=callback)
    callback.close()
    print(f"   ✅ Downloaded to: {ZIP_LOCAL}")
except Exception as e:
    print(f"   ❌ Download failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# ============================================================================
# STEP 2: Extract ZIP
# ============================================================================
print("\n" + "=" * 70)
print("📂 STEP 2: Extracting ZIP")
print("=" * 70)

try:
    os.makedirs(EXTRACT_DIR, exist_ok=True)
    
    with zipfile.ZipFile(ZIP_LOCAL, 'r') as zip_ref:
        members = zip_ref.infolist()
        files = [m for m in members if not m.filename.endswith('/')]
        print(f"   Found {len(files)} files in ZIP")
        
        with tqdm(total=len(files), desc='   Extracting', unit='files', ncols=100) as pbar:
            for member in members:
                zip_ref.extract(member, EXTRACT_DIR)
                if not member.filename.endswith('/'):
                    pbar.update(1)
    
    print(f"   ✅ Extracted to: {EXTRACT_DIR}")
except Exception as e:
    print(f"   ❌ Extraction failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# ============================================================================
# STEP 3: Download inference.py from S3
# ============================================================================
print("\n" + "=" * 70)
print("📥 STEP 3: Downloading inference.py from S3")
print("=" * 70)

try:
    inference_local = os.path.join(EXTRACT_DIR, "inference.py")
    
    # Remove old inference.py if exists
    if os.path.exists(inference_local):
        os.remove(inference_local)
        print("   ✅ Removed old inference.py")
    
    s3.download_file(BUCKET, INFERENCE_KEY, inference_local)
    file_size = os.path.getsize(inference_local)
    print(f"   ✅ Downloaded inference.py ({format_size(file_size)})")
except Exception as e:
    print(f"   ❌ Failed to download inference.py: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# ============================================================================
# STEP 4: Verify all 3 safetensors files
# ============================================================================
print("\n" + "=" * 70)
print("🔍 STEP 4: Verifying model files")
print("=" * 70)

try:
    all_files = []
    safetensors_files = []
    
    for root, dirs, filenames in os.walk(EXTRACT_DIR):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            relpath = os.path.relpath(filepath, EXTRACT_DIR)
            all_files.append(relpath)
            
            if 'safetensors' in filename.lower():
                safetensors_files.append((relpath, filepath))
    
    print(f"   Total files: {len(all_files)}")
    print(f"   Safetensors files: {len(safetensors_files)}")
    
    if len(safetensors_files) == 3:
        print("   ✅ All 3 safetensors files found (required for Mistral 7B)")
        for relpath, filepath in sorted(safetensors_files):
            size = os.path.getsize(filepath)
            print(f"      - {relpath} ({format_size(size)})")
    elif len(safetensors_files) > 0:
        print(f"   ❌ ERROR: Found {len(safetensors_files)} safetensors files, expected 3!")
        for relpath, filepath in sorted(safetensors_files):
            print(f"      - {relpath}")
        exit(1)
    else:
        print("   ❌ ERROR: No safetensors files found!")
        exit(1)
    
    # Check inference.py
    if os.path.exists(os.path.join(EXTRACT_DIR, "inference.py")):
        print("   ✅ inference.py is present")
    else:
        print("   ❌ ERROR: inference.py not found!")
        exit(1)
    
    # Check config.json
    if any('config.json' in f for f in all_files):
        print("   ✅ config.json is present")
    else:
        print("   ⚠️  WARNING: config.json not found")
    
    # Check model.safetensors.index.json (REQUIRED for multiple safetensors files)
    index_json_files = [f for f in all_files if 'safetensors.index.json' in f.lower() or 'index.json' in f.lower()]
    if index_json_files:
        print(f"   ✅ model.safetensors.index.json found: {index_json_files[0]}")
        print("      (Required for loading 3 safetensors files)")
    else:
        print("   ⚠️  WARNING: model.safetensors.index.json not found!")
        print("      This file is REQUIRED when using multiple safetensors files")
        print("      The model may not load correctly without it")
        
except Exception as e:
    print(f"   ❌ Verification failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# ============================================================================
# STEP 5: Create TAR.GZ (all files in root level)
# ============================================================================
print("\n" + "=" * 70)
print("📦 STEP 5: Creating TAR.GZ (all files in root level)")
print("=" * 70)

try:
    # Collect all files and flatten to root level
    files_to_archive = []
    for root, dirs, filenames in os.walk(EXTRACT_DIR):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            relpath = os.path.relpath(filepath, EXTRACT_DIR)
            
            # Use just filename for root-level placement
            arcname = os.path.basename(relpath) if '/' in relpath else relpath
            files_to_archive.append((filepath, arcname))
    
    print(f"   Archiving {len(files_to_archive)} files to root level...")
    
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
    exit(1)

# ============================================================================
# STEP 6: Upload TAR.GZ to S3
# ============================================================================
print("\n" + "=" * 70)
print("☁️  STEP 6: Uploading TAR.GZ to S3")
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
    exit(1)

# ============================================================================
# DONE!
# ============================================================================
print("\n" + "=" * 70)
print("✅ ALL STEPS COMPLETE!")
print("=" * 70)
print(f"\n📦 TAR.GZ uploaded to: s3://{BUCKET}/{TARGZ_KEY}")
print(f"📁 Files kept in: {WORKDIR} (for review)")
print("\n💡 Next step: Redeploy SageMaker endpoint")
print("=" * 70)

