#!/usr/bin/env python3
"""
====================================================================
Medarion Fine-Tuned Mistral 7B API Server for Vast.ai
Author: Medarion Systems
====================================================================

✅ Features:
- Fine-tuned Medarion model (augmented with healthcare data)
- Safe & stable model loading
- Automatic dependency installation
- Prevents gibberish text output
- Proper Medarion identity preservation
- Optimized for African healthcare markets
- Runs cleanly on GPU (port 5000)
====================================================================
"""

import os
import sys
import subprocess

# =========================================================
# 0️⃣  Auto-install dependencies if missing
# =========================================================
def install_dependencies():
    """Install required packages if not available"""
    required_packages = {
        'torch': 'torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121',
        'flask': 'flask',
        'transformers': 'transformers accelerate',
        'boto3': 'boto3'
    }
    
    missing = []
    for package, install_cmd in required_packages.items():
        try:
            __import__(package)
        except ImportError:
            missing.append((package, install_cmd))
    
    if missing:
        print("=" * 70)
        print("📦 Installing missing dependencies...")
        print("=" * 70)
        for package, install_cmd in missing:
            print(f"   Installing {package}...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install"] + install_cmd.split())
                print(f"   ✅ {package} installed")
            except subprocess.CalledProcessError as e:
                print(f"   ❌ Failed to install {package}: {e}")
                print("   Please install manually: pip install " + install_cmd)
                sys.exit(1)
        print("=" * 70)
        print("✅ All dependencies installed!")
        print("=" * 70)
        print()

# Install dependencies before importing
install_dependencies()

# Now import the packages
import torch
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM
import tarfile
import shutil

# =========================================================
# 1️⃣  Configuration
# =========================================================
WORKDIR = "/workspace/model_api"
MODEL_DIR = "/workspace/model_api/extracted"  # <-- path to your extracted model
MODEL_NAME = "Medarion-Mistral-7B"  # Fine-tuned Medarion model (augmented with healthcare data)
TAR_FILE = "/workspace/model_api/medarion-final-model.tar.gz"

# S3 Configuration
S3_BUCKET = "medarion7b-model-2025-ue2"
S3_KEY = "medarion-final-model.tar.gz"
S3_REGION = "us-east-2"
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "YOUR_AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "YOUR_AWS_SECRET_ACCESS_KEY")

# Use internal port for Cloudflare tunnel
# Since we're using Cloudflare tunnel, we can use any available port
# Port 5000 is commonly free and works well with tunnels
PORT = 5000  # Internal port (will be accessed via Cloudflare tunnel)

# =========================================================
# 1.5️⃣  Download and Extract Model from S3
# =========================================================
def setup_model_from_s3():
    """Download model from S3 and extract it if not already present"""
    print("=" * 70)
    print("📦 Setting up model from S3...")
    print("=" * 70)
    
    # Create directories
    os.makedirs(WORKDIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)
    print(f"   ✅ Created directories: {WORKDIR}")
    
    # Check if model is already extracted
    tok_path = os.path.join(MODEL_DIR, "tokenizer.json")
    if os.path.exists(tok_path):
        print(f"   ✅ Model already extracted at: {MODEL_DIR}")
        print(f"   Skipping download and extraction...")
        return
    
    # Import boto3 (will be installed if missing)
    try:
        import boto3
    except ImportError:
        print("   Installing boto3...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "boto3"])
        import boto3
    
    # Initialize S3 client
    print("   📡 Connecting to S3...")
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=S3_REGION
        )
        print(f"   ✅ Connected to S3: s3://{S3_BUCKET}/{S3_KEY}")
    except Exception as e:
        print(f"   ❌ S3 connection failed: {e}")
        raise
    
    # Download model if not already downloaded
    if os.path.exists(TAR_FILE):
        size = os.path.getsize(TAR_FILE)
        print(f"   ✅ TAR file already exists: {size / (1024**3):.2f} GB")
    else:
        print(f"   📥 Downloading model from S3 (this may take 10-20 minutes)...")
        try:
            # Get file size for progress
            response = s3.head_object(Bucket=S3_BUCKET, Key=S3_KEY)
            total_size = response['ContentLength']
            print(f"   Size: {total_size / (1024**3):.2f} GB")
            
            # Download with progress
            class ProgressCallback:
                def __init__(self, total_size):
                    self.total_size = total_size
                    self.downloaded = 0
                    self.last_percent = -1
                
                def __call__(self, bytes_amount):
                    self.downloaded += bytes_amount
                    percent = int((self.downloaded / self.total_size) * 100)
                    if percent != self.last_percent and percent % 10 == 0:
                        print(f"   Progress: {percent}% ({self.downloaded / (1024**3):.2f} GB / {self.total_size / (1024**3):.2f} GB)")
                        self.last_percent = percent
            
            callback = ProgressCallback(total_size)
            s3.download_file(S3_BUCKET, S3_KEY, TAR_FILE, Callback=callback)
            print(f"   ✅ Download complete: {TAR_FILE}")
        except Exception as e:
            print(f"   ❌ Download failed: {e}")
            raise
    
    # Extract model
    print(f"   📂 Extracting model (this may take 5-10 minutes)...")
    try:
        with tarfile.open(TAR_FILE, 'r:gz') as tar:
            # Get total members for progress
            members = tar.getmembers()
            total = len(members)
            print(f"   Found {total} files to extract...")
            
            # Extract with progress
            extracted = 0
            for member in members:
                tar.extract(member, MODEL_DIR)
                extracted += 1
                if extracted % 1000 == 0:
                    print(f"   Extracted {extracted}/{total} files...")
            
            print(f"   ✅ Extraction complete: {MODEL_DIR}")
            
            # Verify extraction
            if os.path.exists(tok_path):
                print(f"   ✅ Model verified: tokenizer.json found")
            else:
                print(f"   ⚠️  Warning: tokenizer.json not found after extraction")
    except Exception as e:
        print(f"   ❌ Extraction failed: {e}")
        raise
    
    print("=" * 70)
    print("✅ Model setup complete!")
    print("=" * 70)
    print()

# Setup model before loading
setup_model_from_s3()

# =========================================================
# 2️⃣  Flask setup
# =========================================================
app = Flask(__name__)

# API Security - Support both Vast.ai native API keys and custom keys
# Priority: VAST_API_KEY (Vast.ai native) > VAST_AI_API_KEY (custom) > default
VAST_API_KEY = os.getenv("VAST_API_KEY", "")  # Vast.ai native API key from dashboard
CUSTOM_API_KEY = os.getenv("VAST_AI_API_KEY", "")  # Custom API key (fallback)
API_KEY = VAST_API_KEY if VAST_API_KEY else (CUSTOM_API_KEY if CUSTOM_API_KEY else "medarion-secure-key-2025")
ALLOWED_IPS = os.getenv("VAST_AI_ALLOWED_IPS", "").split(",") if os.getenv("VAST_AI_ALLOWED_IPS") else []

tokenizer = None
model = None

def check_auth():
    """Check API key authentication - supports Vast.ai native keys and custom keys"""
    # Try multiple header formats for compatibility
    api_key = (
        request.headers.get("X-API-Key") or 
        request.headers.get("X-Vast-Api-Key") or
        request.headers.get("Authorization", "").replace("Bearer ", "").replace("ApiKey ", "")
    )
    
    if not api_key:
        return jsonify({"error": "Unauthorized: API key required"}), 401
    
    if api_key != API_KEY:
        return jsonify({"error": "Unauthorized: Invalid API key"}), 401
    
    return None

def check_ip():
    """Optional IP whitelisting"""
    if not ALLOWED_IPS or not any(ip.strip() for ip in ALLOWED_IPS):
        return None  # No IP restriction
    client_ip = request.remote_addr
    if client_ip not in [ip.strip() for ip in ALLOWED_IPS]:
        return jsonify({"error": "Forbidden: IP not allowed"}), 403
    return None


def clean_response(text):
    """
    Clean response to remove trailing gibberish and ensure complete sentences
    """
    if not text:
        return text
    
    # Remove any trailing special tokens or artifacts
    text = text.rstrip()
    
    # Find the last complete sentence (ending with . ! or ?)
    # This helps remove truncated or incomplete text
    last_sentence_end = -1
    for i in range(len(text) - 1, -1, -1):
        if text[i] in '.!?':
            # Check if it's followed by space or end of string (complete sentence)
            if i == len(text) - 1 or text[i + 1] in ' \n\t':
                last_sentence_end = i
                break
    
    # If we found a sentence ending, check what comes after
    if last_sentence_end > 0:
        after_sentence = text[last_sentence_end + 1:].strip()
        
        # If there's significant text after the last sentence, check if it's valid
        if len(after_sentence) > 0:
            # Check if it looks like valid continuation (has spaces, letters)
            has_valid_text = any(c.isalnum() for c in after_sentence) and ' ' in after_sentence[:20]
            
            # If it doesn't look valid, or if it's mostly punctuation/special chars, truncate
            if not has_valid_text:
                # Count non-punctuation characters
                non_punct = sum(1 for c in after_sentence if c.isalnum() or c.isspace())
                if non_punct < len(after_sentence) * 0.3:  # Less than 30% valid text
                    text = text[:last_sentence_end + 1].strip()
    
    # Remove trailing punctuation artifacts (multiple punctuation in a row)
    while len(text) > 1 and text[-1] in '.,!?;:' and text[-2] in '.,!?;:':
        text = text[:-1].rstrip()
    
    # Remove trailing special characters that might be artifacts
    text = text.rstrip('.,!?;:()[]{}\'"`-–—')
    
    # Remove any trailing whitespace
    text = text.rstrip()
    
    # Remove any incomplete words at the end (words cut off mid-way)
    # Find last space and check if last "word" looks incomplete
    if text:
        last_space = text.rfind(' ')
        if last_space > 0:
            last_word = text[last_space + 1:].strip()
            
            # If last word doesn't end with punctuation and is suspicious
            if last_word and not any(last_word.endswith(p) for p in ['.', '!', '?', ',', ';', ':']):
                # Check if it looks like an incomplete word (no vowels, very short, or ends with hyphen)
                has_vowels = any(c.lower() in 'aeiou' for c in last_word)
                is_very_short = len(last_word) <= 2
                ends_with_hyphen = last_word.endswith('-')
                
                # If word looks incomplete and we have a sentence ending before it, truncate there
                if (ends_with_hyphen or (is_very_short and not has_vowels)) and last_sentence_end > 0:
                    # Check if there's a complete sentence before this
                    text_before_last_word = text[:last_space].strip()
                    if text_before_last_word and any(text_before_last_word.endswith(p) for p in ['.', '!', '?']):
                        # Keep only up to the last complete sentence
                        text = text[:last_sentence_end + 1].strip()
    
    # Final check: if response ends mid-sentence (no punctuation in last 100 chars), 
    # try to find last complete sentence and truncate there
    # BUT: Only truncate if there's clear evidence of truncation (very short last segment)
    if len(text) > 100:
        last_100 = text[-100:]
        # Only truncate if last 100 chars have no sentence-ending punctuation AND
        # the last segment is suspiciously short (likely cut off)
        if not any(c in last_100 for c in '.!?'):
            # Look for last sentence ending in the full text (but only if last segment is very short)
            last_space = text.rfind(' ')
            if last_space > 0 and (len(text) - last_space) < 10:  # Last word is very short
                for i in range(len(text) - 1, max(0, len(text) - 500), -1):  # Check last 500 chars
                    if text[i] in '.!?':
                        # Check if followed by space or end
                        if i == len(text) - 1 or text[i + 1] in ' \n\t':
                            # Only truncate if we're very close to the end (likely cut off)
                            if (len(text) - i) < 50:  # Less than 50 chars after sentence
                                text = text[:i + 1].strip()
                                break
    
    return text


# =========================================================
# 3️⃣  Load model (same approach as working diagnostic)
# =========================================================
print("====================================================================")
print(f"🚀 Starting {MODEL_NAME} API Server on Vast.ai")
print("====================================================================")

# Verify model folder
if not os.path.exists(MODEL_DIR):
    raise FileNotFoundError(f"❌ Model folder not found at: {MODEL_DIR}")

# Check tokenizer files
tok_path = os.path.join(MODEL_DIR, "tokenizer.json")
if not os.path.exists(tok_path):
    raise FileNotFoundError(f"❌ Missing tokenizer.json in {MODEL_DIR}")

print("🔍 Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, trust_remote_code=False)

if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

print("🔍 Loading model weights (this may take a while)...")
print("   Using exact same approach that worked in diagnostics...")

try:
    # Use exact same parameters as working inference.py from reference
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_DIR,
        torch_dtype=torch.float16 if device.type == "cuda" else torch.float32,
        device_map="auto" if device.type == "cuda" else None,
        trust_remote_code=False,
        low_cpu_mem_usage=True
    )
    
    # Move to device if not using device_map
    if device.type == "cpu" or model.device.type == "cpu":
        model = model.to(device)
    
    model.eval()
    print("✅ Model loaded successfully!")
    print(f"   Model device: {next(model.parameters()).device}")
    print(f"   Model dtype: {next(model.parameters()).dtype}")
    print("====================================================================")
except Exception as e:
    print(f"❌ Model load failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)


# =========================================================
# 4️⃣  API Routes
# =========================================================

@app.route("/health", methods=["GET"])
def health_check():
    # Health check is public (no auth required) for monitoring and connectivity testing
    # Verify model is actually loaded
    if model is None or tokenizer is None:
        return jsonify({
            "status": "error",
            "model": MODEL_NAME,
            "error": "Model not loaded"
        }), 503
    
    # Check if model is on GPU/CPU
    try:
        device = str(next(model.parameters()).device)
        return jsonify({
            "status": "ok",
            "model": MODEL_NAME,
            "device": device,
            "inference_ready": True
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "model": MODEL_NAME,
            "error": str(e)
        }), 503


@app.route("/generate", methods=["POST"])
def generate_text():
    """
    Input JSON:
    {
        "prompt": "Hello world",
        "max_new_tokens": 100,
        "temperature": 0.7
    }
    """
    try:
        data = request.get_json(force=True)
        prompt = data.get("prompt", "").strip()

        if not prompt:
            return jsonify({"error": "Missing 'prompt'"}), 400

        # Use higher max_tokens for complete responses (no truncation)
        max_new_tokens = int(data.get("max_new_tokens", 1024))
        temperature = float(data.get("temperature", 0.7))

        # Tokenize
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,  # Stop at EOS token
                repetition_penalty=1.15,  # Prevent repetition
                no_repeat_ngram_size=3,  # Prevent 3-gram repetition
            )

        # Decode full output
        full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the generated part (remove the prompt)
        if full_text.startswith(prompt):
            response = full_text[len(prompt):].strip()
        else:
            # If prompt not at start, extract only generated tokens
            input_len = inputs["input_ids"].shape[1]
            gen_tokens = outputs[0][input_len:]
            response = tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()
        
        # Clean up trailing gibberish and ensure complete response
        response = clean_response(response)
        
        return jsonify({
            "prompt": prompt,
            "response": response
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/ping", methods=["GET"])
def ping():
    # Ping is public (no auth required) for connectivity testing
    return "pong", 200


@app.route("/chat", methods=["POST"])
def chat():
    """
    OpenAI-compatible chat endpoint
    Input JSON:
    {
        "messages": [
            {"role": "user", "content": "Hello"}
        ]
    }
    """
    # Check authentication (optional - can be disabled for testing)
    # auth_error = check_auth()
    # if auth_error:
    #     return auth_error
    
    try:
        data = request.get_json(force=True)
        messages = data.get("messages", [])
        
        if not messages:
            return jsonify({"error": "Missing 'messages'"}), 400
        
        # Add system message to establish Medarion's identity and purpose
        # This ensures the fine-tuned model knows who it is and what it does
        has_system = any(msg.get("role") == "system" for msg in messages)
        if not has_system:
            system_message = {
                "role": "system",
                "content": "You are Medarion, an AI assistant specialized in African healthcare market intelligence. You provide insights on healthcare companies, investors, deals, grants, clinical trials, and regulatory information across Africa. You are knowledgeable about market trends, investment patterns, and healthcare innovation in African markets. Always identify yourself as Medarion when asked about your identity."
            }
            messages = [system_message] + messages
            print("[API] Added system message for Medarion identity")
        
        # Use chat template if available (matching working inference.py)
        if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template:
            try:
                prompt = tokenizer.apply_chat_template(
                    messages,
                    tokenize=False,
                    add_generation_prompt=True
                )
                print("[API] Used chat template for formatting")
            except Exception as e:
                print(f"[API] Chat template failed: {e}, using fallback")
                # Fallback formatting (matching inference.py)
                formatted = []
                for msg in messages:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "system":
                        formatted.append(f"System: {content}")
                    elif role == "user":
                        formatted.append(f"User: {content}")
                    elif role == "assistant":
                        formatted.append(f"Assistant: {content}")
                    else:
                        formatted.append(f"{role.capitalize()}: {content}")
                formatted.append("Assistant:")
                prompt = "\n".join(formatted)
        else:
            # Fallback: format manually (matching inference.py)
            formatted = []
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "system":
                    formatted.append(f"System: {content}")
                elif role == "user":
                    formatted.append(f"User: {content}")
                elif role == "assistant":
                    formatted.append(f"Assistant: {content}")
                else:
                    formatted.append(f"{role.capitalize()}: {content}")
            formatted.append("Assistant:")
            prompt = "\n".join(formatted)
        
        # Tokenize (matching inference.py - with truncation and max_length)
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=32768  # Mistral max context
        ).to(model.device)
        
        input_token_count = inputs["input_ids"].shape[1]
        print(f"[API] Input tokens: {input_token_count}")
        
        # Generation parameters (matching working inference.py)
        max_new_tokens = int(data.get("max_tokens", data.get("max_new_tokens", 4000)))
        temperature = float(data.get("temperature", 0.7))
        top_p = float(data.get("top_p", 1.0))
        repetition_penalty = float(data.get("repetition_penalty", 1.1))
        
        print(f"[API] Generating with temperature={temperature}, max_tokens={max_new_tokens}, top_p={top_p}, repetition_penalty={repetition_penalty}")
        
        # Generate (matching working inference.py parameters)
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature if temperature > 0 else None,
                top_p=top_p if top_p < 1.0 else None,
                do_sample=temperature > 0,
                pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                repetition_penalty=repetition_penalty
            )
        
        # Extract only generated tokens (matching inference.py)
        generated_tokens = outputs[0][input_token_count:]
        response = tokenizer.decode(
            generated_tokens,
            skip_special_tokens=True
        ).strip()
        
        completion_token_count = len(generated_tokens)
        print(f"[API] Generated {completion_token_count} tokens")
        
        # Remove chat template artifacts
        if "[/INST]" in response:
            response = response.split("[/INST]")[-1].strip()
        if "<|assistant|>" in response:
            response = response.split("<|assistant|>")[-1].strip()
        response = response.replace("</s>", "").replace("<s>", "").strip()
        
        # Stop at training data patterns, JavaScript code, and footer/boilerplate text BEFORE cleaning
        # This prevents the model from outputting training format, JavaScript, or footer text
        stop_patterns = [
            r'###\s*Instruction\s*:',
            r'###\s*Response\s*:',
            r'###\s*Institution\s*:',
            r'###\s*Example\s*:',
            r'###\s*Training\s*:',
            r'###\s*Data\s*:',
            r'\(function\s*\(',
            r'function\s*\(w,\s*d,\s*s',
            r'w\[l\]\s*=\s*w\[p\]',
            r'getElementsByTagName',
            r'\.push\(arguments\)',
            # Footer/boilerplate patterns (training data artifacts)
            r'\|\s*Medarion\s+AI\s+Health\s+Assistant\s*\|',
            r'\|\s*Powered\s+by\s+Medarion',
            r'\|\s*Visit\s+www\.medarion\.com',
            r'\|\s*©\s+\d{4}\s+Medarion',
            r'\|\s*Terms\s+of\s+Use\s+&\s+Privacy\s+Policy',
            r'\|\s*Contact\s+us:',
            r'\|\s*Report\s+abuse:',
            r'\|\s*Disclaimer:',
            r'\|\s*Follow\s+us\s+on\s+social\s+media',
            r'\|\s*Subscribe\s+to\s+our\s+newsletter',
        ]
        
        import re
        earliest_stop = None
        earliest_index = len(response)
        
        for pattern in stop_patterns:
            match = re.search(pattern, response, re.IGNORECASE)
            if match and match.start() < earliest_index:
                earliest_index = match.start()
                earliest_stop = match
        
        # If we found a stop pattern, extract only the valid part before it
        if earliest_stop and earliest_index > 10:
            before_stop = response[:earliest_index]
            # Find last complete sentence
            last_sentence_end = max(
                before_stop.rfind('.'),
                before_stop.rfind('!'),
                before_stop.rfind('?')
            )
            if last_sentence_end > 0:
                response = before_stop[:last_sentence_end + 1].strip()
            else:
                response = before_stop.strip()
            print(f"[API] Stopped at pattern, extracted {len(response)} chars")
        
        # Log raw response before any cleaning
        print(f"[API] Raw generated response (before cleaning): {len(response)} chars")
        print(f"[API] Raw response preview: {response[:200]}")
        
        # Clean up trailing gibberish and incomplete text (gentle cleaning)
        # Trust the fine-tuned Medarion model output - only remove actual garbage
        response_before_clean = response
        response = clean_response(response)
        print(f"[API] After clean_response(): {len(response)} chars")
        
        # Final validation: Ensure response is not empty and has valid content
        if not response or len(response.strip()) < 3:
            response = "I apologize, but I couldn't generate a proper response. Please try again."
            print("[API] Warning: Empty or too short response, using fallback")
        
        # Additional validation: Reject responses that are mostly punctuation/special chars
        if response and len(response.strip()) > 0:
            import re
            valid_chars = len(re.findall(r'[a-zA-Z0-9]', response))
            total_chars = len(response)
            if total_chars > 0:
                valid_percent = (valid_chars / total_chars) * 100
                print(f"[API] Validation: {valid_chars}/{total_chars} valid chars = {valid_percent:.1f}%")
                if valid_percent < 30:  # Less than 30% valid characters
                    print(f"[API] Warning: Response is mostly gibberish ({valid_percent:.1f}% valid), rejecting")
                    print(f"[API] Rejected response content: {response[:200]}")
                    response = "I apologize, but I couldn't generate a proper response. Please try again."
                    print(f"[API] Using fallback message: {response}")
        
        # Log response length for monitoring (fine-tuned model should produce good responses)
        print(f"[API] Generated response: {len(response)} chars (fine-tuned Medarion model)")
        
        # Return OpenAI-compatible format with usage stats (matching inference.py)
        return jsonify({
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": input_token_count,
                "completion_tokens": completion_token_count,
                "total_tokens": input_token_count + completion_token_count
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================================
# 5️⃣  Main Entrypoint
# =========================================================
if __name__ == "__main__":
    try:
        # Model is already loaded at module level (same as diagnostic script)
        print(f"🌐 API available at: http://0.0.0.0:{PORT}")
        print("📡 Endpoints:")
        print("   GET  /health")
        print("   GET  /ping")
        print("   POST /generate")
        print("   POST /chat")
        print("====================================================================")

        app.run(host="0.0.0.0", port=PORT, debug=False)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped manually.")
    except Exception as err:
        print(f"💥 Fatal error: {err}")
