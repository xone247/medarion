#!/bin/bash
# This creates the run_api_on_vast.py file directly in Jupyter
# Copy the entire content below and paste into Jupyter terminal

cat > /workspace/run_api_on_vast.py << 'ENDOFFILE'
#!/usr/bin/env python3
"""
====================================================================
Mistral 7B Flask API Server for Vast.ai
Author: Medarion Systems
====================================================================

✅ Features:
- Safe & stable model loading
- Automatic dependency check
- Prevents gibberish text output
- Runs cleanly on GPU (port 44050)
====================================================================
"""

import os
import sys
import torch
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM

# =========================================================
# 1️⃣  Flask setup
# =========================================================
app = Flask(__name__)

MODEL_DIR = "/workspace/model_api/extracted"  # <-- path to your extracted model
MODEL_NAME = "Mistral-7B"
# Use public port in allowed range (44033-44939)
# Port 44050 is in the allowed range and should be available
PORT = 44050

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
    
    # Final check: if response ends mid-sentence (no punctuation in last 50 chars), 
    # try to find last complete sentence and truncate there
    if len(text) > 50:
        last_50 = text[-50:]
        # If last 50 chars have no sentence-ending punctuation, find last sentence
        if not any(c in last_50 for c in '.!?'):
            # Look for last sentence ending in the full text
            for i in range(len(text) - 1, max(0, len(text) - 200), -1):
                if text[i] in '.!?':
                    # Check if followed by space or end
                    if i == len(text) - 1 or text[i + 1] in ' \n\t':
                        # Truncate at this sentence
                        text = text[:i + 1].strip()
                        break
    
    return text


# =========================================================
# 2️⃣  Load model (same approach as working diagnostic)
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
    # Use exact same parameters as working diagnostic script
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_DIR,
        trust_remote_code=False,
        device_map="auto",
        dtype=torch.float16,
        low_cpu_mem_usage=True,
    )
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
# 3️⃣  API Routes
# =========================================================

@app.route("/health", methods=["GET"])
def health_check():
    # Health check is public (no auth required) for monitoring and connectivity testing
    return jsonify({"status": "ok", "model": MODEL_NAME}), 200


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
    try:
        data = request.get_json(force=True)
        messages = data.get("messages", [])
        
        if not messages:
            return jsonify({"error": "Missing 'messages'"}), 400
        
        # Use chat template if available
        if hasattr(tokenizer, "apply_chat_template"):
            prompt = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
        else:
            # Fallback: format manually
            prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages]) + "\nassistant:"
        
        # Tokenize
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        # Use higher max_tokens for complete responses (no truncation)
        max_new_tokens = int(data.get("max_tokens", data.get("max_new_tokens", 1024)))
        temperature = float(data.get("temperature", 0.7))
        
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
        
        # Extract only generated tokens
        input_len = inputs["input_ids"].shape[1]
        gen_tokens = outputs[0][input_len:]
        response = tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()
        
        # Remove chat template artifacts
        if "[/INST]" in response:
            response = response.split("[/INST]")[-1].strip()
        if "<|assistant|>" in response:
            response = response.split("<|assistant|>")[-1].strip()
        response = response.replace("</s>", "").replace("<s>", "").strip()
        
        # Stop at training data patterns and JavaScript code BEFORE cleaning
        # This prevents the model from outputting training format or JavaScript
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
        
        # Clean up trailing gibberish and incomplete text (gentle cleaning)
        response = clean_response(response)
        
        return jsonify({
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": response
                }
            }]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================================
# 4️⃣  Main Entrypoint
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
ENDOFFILE

chmod +x /workspace/run_api_on_vast.py
echo "✅ Script created at /workspace/run_api_on_vast.py"

