#!/usr/bin/env python3
"""
Upload inference.py to S3
Simple, direct script - uploads optimized_inference.py as inference.py
"""
import boto3
import os

# ============================================================================
# CONFIGURATION
# ============================================================================
AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID'
AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY'
AWS_REGION = 'us-east-2'
BUCKET = "medarion7b-model-2025-ue2"

# Uploads optimized_inference.py to S3 as "inference.py"
S3_KEY = "inference.py"
LOCAL_FILE = r"C:\xampp\htdocs\medarion\optimized_inference.py"

# ============================================================================

print("=" * 70)
print("📤 UPLOAD inference.py TO S3")
print("=" * 70)
print(f"📁 Local: {LOCAL_FILE}")
print(f"☁️  S3: s3://{BUCKET}/{S3_KEY}")
print("=" * 70)

# Check if file exists
if not os.path.exists(LOCAL_FILE):
    print(f"\n❌ File not found: {LOCAL_FILE}")
    exit(1)

# Initialize S3
s3 = boto3.client('s3', 
                  region_name=AWS_REGION,
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

# Upload
print(f"\n📤 Uploading...")
try:
    s3.upload_file(LOCAL_FILE, BUCKET, S3_KEY,
                   ExtraArgs={'ContentType': 'text/plain'})
    print(f"   ✅ Upload complete!")
    
    # Verify
    response = s3.head_object(Bucket=BUCKET, Key=S3_KEY)
    size_kb = response['ContentLength'] / 1024
    print(f"   ✅ Verified: {size_kb:.2f} KB")
    
    print("\n" + "=" * 70)
    print("✅ inference.py uploaded to S3")
    print("=" * 70)
    
except Exception as e:
    print(f"\n❌ Upload failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

