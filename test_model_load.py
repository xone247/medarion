#!/usr/bin/env python3
"""Test script to diagnose model loading issues"""
import sys
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

print(f"Python: {sys.version}")
print(f"Torch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")

MODEL_DIR = "/workspace/model_api/extracted"

print(f"\n🔍 Loading model from: {MODEL_DIR}")
print("This may take a few minutes...")

try:
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_DIR,
        trust_remote_code=True,
        device_map="auto",
        torch_dtype=torch.float16,
        low_cpu_mem_usage=True,
    )
    print("✅ Model loaded successfully!")
    print(f"Model device: {next(model.parameters()).device}")
    print(f"Model dtype: {next(model.parameters()).dtype}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

