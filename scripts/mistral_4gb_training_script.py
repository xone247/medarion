#!/usr/bin/env python3
"""
Mistral 7B Instruct v0.2 (4GB) Medarion Training Script
======================================================

This version uses the 4GB Mistral model - faster and more efficient for your platform!
"""

# Install packages
print("📦 Installing required packages...")
!pip install transformers torch accelerate datasets
print("✅ Packages installed!")

import torch
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import Dataset

# Configuration - Using 4GB Mistral model
MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"  # 4GB version
DATASET_PATH = "/kaggle/input/xone-finetuning-data"
OUTPUT_DIR = "/kaggle/working/medarion-mistral-4gb"

print("🚀 Starting Medarion Training with 4GB Mistral...")
print(f"📁 Dataset path: {DATASET_PATH}")
print(f"📁 Output path: {OUTPUT_DIR}")

# Load model and tokenizer
print("📥 Loading Mistral 7B Instruct v0.2 (4GB model)...")
print("⏳ This will download ~4GB model files...")
print("⏳ Much faster download than 13GB version!")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
print("✅ Tokenizer loaded!")

model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, torch_dtype=torch.float16, device_map="auto")
print("✅ Mistral 7B Instruct v0.2 model loaded!")
print(f"📊 Model size: {model.num_parameters():,} parameters")
print("🎯 This 4GB model is optimized for instruction following!")

tokenizer.pad_token = tokenizer.eos_token
print("✅ Pad token set!")

# Load training data
def load_data(file_path):
    print(f"📂 Loading data from: {file_path}")
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            data.append(json.loads(line))
    return data

print("📊 Loading training data...")
train_data = load_data(f"{DATASET_PATH}/train.jsonl")
print(f"✅ Loaded {len(train_data):,} training records")

print("📊 Loading validation data...")
val_data = load_data(f"{DATASET_PATH}/validation.jsonl")
print(f"✅ Loaded {len(val_data):,} validation records")

# Format data
def format_instruction(example):
    if example["input"]:
        text = f"### Instruction:\\n{example['instruction']}\\n\\n### Input:\\n{example['input']}\\n\\n### Response:\\n{example['output']}"
    else:
        text = f"### Instruction:\\n{example['instruction']}\\n\\n### Response:\\n{example['output']}"
    return {"text": text}

print("🔄 Formatting training data...")
train_dataset = Dataset.from_list(train_data).map(format_instruction)
print("✅ Training data formatted!")

print("🔄 Formatting validation data...")
val_dataset = Dataset.from_list(val_data).map(format_instruction)
print("✅ Validation data formatted!")

# Tokenize
def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True, padding=True, max_length=2048, return_tensors="pt")

print("🔄 Tokenizing training data...")
train_dataset = train_dataset.map(tokenize_function, batched=True)
print("✅ Training data tokenized!")

print("🔄 Tokenizing validation data...")
val_dataset = val_dataset.map(tokenize_function, batched=True)
print("✅ Validation data tokenized!")

# Training setup
print("⚙️ Setting up training configuration...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=2,  # Can use larger batch size with 4GB model
    per_device_eval_batch_size=2,
    gradient_accumulation_steps=2,  # Reduced since batch size is larger
    learning_rate=2e-5,
    warmup_steps=100,
    weight_decay=0.01,
    logging_steps=10,
    evaluation_strategy="steps",
    eval_steps=500,
    save_steps=1000,
    save_total_limit=3,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
    fp16=True,
    dataloader_pin_memory=False,
    remove_unused_columns=False,
)

data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    data_collator=data_collator,
)

print("✅ Training setup complete!")

# Start training
print("🎯 Starting Medarion fine-tuning with 4GB model...")
print("⏰ This will take 4-6 hours (faster than 13GB version)...")
print("📊 You'll see loss values decreasing over time...")
print("🔄 Training 3 epochs on 474,053 records...")

trainer.train()

print("✅ Training complete!")

# Save model
print("💾 Saving Medarion model...")
trainer.save_model()
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"✅ Model saved to: {OUTPUT_DIR}")

# Test Medarion
def test_medarion():
    print("🧪 Testing Medarion identity...")
    test_prompt = "### Instruction:\\nWhat is your name and what do you do?\\n\\n### Response:\\n"
    inputs = tokenizer(test_prompt, return_tensors="pt")
    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=200, temperature=0.7, do_sample=True, pad_token_id=tokenizer.eos_token_id)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print("🤖 Medarion Response:")
    print(response)

test_medarion()

print("🎉 Medarion training complete!")
print("✅ Your 4GB Medarion AI is ready!")
print(f"📁 Download your model from: {OUTPUT_DIR}")
print("🚀 This model will be faster and more efficient for your platform!")
