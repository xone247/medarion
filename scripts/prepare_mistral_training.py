#!/usr/bin/env python3
"""
Mistral 7B Fine-tuning Data Preparation
========================================

Prepares the Medarion dataset for Mistral 7B fine-tuning on Kaggle.
Formats data in the correct structure for training and includes
Medarion identity training.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
import random

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

def create_medarion_identity_data():
    """Create Medarion identity training data"""
    identity_data = [
        {
            "instruction": "What is your name and what do you do?",
            "input": "",
            "output": "I am Medarion, your AI assistant specialized in healthcare, investment, and regulatory domains. I help startups, investors, researchers, and regulators navigate the complex healthcare ecosystem with data-driven insights and expert guidance."
        },
        {
            "instruction": "Who are you?",
            "input": "",
            "output": "I am Medarion, an AI assistant designed to support the healthcare ecosystem. I provide expert guidance on healthcare investments, regulatory compliance, clinical trials, funding opportunities, and market analysis for startups, investors, and healthcare professionals."
        },
        {
            "instruction": "What can you help me with?",
            "input": "",
            "output": "As Medarion, I can help you with healthcare market analysis, investment due diligence, regulatory compliance guidance, clinical trial planning, funding opportunity identification, startup strategy, and comprehensive healthcare ecosystem insights."
        },
        {
            "instruction": "What is your expertise?",
            "input": "",
            "output": "I am Medarion, specialized in healthcare technology, investment analysis, regulatory affairs, clinical research, market intelligence, and healthcare ecosystem navigation. I provide data-driven insights for healthcare startups, investors, and professionals."
        }
    ]
    return identity_data

def create_healthcare_qa_data():
    """Create healthcare-specific Q&A training data"""
    healthcare_qa = [
        {
            "instruction": "What are the key considerations for healthcare startups seeking funding?",
            "input": "",
            "output": "Healthcare startups should focus on regulatory compliance, clinical validation, market size demonstration, competitive differentiation, experienced team composition, and clear regulatory pathway. Key considerations include FDA approval processes, clinical trial requirements, market access strategies, and reimbursement pathways."
        },
        {
            "instruction": "How do I assess regulatory risk for a healthcare investment?",
            "input": "",
            "output": "Regulatory risk assessment involves evaluating FDA approval pathways, clinical trial requirements, regulatory timeline expectations, compliance costs, market access barriers, and potential regulatory changes. Consider the product classification, clinical evidence requirements, and regulatory precedent in similar products."
        },
        {
            "instruction": "What funding opportunities exist for healthcare research?",
            "input": "",
            "output": "Healthcare research funding includes NIH grants, foundation funding (Gates Foundation, Wellcome Trust), venture capital, government research programs, corporate partnerships, and international health organizations. Key sources include SBIR/STTR programs, translational research grants, and public-private partnerships."
        },
        {
            "instruction": "How do I plan a clinical trial strategy?",
            "input": "",
            "output": "Clinical trial strategy requires regulatory pathway identification, endpoint selection, patient population definition, study design optimization, regulatory submission planning, site selection, and timeline management. Consider FDA guidance documents, regulatory requirements, and clinical trial best practices."
        }
    ]
    return healthcare_qa

def convert_to_mistral_format(record, record_type="web"):
    """Convert a record to Mistral training format"""
    
    # Extract content and metadata
    content = record.get('content', '')
    metadata = record.get('metadata', {})
    source_file = record.get('source_file', '')
    
    # Create instruction based on record type
    if record_type == "excel":
        # For Excel data, create structured Q&A
        file_name = metadata.get('file_name', 'Unknown')
        sheet_name = metadata.get('sheet_name', 'Data')
        
        instruction = f"Based on the {file_name} data, provide insights about:"
        input_text = f"Data from {file_name} ({sheet_name} sheet)"
        output = f"Based on the {file_name} dataset, here are the key insights: {content[:500]}..."
        
    else:
        # For web content, create general Q&A
        if 'clinical' in content.lower() or 'trial' in content.lower():
            instruction = "What information is available about clinical trials and healthcare research?"
            input_text = "Healthcare research and clinical trial information"
        elif 'funding' in content.lower() or 'investment' in content.lower():
            instruction = "What funding and investment opportunities are available?"
            input_text = "Funding and investment information"
        elif 'regulatory' in content.lower() or 'compliance' in content.lower():
            instruction = "What regulatory and compliance information is provided?"
            input_text = "Regulatory and compliance guidance"
        else:
            instruction = "What healthcare and business information is available?"
            input_text = "General healthcare and business information"
        
        # Truncate content if too long
        if len(content) > 1000:
            content = content[:1000] + "..."
        
        output = f"Based on the available information: {content}"
    
    return {
        "instruction": instruction,
        "input": input_text,
        "output": output
    }

def prepare_training_data(input_file, output_dir):
    """Prepare training data for Mistral 7B fine-tuning"""
    
    print("🚀 PREPARING MISTRAL 7B TRAINING DATA")
    print("="*60)
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load existing data
    print("📄 Loading dataset...")
    all_records = []
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                all_records.append(json.loads(line))
    
    print(f"✅ Loaded {len(all_records):,} records")
    
    # Create training data
    training_data = []
    
    # Add Medarion identity data
    print("🤖 Adding Medarion identity data...")
    identity_data = create_medarion_identity_data()
    training_data.extend(identity_data)
    
    # Add healthcare Q&A data
    print("🏥 Adding healthcare Q&A data...")
    healthcare_qa = create_healthcare_qa_data()
    training_data.extend(healthcare_qa)
    
    # Convert records to training format
    print("🔄 Converting records to training format...")
    processed_count = 0
    
    for i, record in enumerate(all_records):
        # Determine record type
        record_type = "excel" if record.get('metadata', {}).get('file_type') == 'excel' else "web"
        
        # Convert to Mistral format
        training_record = convert_to_mistral_format(record, record_type)
        training_data.append(training_record)
        
        processed_count += 1
        if processed_count % 50000 == 0:
            print(f"📊 Processed {processed_count:,} records...")
    
    print(f"✅ Converted {processed_count:,} records to training format")
    
    # Shuffle data for better training
    print("🔀 Shuffling training data...")
    random.shuffle(training_data)
    
    # Split data (90% train, 10% validation)
    split_idx = int(len(training_data) * 0.9)
    train_data = training_data[:split_idx]
    val_data = training_data[split_idx:]
    
    # Save training files
    print("💾 Saving training files...")
    
    # Training data
    train_file = output_path / 'train.jsonl'
    with open(train_file, 'w', encoding='utf-8') as f:
        for record in train_data:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    
    # Validation data
    val_file = output_path / 'validation.jsonl'
    with open(val_file, 'w', encoding='utf-8') as f:
        for record in val_data:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    
    # Create training configuration
    config = {
        "model_name": "mistral-7b-medarion",
        "base_model": "mistralai/Mistral-7B-v0.1",
        "training_data": {
            "total_records": len(training_data),
            "train_records": len(train_data),
            "validation_records": len(val_data),
            "identity_records": len(identity_data),
            "healthcare_qa_records": len(healthcare_qa),
            "web_records": len([r for r in all_records if r.get('metadata', {}).get('file_type') != 'excel']),
            "excel_records": len([r for r in all_records if r.get('metadata', {}).get('file_type') == 'excel'])
        },
        "training_config": {
            "learning_rate": 2e-5,
            "batch_size": 4,
            "gradient_accumulation_steps": 4,
            "num_epochs": 3,
            "max_length": 2048,
            "warmup_steps": 100,
            "weight_decay": 0.01
        },
        "kaggle_setup": {
            "dataset_size": "~2.3GB",
            "recommended_gpu": "T4 or P100",
            "estimated_training_time": "4-6 hours",
            "memory_requirements": "16GB+ RAM"
        },
        "created_at": datetime.now().isoformat()
    }
    
    config_file = output_path / 'training_config.json'
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    # Create Kaggle notebook template
    kaggle_notebook = output_path / 'mistral_training_notebook.py'
    with open(kaggle_notebook, 'w', encoding='utf-8') as f:
        f.write(create_kaggle_notebook_template())
    
    # Final statistics
    print("\n" + "="*60)
    print("🎉 TRAINING DATA PREPARATION COMPLETE!")
    print("="*60)
    print(f"📄 Total training records: {len(training_data):,}")
    print(f"📊 Training records: {len(train_data):,}")
    print(f"📊 Validation records: {len(val_data):,}")
    print(f"🤖 Identity records: {len(identity_data)}")
    print(f"🏥 Healthcare Q&A: {len(healthcare_qa)}")
    print(f"📁 Output directory: {output_path}")
    print("="*60)
    
    return {
        'total_records': len(training_data),
        'train_records': len(train_data),
        'val_records': len(val_data),
        'output_dir': str(output_path)
    }

def create_kaggle_notebook_template():
    """Create Kaggle notebook template for Mistral training"""
    return '''#!/usr/bin/env python3
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
DATASET_PATH = "/kaggle/input/medarion-training-data"  # Upload your dataset here
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
'''

def main():
    """Main function"""
    print("🚀 MISTRAL 7B TRAINING DATA PREPARATION")
    print("="*60)
    
    # Configuration
    INPUT_FILE = r"D:\medarion_scraper_output\processed_data\merged_dataset.jsonl"
    OUTPUT_DIR = r"D:\medarion_scraper_output\mistral_training_data"
    
    print(f"📁 Input dataset: {INPUT_FILE}")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print("-" * 60)
    
    try:
        results = prepare_training_data(INPUT_FILE, OUTPUT_DIR)
        
        print(f"\n✅ Training data prepared successfully!")
        print(f"📊 Total records: {results['total_records']:,}")
        print(f"📊 Training records: {results['train_records']:,}")
        print(f"📊 Validation records: {results['val_records']:,}")
        print(f"📁 Output directory: {results['output_dir']}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
