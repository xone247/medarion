#!/usr/bin/env python3
"""
Simple Mistral 7B Medarion Training Script
==========================================

Just copy and paste this entire code into your Kaggle notebook!
"""

# Install packages
!pip install transformers torch accelerate datasets

import torch
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import Dataset

# Configuration - UPDATE YOUR DATASET NAME HERE
MODEL_NAME = "mistralai/Mistral-7B-v0.1"
DATASET_PATH = "/kaggle/input/xone-finetuning-data"  # Your dataset name
OUTPUT_DIR = "/kaggle/working/medarion-mistral-7b"

print("🚀 Starting Medarion Training...")

# Load model and tokenizer
print("📥 Loading Mistral 7B model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, torch_dtype=torch.float16, device_map="auto")
tokenizer.pad_token = tokenizer.eos_token

# Load training data
def load_data(file_path):
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            data.append(json.loads(line))
    return data

print("📊 Loading training data...")
train_data = load_data(f"{DATASET_PATH}/train.jsonl")
val_data = load_data(f"{DATASET_PATH}/validation.jsonl")
print(f"✅ Loaded {len(train_data)} training records")
print(f"✅ Loaded {len(val_data)} validation records")

# Format data
def format_instruction(example):
    if example["input"]:
        text = f"### Instruction:\\n{example['instruction']}\\n\\n### Input:\\n{example['input']}\\n\\n### Response:\\n{example['output']}"
    else:
        text = f"### Instruction:\\n{example['instruction']}\\n\\n### Response:\\n{example['output']}"
    return {"text": text}

# Create datasets
train_dataset = Dataset.from_list(train_data).map(format_instruction)
val_dataset = Dataset.from_list(val_data).map(format_instruction)

# Tokenize
def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True, padding=True, max_length=2048, return_tensors="pt")

train_dataset = train_dataset.map(tokenize_function, batched=True)
val_dataset = val_dataset.map(tokenize_function, batched=True)

# Training setup
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=1,
    per_device_eval_batch_size=1,
    gradient_accumulation_steps=4,
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

# Start training
print("🎯 Starting Medarion fine-tuning...")
print("⏰ This will take 6-8 hours...")
trainer.train()

# Save model
print("💾 Saving Medarion model...")
trainer.save_model()
tokenizer.save_pretrained(OUTPUT_DIR)

# Test Medarion
def test_medarion():
    test_prompt = "### Instruction:\\nWhat is your name and what do you do?\\n\\n### Response:\\n"
    inputs = tokenizer(test_prompt, return_tensors="pt")
    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=200, temperature=0.7, do_sample=True, pad_token_id=tokenizer.eos_token_id)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print("🤖 Medarion Response:")
    print(response)

print("🧪 Testing Medarion identity...")
test_medarion()

print("🎉 Medarion training complete!")
print(f"📁 Model saved to: {OUTPUT_DIR}")
print("✅ Your Medarion AI is ready!")
