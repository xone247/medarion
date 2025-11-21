#!/usr/bin/env python3
"""Diagnose model loading issue"""
import sys
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_DIR = "/workspace/model_api/extracted"

print("=" * 70)
print("DIAGNOSTIC TEST")
print("=" * 70)
print(f"Python: {sys.executable}")
print(f"Torch: {torch.__version__}")
print(f"Model dir: {MODEL_DIR}")
print(f"Model dir exists: {os.path.exists(MODEL_DIR)}")
print()

# Check config
import json
config_path = os.path.join(MODEL_DIR, "config.json")
if os.path.exists(config_path):
    with open(config_path) as f:
        config = json.load(f)
    print(f"Model type: {config.get('model_type')}")
    print(f"Architectures: {config.get('architectures')}")
    print()

# Test 1: Without trust_remote_code
print("Test 1: Loading WITHOUT trust_remote_code...")
try:
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_DIR,
        trust_remote_code=False,
        device_map="auto",
        dtype=torch.float16,
        low_cpu_mem_usage=True,
    )
    print("✅ SUCCESS without trust_remote_code!")
    del model
    torch.cuda.empty_cache()
except Exception as e:
    print(f"❌ FAILED: {e}")
    print()

# Test 2: With trust_remote_code
print("\nTest 2: Loading WITH trust_remote_code...")
try:
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_DIR,
        trust_remote_code=True,
        device_map="auto",
        dtype=torch.float16,
        low_cpu_mem_usage=True,
    )
    print("✅ SUCCESS with trust_remote_code!")
except Exception as e:
    print(f"❌ FAILED: {e}")
    import traceback
    traceback.print_exc()

