#!/usr/bin/env python3
"""
Deploy Mistral 7B Model API on Vast.ai
Downloads TAR.GZ from S3, loads model, creates API endpoint
Run this in Jupyter notebook on your Vast.ai RTX A5000 instance
"""
import boto3
import tarfile
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import json
from tqdm import tqdm
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time

# ============================================================================
# CONFIGURATION
# ============================================================================
AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID'
AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY'
AWS_REGION = 'us-east-2'
BUCKET = "medarion7b-model-2025-ue2"
TARGZ_KEY = "medarion-final-model.tar.gz"

# Working directory
WORKDIR = "/workspace/model_api"
MODEL_DIR = os.path.join(WORKDIR, "extracted")

# API Configuration
API_HOST = "0.0.0.0"  # Listen on all interfaces
API_PORT = 8080

# ============================================================================

def format_size(size_bytes):
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} GB"

print("=" * 70)
print("🚀 DEPLOYING MISTRAL 7B API ON VAST.AI")
print("=" * 70)
print(f"📦 Model: s3://{BUCKET}/{TARGZ_KEY}")
print(f"🖥️  GPU: RTX A5000 (24GB VRAM)")
print(f"🌐 API: http://{API_HOST}:{API_PORT}")
print("=" * 70)

# Initialize S3 client
s3 = boto3.client('s3',
                 aws_access_key_id=AWS_ACCESS_KEY_ID,
                 aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                 region_name=AWS_REGION)

# ============================================================================
# STEP 1: Download TAR.GZ from S3
# ============================================================================
print("\n📥 STEP 1: Downloading TAR.GZ from S3")
print("-" * 70)

os.makedirs(WORKDIR, exist_ok=True)
TAR_LOCAL = os.path.join(WORKDIR, "model.tar.gz")

try:
    if os.path.exists(TAR_LOCAL):
        size = os.path.getsize(TAR_LOCAL)
        print(f"   ✅ TAR.GZ already exists: {format_size(size)}")
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
        print(f"   ✅ Downloaded")
except Exception as e:
    print(f"   ❌ Download failed: {e}")
    exit(1)

# ============================================================================
# STEP 2: Extract TAR.GZ
# ============================================================================
print("\n📂 STEP 2: Extracting TAR.GZ")
print("-" * 70)

try:
    if os.path.exists(MODEL_DIR) and os.listdir(MODEL_DIR):
        print(f"   ✅ Model already extracted")
    else:
        os.makedirs(MODEL_DIR, exist_ok=True)
        with tarfile.open(TAR_LOCAL, 'r:gz') as tar:
            members = tar.getmembers()
            files = [m for m in members if m.isfile()]
            print(f"   Found {len(files)} files")
            
            with tqdm(total=len(files), desc='   Extracting', unit='files', ncols=100) as pbar:
                for member in members:
                    tar.extract(member, MODEL_DIR)
                    if member.isfile():
                        pbar.update(1)
        print(f"   ✅ Extracted")
except Exception as e:
    print(f"   ❌ Extraction failed: {e}")
    exit(1)

# ============================================================================
# STEP 3: Check GPU
# ============================================================================
print("\n🖥️  STEP 3: Checking GPU")
print("-" * 70)

if not torch.cuda.is_available():
    print(f"   ❌ CUDA not available")
    exit(1)

gpu_name = torch.cuda.get_device_name(0)
gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
print(f"   ✅ GPU: {gpu_name}")
print(f"   ✅ VRAM: {gpu_memory:.2f} GB")

# ============================================================================
# STEP 4: Load Model
# ============================================================================
print("\n📥 STEP 4: Loading Model")
print("-" * 70)

print(f"   Loading from: {MODEL_DIR}")
print(f"   This will take 2-5 minutes...")

# Load tokenizer
print(f"   Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_DIR,
    trust_remote_code=False,
    use_fast=True
)

if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# Load model
print(f"   Loading model (Float16, device_map='auto')...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_DIR,
    torch_dtype=torch.float16,
    device_map="auto",
    trust_remote_code=False,
    low_cpu_mem_usage=True
)

model.eval()
print(f"   ✅ Model loaded!")

# Check VRAM
allocated = torch.cuda.memory_allocated(0) / (1024**3)
reserved = torch.cuda.memory_reserved(0) / (1024**3)
print(f"   💾 VRAM: {reserved:.2f} GB / {gpu_memory:.2f} GB")

# ============================================================================
# STEP 5: Create API Server
# ============================================================================
print("\n🌐 STEP 5: Creating API Server")
print("-" * 70)

app = Flask(__name__)
CORS(app)  # Enable CORS for your application

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "gpu": gpu_name,
        "vram_used": f"{reserved:.2f} GB",
        "vram_total": f"{gpu_memory:.2f} GB"
    })

@app.route('/ping', methods=['GET'])
def ping():
    """Ping endpoint"""
    return jsonify({"message": "pong"})

@app.route('/generate', methods=['POST'])
def generate():
    """Generate text from prompt"""
    try:
        data = request.get_json()
        
        # Support both formats
        if 'messages' in data:
            # Chat format
            messages = data['messages']
            prompt = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
        elif 'prompt' in data:
            # Simple prompt format
            prompt = data['prompt']
        else:
            return jsonify({"error": "Missing 'prompt' or 'messages' in request"}), 400
        
        # Generation parameters
        max_tokens = data.get('max_tokens', 100)
        temperature = data.get('temperature', 0.7)
        top_p = data.get('top_p', 0.9)
        do_sample = data.get('do_sample', True)
        
        # Tokenize
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=do_sample,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode response
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove prompt from response if it's included
        if response_text.startswith(prompt):
            response_text = response_text[len(prompt):].strip()
        
        return jsonify({
            "response": response_text,
            "prompt": prompt,
            "tokens_generated": len(outputs[0]) - len(inputs['input_ids'][0])
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Chat endpoint (OpenAI-compatible format)"""
    try:
        data = request.get_json()
        
        if 'messages' not in data:
            return jsonify({"error": "Missing 'messages' in request"}), 400
        
        messages = data['messages']
        max_tokens = data.get('max_tokens', 100)
        temperature = data.get('temperature', 0.7)
        
        # Format as chat
        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        # Tokenize
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode
        full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract just the assistant's response
        if "<|assistant|>" in full_response:
            response_text = full_response.split("<|assistant|>")[-1].strip()
        else:
            # Fallback: remove prompt
            response_text = full_response[len(prompt):].strip()
        
        return jsonify({
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response_text
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": len(inputs['input_ids'][0]),
                "completion_tokens": len(outputs[0]) - len(inputs['input_ids'][0]),
                "total_tokens": len(outputs[0])
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def run_server():
    """Run Flask server"""
    print(f"\n🚀 Starting API server...")
    print(f"   URL: http://{API_HOST}:{API_PORT}")
    print(f"   Endpoints:")
    print(f"      GET  /health  - Health check")
    print(f"      GET  /ping    - Ping test")
    print(f"      POST /generate - Simple generation")
    print(f"      POST /chat    - OpenAI-compatible chat")
    print(f"\n   ⚠️  Server will run in background")
    print(f"   ⚠️  Keep this notebook running!")
    print(f"\n   📝 To access from your application:")
    print(f"      http://YOUR_VAST_IP:{API_PORT}")
    print(f"      (Get IP from Vast.ai dashboard)")
    print("\n" + "=" * 70)
    
    app.run(host=API_HOST, port=API_PORT, debug=False, threaded=True)

# Start server in background thread
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# Give server time to start
time.sleep(2)

# Test the server
print("\n🧪 Testing API endpoints...")
try:
    import requests
    response = requests.get(f"http://localhost:{API_PORT}/ping", timeout=5)
    if response.status_code == 200:
        print(f"   ✅ API server is running!")
        print(f"   ✅ Ready to accept requests")
    else:
        print(f"   ⚠️  Server responded with status: {response.status_code}")
except Exception as e:
    print(f"   ⚠️  Could not test server: {e}")
    print(f"   Server may still be starting...")

print("\n" + "=" * 70)
print("✅ API DEPLOYMENT COMPLETE")
print("=" * 70)
print(f"\n🌐 API Endpoints:")
print(f"   Health: http://YOUR_VAST_IP:{API_PORT}/health")
print(f"   Generate: http://YOUR_VAST_IP:{API_PORT}/generate")
print(f"   Chat: http://YOUR_VAST_IP:{API_PORT}/chat")
print(f"\n💡 Keep this notebook running to keep the API active!")
print(f"💡 Get your Vast.ai IP from the dashboard")
print("=" * 70)

