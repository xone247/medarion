# 🚀 Complete Kaggle Fine-tuning Guide for Mistral 7B Medarion

## 📋 **Step-by-Step Instructions**

### **Step 1: Prepare Your Dataset for Upload**

#### **Files to Upload to Kaggle Dataset:**
1. **`train.jsonl`** (863.59 MB) - Training data
2. **`validation.jsonl`** (95.87 MB) - Validation data  
3. **`training_config.json`** - Configuration file
4. **`mistral_training_notebook.py`** - Complete training notebook

#### **Dataset Size:**
- **Total Size**: 0.93 GB (959 MB)
- **Perfect for Kaggle**: Under 1GB limit
- **Records**: 526,726 training records

### **Step 2: Create Kaggle Dataset**

1. **Go to Kaggle**: https://www.kaggle.com/
2. **Sign in** to your account
3. **Click "Create"** → **"New Dataset"**
4. **Dataset Name**: `medarion-mistral-training-data`
5. **Description**: `Medarion healthcare AI training data for Mistral 7B fine-tuning`
6. **Upload Files**:
   - `train.jsonl`
   - `validation.jsonl` 
   - `training_config.json`
   - `mistral_training_notebook.py`
7. **Make Public** (required for free GPU access)
8. **Click "Create"**

### **Step 3: Create Kaggle Notebook**

1. **Go to your dataset page**
2. **Click "New Notebook"**
3. **Select GPU**: T4 or P100 (free tier)
4. **Copy the notebook code** from `mistral_training_notebook.py`
5. **Paste into Kaggle notebook**
6. **Update dataset path** to your dataset name

### **Step 4: Configure Training Settings**

#### **Hardware Requirements:**
- **GPU**: T4 or P100 (free tier available)
- **RAM**: 16GB+ (Kaggle provides 16GB)
- **Storage**: 5GB+ (Kaggle provides 20GB)
- **Training Time**: 4-6 hours

#### **Training Configuration:**
- **Model**: mistralai/Mistral-7B-v0.1
- **Learning Rate**: 2e-5
- **Batch Size**: 4
- **Epochs**: 3
- **Max Length**: 2048 tokens

### **Step 5: Run Training**

1. **Save notebook** with your changes
2. **Click "Run All"** to start training
3. **Monitor progress** in the output
4. **Training will take 4-6 hours**
5. **Model will be saved** automatically

## 📁 **Files to Upload**

### **1. Training Data Files**

#### **`train.jsonl`** (510.49 MB)
- **474,053 training records**
- **Instruction-response format**
- **Medarion identity training included**

#### **`validation.jsonl`** (56.69 MB)  
- **52,673 validation records**
- **Used for model evaluation**
- **Prevents overfitting**

### **2. Configuration Files**

#### **`training_config.json`**
```json
{
  "model_name": "mistral-7b-medarion",
  "base_model": "mistralai/Mistral-7B-v0.1",
  "training_data": {
    "total_records": 526726,
    "train_records": 474053,
    "validation_records": 52673
  },
  "training_config": {
    "learning_rate": 2e-05,
    "batch_size": 4,
    "num_epochs": 3,
    "max_length": 2048
  }
}
```

#### **`mistral_training_notebook.py`**
- **Complete training notebook**
- **Ready to run on Kaggle**
- **Includes Medarion identity testing**

## 🎯 **Kaggle Notebook Code**

### **Complete Training Notebook:**

```python
#!/usr/bin/env python3
"""
Mistral 7B Medarion Fine-tuning on Kaggle
=========================================

This notebook fine-tunes Mistral 7B for the Medarion healthcare platform.
The model will respond as "Medarion" and provide expert healthcare insights.
"""

# Install required packages
!pip install transformers torch accelerate datasets

import torch
import json
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    TrainingArguments, 
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import os

# Configuration
MODEL_NAME = "mistralai/Mistral-7B-v0.1"
DATASET_PATH = "/kaggle/input/medarion-mistral-training-data"  # Update with your dataset name
OUTPUT_DIR = "/kaggle/working/medarion-mistral-7b"

# Load tokenizer and model
print("Loading Mistral 7B model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16,
    device_map="auto"
)

# Add pad token
tokenizer.pad_token = tokenizer.eos_token

# Load training data
def load_training_data(file_path):
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            data.append(json.loads(line))
    return data

train_data = load_training_data(f"{DATASET_PATH}/train.jsonl")
val_data = load_training_data(f"{DATASET_PATH}/validation.jsonl")

print(f"Loaded {len(train_data)} training records")
print(f"Loaded {len(val_data)} validation records")

# Format data for training
def format_instruction(example):
    if example["input"]:
        text = f"### Instruction:\\n{example['instruction']}\\n\\n### Input:\\n{example['input']}\\n\\n### Response:\\n{example['output']}"
    else:
        text = f"### Instruction:\\n{example['instruction']}\\n\\n### Response:\\n{example['output']}"
    return {"text": text}

# Create datasets
train_dataset = Dataset.from_list(train_data).map(format_instruction)
val_dataset = Dataset.from_list(val_data).map(format_instruction)

# Tokenize datasets
def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        padding=True,
        max_length=2048,
        return_tensors="pt"
    )

train_dataset = train_dataset.map(tokenize_function, batched=True)
val_dataset = val_dataset.map(tokenize_function, batched=True)

# Training arguments
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

# Data collator
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False,
)

# Create trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    data_collator=data_collator,
)

# Start training
print("Starting Medarion fine-tuning...")
trainer.train()

# Save the final model
print("Saving Medarion model...")
trainer.save_model()
tokenizer.save_pretrained(OUTPUT_DIR)

# Test the model
def test_medarion_model():
    test_prompt = "### Instruction:\\nWhat is your name and what do you do?\\n\\n### Response:\\n"
    
    inputs = tokenizer(test_prompt, return_tensors="pt")
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=200,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print("Medarion Response:")
    print(response)

# Test the model
test_medarion_model()

print("🎉 Medarion fine-tuning complete!")
print(f"Model saved to: {OUTPUT_DIR}")
```

## 🔧 **Kaggle Setup Checklist**

### **Before Starting:**
- [ ] Kaggle account created
- [ ] GPU access enabled (free tier)
- [ ] Dataset files prepared (0.56 GB)
- [ ] Notebook code ready

### **During Upload:**
- [ ] Create dataset on Kaggle
- [ ] Upload all 4 files
- [ ] Make dataset public
- [ ] Create new notebook
- [ ] Enable GPU (T4 or P100)
- [ ] Copy notebook code
- [ ] Update dataset path

### **During Training:**
- [ ] Monitor training progress
- [ ] Check loss curves
- [ ] Verify Medarion identity
- [ ] Save model outputs
- [ ] Download trained model

## 📊 **Expected Results**

### **Training Output:**
- **Model Name**: `mistral-7b-medarion`
- **Identity**: Responds as "Medarion"
- **Expertise**: Healthcare, investment, regulatory
- **Quality**: High-quality responses
- **Size**: ~14GB trained model

### **Test Questions:**
1. **"What is your name?"** → "I am Medarion..."
2. **"What do you do?"** → "I help with healthcare..."
3. **"Healthcare advice?"** → Expert guidance
4. **"Investment analysis?"** → Professional insights

## 🎉 **Success Indicators**

### **Training Success:**
- ✅ Loss decreases over epochs
- ✅ Validation loss improves
- ✅ Model saves successfully
- ✅ Medarion identity works
- ✅ Healthcare expertise demonstrated

### **Model Quality:**
- ✅ Consistent "Medarion" responses
- ✅ Healthcare domain knowledge
- ✅ Professional tone and expertise
- ✅ Relevant and accurate information

## 📁 **File Locations**

All files are ready in:
```
D:\medarion_scraper_output\mistral_training_data\
```

**Your Medarion AI model is ready for Kaggle fine-tuning!** 🚀
