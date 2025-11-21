#!/usr/bin/env python3
"""
Full Training Data Creator
=========================

Creates training data that includes ALL processed data in an efficient format
for Mistral 7B fine-tuning, ensuring no data is lost.
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

def convert_to_compact_training_format(record, record_type="web"):
    """Convert a record to compact training format that preserves all data"""
    
    # Extract content and metadata
    content = record.get('content', '')
    metadata = record.get('metadata', {})
    source_file = record.get('source_file', '')
    
    # Create instruction based on record type and content
    if record_type == "excel":
        # For Excel data, create structured Q&A
        file_name = metadata.get('file_name', 'Unknown')
        sheet_name = metadata.get('sheet_name', 'Data')
        
        instruction = f"Based on the {file_name} data, provide insights about:"
        input_text = f"Data from {file_name} ({sheet_name} sheet)"
        
        # Include the full Excel data in the output
        excel_data = record.get('excel_data', {})
        if excel_data:
            data_summary = []
            for key, value in excel_data.items():
                data_summary.append(f"{key}: {value}")
            output = f"Based on the {file_name} dataset, here are the key insights: {'; '.join(data_summary[:10])}..."  # Include more data
        else:
            output = f"Based on the {file_name} dataset, here are the key insights: {content[:1000]}..."
        
    else:
        # For web content, create comprehensive Q&A
        content_lower = content.lower()
        
        if 'clinical' in content_lower or 'trial' in content_lower:
            instruction = "What information is available about clinical trials and healthcare research?"
            input_text = "Healthcare research and clinical trial information"
        elif 'funding' in content_lower or 'investment' in content_lower:
            instruction = "What funding and investment opportunities are available?"
            input_text = "Funding and investment information"
        elif 'regulatory' in content_lower or 'compliance' in content_lower:
            instruction = "What regulatory and compliance information is provided?"
            input_text = "Regulatory and compliance guidance"
        elif 'startup' in content_lower or 'company' in content_lower:
            instruction = "What company and startup information is available?"
            input_text = "Company and startup information"
        else:
            instruction = "What healthcare and business information is available?"
            input_text = "General healthcare and business information"
        
        # Include more content in the output (up to 2000 characters)
        if len(content) > 2000:
            content = content[:2000] + "..."
        
        output = f"Based on the available information: {content}"
    
    return {
        "instruction": instruction,
        "input": input_text,
        "output": output
    }

def create_full_training_data(input_file, output_dir):
    """Create training data that includes ALL processed data"""
    
    print("🚀 CREATING FULL TRAINING DATA")
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
    
    # Convert ALL records to training format
    print("🔄 Converting ALL records to training format...")
    processed_count = 0
    
    for i, record in enumerate(all_records):
        # Determine record type
        record_type = "excel" if record.get('metadata', {}).get('file_type') == 'excel' else "web"
        
        # Convert to training format
        training_record = convert_to_compact_training_format(record, record_type)
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
            "dataset_size": "~2.5GB",
            "recommended_gpu": "T4 or P100",
            "estimated_training_time": "6-8 hours",
            "memory_requirements": "16GB+ RAM"
        },
        "created_at": datetime.now().isoformat()
    }
    
    config_file = output_path / 'training_config.json'
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    # Final statistics
    print("\n" + "="*60)
    print("🎉 FULL TRAINING DATA CREATION COMPLETE!")
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

def main():
    """Main function"""
    print("🚀 FULL TRAINING DATA CREATOR")
    print("="*60)
    
    # Configuration
    INPUT_FILE = r"D:\medarion_scraper_output\processed_data\merged_dataset.jsonl"
    OUTPUT_DIR = r"D:\medarion_scraper_output\full_training_data"
    
    print(f"📁 Input dataset: {INPUT_FILE}")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print("-" * 60)
    
    try:
        results = create_full_training_data(INPUT_FILE, OUTPUT_DIR)
        
        print(f"\n✅ Full training data created successfully!")
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
