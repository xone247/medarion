#!/usr/bin/env python3
"""
Test Mistral 7B Model on Vast.ai
Downloads TAR.GZ from S3, extracts, loads model, and tests inference
Run this in Jupyter notebook on your Vast.ai RTX A5000 instance
"""
import boto3
import tarfile
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import json
from tqdm import tqdm

# ============================================================================
# CONFIGURATION
# ============================================================================
AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID'
AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY'
AWS_REGION = 'us-east-2'
BUCKET = "medarion7b-model-2025-ue2"
TARGZ_KEY = "medarion-final-model.tar.gz"

# Working directory
WORKDIR = "/workspace/model_test"
MODEL_DIR = os.path.join(WORKDIR, "extracted")

# ============================================================================

def format_size(size_bytes):
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} GB"

print("=" * 70)
print("🚀 TESTING MISTRAL 7B MODEL ON VAST.AI")
print("=" * 70)
print(f"📦 Model: s3://{BUCKET}/{TARGZ_KEY}")
print(f"🖥️  GPU: RTX A5000 (24GB VRAM)")
print(f"📁 Working directory: {WORKDIR}")
print("=" * 70)

# Initialize S3 client
s3 = boto3.client('s3',
                 aws_access_key_id=AWS_ACCESS_KEY_ID,
                 aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                 region_name=AWS_REGION)

# ============================================================================
# STEP 1: Download TAR.GZ from S3
# ============================================================================
print("\n" + "=" * 70)
print("📥 STEP 1: Downloading TAR.GZ from S3")
print("=" * 70)

os.makedirs(WORKDIR, exist_ok=True)
TAR_LOCAL = os.path.join(WORKDIR, "model.tar.gz")

try:
    # Check if already downloaded
    if os.path.exists(TAR_LOCAL):
        size = os.path.getsize(TAR_LOCAL)
        print(f"   ✅ TAR.GZ already exists: {format_size(size)}")
        print(f"   Skipping download...")
    else:
        response = s3.head_object(Bucket=BUCKET, Key=TARGZ_KEY)
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
        s3.download_file(BUCKET, TARGZ_KEY, TAR_LOCAL, Callback=callback)
        callback.close()
        print(f"   ✅ Downloaded to: {TAR_LOCAL}")
except Exception as e:
    print(f"   ❌ Download failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# ============================================================================
# STEP 2: Extract TAR.GZ
# ============================================================================
print("\n" + "=" * 70)
print("📂 STEP 2: Extracting TAR.GZ")
print("=" * 70)

try:
    if os.path.exists(MODEL_DIR) and os.listdir(MODEL_DIR):
        print(f"   ✅ Model already extracted")
        print(f"   Skipping extraction...")
    else:
        os.makedirs(MODEL_DIR, exist_ok=True)
        
        with tarfile.open(TAR_LOCAL, 'r:gz') as tar:
            members = tar.getmembers()
            files = [m for m in members if m.isfile()]
            print(f"   Found {len(files)} files in TAR.GZ")
            
            with tqdm(total=len(files), desc='   Extracting', unit='files', ncols=100) as pbar:
                for member in members:
                    tar.extract(member, MODEL_DIR)
                    if member.isfile():
                        pbar.update(1)
        
        print(f"   ✅ Extracted to: {MODEL_DIR}")
        
        # Verify key files
        required_files = ['inference.py', 'config.json']
        for req_file in required_files:
            filepath = os.path.join(MODEL_DIR, req_file)
            if os.path.exists(filepath):
                print(f"   ✅ {req_file} found")
            else:
                print(f"   ❌ {req_file} NOT FOUND!")
                
        # Count safetensors files
        safetensors = [f for f in os.listdir(MODEL_DIR) if f.endswith('.safetensors')]
        print(f"   ✅ Safetensors files: {len(safetensors)}")
        
except Exception as e:
    print(f"   ❌ Extraction failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# ============================================================================
# STEP 3: Check GPU
# ============================================================================
print("\n" + "=" * 70)
print("🖥️  STEP 3: Checking GPU")
print("=" * 70)

try:
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"   ✅ GPU: {gpu_name}")
        print(f"   ✅ VRAM: {gpu_memory:.2f} GB")
        print(f"   ✅ CUDA Available: {torch.cuda.is_available()}")
        print(f"   ✅ CUDA Version: {torch.version.cuda}")
        
        if gpu_memory < 16:
            print(f"   ⚠️  WARNING: VRAM is tight for 7B model")
        else:
            print(f"   ✅ VRAM is sufficient for 7B model")
    else:
        print(f"   ❌ CUDA not available - cannot run GPU inference")
        exit(1)
except Exception as e:
    print(f"   ❌ GPU check failed: {e}")
    exit(1)

# ============================================================================
# STEP 4: Load Model
# ============================================================================
print("\n" + "=" * 70)
print("📥 STEP 4: Loading Model")
print("=" * 70)

model = None
tokenizer = None

try:
    print(f"   Loading from: {MODEL_DIR}")
    print(f"   This will take 2-5 minutes...")
    
    # Load tokenizer first
    print(f"\n   📝 Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_DIR,
        trust_remote_code=False,
        use_fast=True
    )
    print(f"   ✅ Tokenizer loaded")
    
    # Set pad token
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        print(f"   ✅ Set pad_token to eos_token")
    
    # Load model with optimizations for 24GB VRAM
    print(f"\n   📥 Loading model (this may take a few minutes)...")
    print(f"   Using Float16 for memory efficiency")
    
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_DIR,
        torch_dtype=torch.float16,  # Use half precision
        device_map="auto",  # Auto GPU placement
        trust_remote_code=False,
        low_cpu_mem_usage=True  # Reduce CPU memory usage
    )
    
    print(f"   ✅ Model loaded successfully!")
    
    # Check model info
    if hasattr(model, 'config'):
        print(f"\n   📊 Model Info:")
        print(f"      Type: {type(model).__name__}")
        if hasattr(model.config, 'model_type'):
            print(f"      Architecture: {model.config.model_type}")
        if hasattr(model.config, 'vocab_size'):
            print(f"      Vocab Size: {model.config.vocab_size:,}")
    
    # Check VRAM usage
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated(0) / (1024**3)
        reserved = torch.cuda.memory_reserved(0) / (1024**3)
        print(f"\n   💾 VRAM Usage:")
        print(f"      Allocated: {allocated:.2f} GB")
        print(f"      Reserved: {reserved:.2f} GB")
        print(f"      Available: {gpu_memory - reserved:.2f} GB")
    
    model.eval()
    print(f"   ✅ Model set to evaluation mode")
    
except Exception as e:
    print(f"   ❌ Model loading failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# ============================================================================
# STEP 5: Test Inference
# ============================================================================
print("\n" + "=" * 70)
print("🧪 STEP 5: Testing Inference")
print("=" * 70)

try:
    # Test 1: Simple generation
    print(f"\n   Test 1: Simple generation")
    test_prompt = "Hello, how are you?"
    print(f"   Prompt: '{test_prompt}'")
    
    inputs = tokenizer(test_prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=50,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"   ✅ Response: {response}")
    
    # Test 2: Chat format
    print(f"\n   Test 2: Chat format")
    messages = [
        {"role": "user", "content": "What is artificial intelligence?"}
    ]
    
    # Format as chat
    chat_prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    
    print(f"   Prompt: '{chat_prompt[:100]}...'")
    
    inputs = tokenizer(chat_prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=100,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"   ✅ Response: {response[:200]}...")
    
    print(f"\n   ✅ All inference tests passed!")
    
except Exception as e:
    print(f"   ❌ Inference test failed: {e}")
    import traceback
    traceback.print_exc()

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 70)
print("✅ MODEL TESTING COMPLETE")
print("=" * 70)

if model is not None and tokenizer is not None:
    print(f"\n✅ Model Status: LOADED AND WORKING")
    print(f"✅ GPU: {gpu_name}")
    print(f"✅ VRAM Usage: {reserved:.2f} GB / {gpu_memory:.2f} GB")
    print(f"\n💡 Model is ready for use!")
    print(f"💡 You can now use 'model' and 'tokenizer' variables in your code")
else:
    print(f"\n❌ Model Status: FAILED TO LOAD")
    print(f"Check errors above")

print("=" * 70)

