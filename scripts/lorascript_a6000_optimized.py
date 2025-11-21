#!/usr/bin/env python3
"""
🚀 Medarion QLoRA Fine-tuning Script - A6000 OPTIMIZED VERSION
================================================================
Optimized for RTX A6000 (48GB) to complete full dataset training in 4-7 hours
Features: Auto-resume, progress bars, full dataset coverage, maximum speed
"""

import os
import sys
import json
import pickle
import warnings
from datetime import datetime
from pathlib import Path
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    TrainingArguments, 
    Trainer, 
    DataCollatorForLanguageModeling, 
    BitsAndBytesConfig
)
from datasets import Dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# Suppress warnings
warnings.filterwarnings("ignore")
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:512"

# Enable TF32 for A6000 speed
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

# ============================================================
# CONFIGURATION - OPTIMIZED FOR A6000 + FAST TRAINING
# ============================================================
MODEL_NAME = "teknium/OpenHermes-2.5-Mistral-7B"
DATA_PATH = "/workspace/medarion"  # Where train.jsonl and validation.jsonl are
OUTPUT_DIR = "/workspace/medarion/outputs/medarion-qlora-a6000"
CHECKPOINT_DIR = "/workspace/medarion/outputs/checkpoints"

# Speed-optimized settings for 4-7 hour target
MAX_SEQ_LENGTH = 256  # Shorter sequences = faster training
BATCH_SIZE = 28  # Large batch for A6000 (adjust down if OOM)
GRADIENT_ACCUM = 1  # No accumulation needed with large batch
LEARNING_RATE = 2e-5
NUM_EPOCHS = 1  # Full dataset, one pass
SAVE_STEPS = 3000  # Save checkpoints for resume
LOG_STEPS = 100  # Frequent logging for progress visibility
WARMUP_STEPS = 200
NUM_WORKERS = 24  # Use those 28 CPU cores effectively

# Create directories
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

print("=" * 70)
print("🚀 MEDARION A6000-OPTIMIZED TRAINING SCRIPT")
print("=" * 70)
print(f"📂 Model: {MODEL_NAME}")
print(f"📂 Data: {DATA_PATH}")
print(f"📂 Output: {OUTPUT_DIR}")
print(f"⚡ Settings: Seq={MAX_SEQ_LENGTH}, Batch={BATCH_SIZE}, Workers={NUM_WORKERS}")
print("=" * 70)

# ============================================================
# PROGRESS TRACKING & RESUME FUNCTIONALITY
# ============================================================
def save_progress(step, status, data=None):
    """Save progress for resume capability"""
    progress = {
        "step": step,
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "data": data or {}
    }
    with open(f"{CHECKPOINT_DIR}/training_progress.json", "w") as f:
        json.dump(progress, f, indent=2)
    print(f"💾 Progress saved: Step {step} - {status}")

def load_progress():
    """Load progress to resume from interruptions"""
    try:
        with open(f"{CHECKPOINT_DIR}/training_progress.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"step": 0, "status": "starting"}

def save_checkpoint(obj, filename):
    """Save Python objects for resuming"""
    try:
        with open(f"{CHECKPOINT_DIR}/{filename}", "wb") as f:
            pickle.dump(obj, f)
        print(f"💾 Checkpoint saved: {filename}")
    except Exception as e:
        print(f"⚠️ Could not save checkpoint {filename}: {e}")

def load_checkpoint(filename):
    """Load Python objects for resuming"""
    try:
        with open(f"{CHECKPOINT_DIR}/{filename}", "rb") as f:
            return pickle.load(f)
    except:
        return None

# Load progress
progress = load_progress()
resume_from = progress.get("step", 0)

# ============================================================
# STEP 1: LOAD MODEL & TOKENIZER
# ============================================================
if resume_from <= 1:
    save_progress(1, "loading_model")
    print("\n📥 Step 1: Loading Model (4-bit quantized for speed)...")
    
    try:
        # Tokenizer
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)  # use_fast=False avoids protobuf issues
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"
        print("✅ Tokenizer loaded")
        
        # Determine compute dtype
        compute_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
        
        # 4-bit quantization config
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=compute_dtype,
        )
        
        # Load model with optimal settings
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            quantization_config=quantization_config,
            device_map="auto",
            low_cpu_mem_usage=True,
            trust_remote_code=False,
            torch_dtype=compute_dtype,
            attn_implementation="sdpa",  # Use SDPA for stability
        )
        
        # Prepare for training
        model.config.use_cache = False
        model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=False)  # No gradient checkpointing for speed
        
        if hasattr(model, "enable_input_require_grads"):
            model.enable_input_require_grads()
        
        print("✅ Model loaded in 4-bit mode")
        print(f"📊 Model parameters: {sum(p.numel() for p in model.parameters()):,}")
        
        save_progress(1, "model_loaded")
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        save_progress(1, "model_loading_failed", {"error": str(e)})
        raise e
else:
    print("🔄 Reloading model for resume...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"
    
    compute_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=compute_dtype,
    )
    
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=quantization_config,
        device_map="auto",
        low_cpu_mem_usage=True,
        trust_remote_code=False,
        torch_dtype=compute_dtype,
        attn_implementation="sdpa",
    )
    
    model.config.use_cache = False
    model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=False)
    if hasattr(model, "enable_input_require_grads"):
        model.enable_input_require_grads()
    print("✅ Model reloaded")

# ============================================================
# STEP 2: APPLY LoRA
# ============================================================
if resume_from <= 2:
    save_progress(2, "applying_lora")
    print("\n⚙️ Step 2: Applying LoRA adapters...")
    
    try:
        lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
        )
        
        model = get_peft_model(model, lora_config)
        print("✅ LoRA adapters attached")
        print(f"📊 Trainable parameters: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")
        
        save_progress(2, "lora_applied")
        
    except Exception as e:
        print(f"❌ Error applying LoRA: {e}")
        save_progress(2, "lora_failed", {"error": str(e)})
        raise e
else:
    print("🔄 Re-applying LoRA adapters...")
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)
    print("✅ LoRA re-applied")

# ============================================================
# STEP 3: LOAD DATA (FULL DATASET)
# ============================================================
if resume_from <= 3:
    save_progress(3, "loading_data")
    print("\n📊 Step 3: Loading FULL Dataset...")
    
    try:
        def load_jsonl(path):
            """Load JSONL data"""
            data = []
            print(f"🔄 Loading {path}...")
            with open(path, "r", encoding="utf-8") as f:
                for i, line in enumerate(f):
                    if i % 50000 == 0 and i > 0:
                        print(f"   Loaded {i:,} records...")
                    data.append(json.loads(line))
            return data
        
        # Load ALL data
        train_path = os.path.join(DATA_PATH, "train.jsonl")
        val_path = os.path.join(DATA_PATH, "validation.jsonl")
        
        # Check for alternative validation filename
        if not os.path.exists(val_path):
            val_path_alt = os.path.join(DATA_PATH, "val.jsonl")
            if os.path.exists(val_path_alt):
                val_path = val_path_alt
        
        train_data = load_jsonl(train_path)
        print(f"✅ Loaded {len(train_data):,} training records")
        
        if os.path.exists(val_path):
            val_data = load_jsonl(val_path)
            print(f"✅ Loaded {len(val_data):,} validation records")
        else:
            print("⚠️ No validation data found, using 10% of training data")
            split_idx = int(len(train_data) * 0.9)
            val_data = train_data[split_idx:]
            train_data = train_data[:split_idx]
        
        # Add Medarion identity reinforcement
        identity_samples = [
            {
                "instruction": "What is your name and what do you specialize in?",
                "input": "",
                "output": "I am Medarion, an AI assistant specialized in healthcare, life sciences, and investment insights."
            },
            {
                "instruction": "Who are you?",
                "input": "",
                "output": "I am Medarion, your AI assistant for healthcare and life sciences expertise."
            }
        ] * 25  # Repeat for reinforcement
        
        train_data.extend(identity_samples)
        print(f"✅ Added {len(identity_samples)} identity reinforcement samples")
        
        # Save checkpoints
        save_checkpoint(train_data, "train_data.pkl")
        save_checkpoint(val_data, "val_data.pkl")
        save_progress(3, "data_loaded")
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        save_progress(3, "data_loading_failed", {"error": str(e)})
        raise e
else:
    print("🔄 Loading data from checkpoints...")
    train_data = load_checkpoint("train_data.pkl")
    val_data = load_checkpoint("val_data.pkl")
    if train_data is None:
        raise Exception("Could not load data checkpoints")

# ============================================================
# STEP 4: FORMAT & TOKENIZE DATA
# ============================================================
if resume_from <= 4:
    save_progress(4, "formatting_data")
    print("\n🔄 Step 4: Formatting & Tokenizing Data...")
    print(f"⏱️ This may take 5-10 minutes for {len(train_data):,} samples...")
    
    try:
        def format_example(example):
            instruction = example.get("instruction", "")
            input_text = example.get("input", "")
            output = example.get("output", "")
            
            if input_text:
                text = f"### Instruction:\n{instruction}\n\n### Input:\n{input_text}\n\n### Response:\n{output}"
            else:
                text = f"### Instruction:\n{instruction}\n\n### Response:\n{output}"
            
            return {"text": text}
        
        def tokenize_function(examples):
            return tokenizer(
                examples["text"],
                truncation=True,
                padding=False,
                max_length=MAX_SEQ_LENGTH,
                return_tensors=None
            )
        
        # Format datasets
        print("📝 Formatting training data...")
        train_dataset = Dataset.from_list(train_data).map(
            format_example,
            num_proc=24,  # Use multiple CPU cores
            desc="Formatting"
        )
        
        print("📝 Formatting validation data...")
        val_dataset = Dataset.from_list(val_data).map(
            format_example,
            num_proc=24,
            desc="Formatting"
        )
        
        # Tokenize datasets
        print("🔤 Tokenizing training data...")
        train_dataset = train_dataset.map(
            tokenize_function,
            batched=True,
            num_proc=24,  # Parallel tokenization
            remove_columns=["text", "instruction", "input", "output"],
            desc="Tokenizing"
        )
        
        print("🔤 Tokenizing validation data...")
        val_dataset = val_dataset.map(
            tokenize_function,
            batched=True,
            num_proc=24,
            remove_columns=["text", "instruction", "input", "output"],
            desc="Tokenizing"
        )
        
        print(f"✅ Data formatted: {len(train_dataset):,} train, {len(val_dataset):,} val")
        
        # Save datasets
        save_checkpoint(train_dataset, "train_dataset.pkl")
        save_checkpoint(val_dataset, "val_dataset.pkl")
        save_progress(4, "data_formatted")
        
    except Exception as e:
        print(f"❌ Error formatting data: {e}")
        save_progress(4, "formatting_failed", {"error": str(e)})
        raise e
else:
    print("🔄 Loading formatted datasets from checkpoints...")
    train_dataset = load_checkpoint("train_dataset.pkl")
    val_dataset = load_checkpoint("val_dataset.pkl")
    if train_dataset is None:
        raise Exception("Could not load dataset checkpoints")

# ============================================================
# STEP 5: SETUP TRAINING
# ============================================================
if resume_from <= 5:
    save_progress(5, "setting_up_training")
    print("\n⚙️ Step 5: Setting up A6000-optimized training...")
    
    try:
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False,
            pad_to_multiple_of=8,
            return_tensors="pt"
        )
        
        # Calculate steps for progress estimation
        total_steps = (len(train_dataset) // BATCH_SIZE) * NUM_EPOCHS
        print(f"📊 Estimated total steps: {total_steps:,}")
        print(f"⏱️ Estimated time at 1.5s/step: {(total_steps * 1.5 / 3600):.1f} hours")
        
        # Training arguments optimized for A6000
        training_args = TrainingArguments(
            output_dir=OUTPUT_DIR,
            num_train_epochs=NUM_EPOCHS,
            per_device_train_batch_size=BATCH_SIZE,
            per_device_eval_batch_size=BATCH_SIZE,
            gradient_accumulation_steps=GRADIENT_ACCUM,
            learning_rate=LEARNING_RATE,
            warmup_steps=WARMUP_STEPS,
            weight_decay=0.01,
            logging_steps=LOG_STEPS,
            save_strategy="steps",
            save_steps=SAVE_STEPS,
            save_total_limit=3,
            load_best_model_at_end=False,
            bf16=torch.cuda.is_bf16_supported(),
            fp16=not torch.cuda.is_bf16_supported(),
            optim="adamw_torch_fused",
            gradient_checkpointing=False,  # Disabled for speed
            report_to="none",
            dataloader_num_workers=NUM_WORKERS,
            dataloader_pin_memory=True,
            dataloader_persistent_workers=True,
            dataloader_prefetch_factor=4,
            group_by_length=True,
            ddp_find_unused_parameters=False,
            max_grad_norm=1.0,
            save_safetensors=True,
            remove_unused_columns=False,
            disable_tqdm=False,  # Keep progress bar visible
            run_name="medarion-a6000-fast",
        )
        
        # Create trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=None,  # Skip eval for speed
            data_collator=data_collator,
        )
        
        print("✅ Training setup complete")
        save_checkpoint(trainer, "trainer.pkl")
        save_progress(5, "training_configured")
        
    except Exception as e:
        print(f"❌ Error setting up training: {e}")
        save_progress(5, "training_setup_failed", {"error": str(e)})
        raise e
else:
    print("🔄 Rebuilding trainer from configuration...")
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,
        pad_to_multiple_of=8,
        return_tensors="pt"
    )
    
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUM,
        learning_rate=LEARNING_RATE,
        warmup_steps=WARMUP_STEPS,
        weight_decay=0.01,
        logging_steps=LOG_STEPS,
        save_strategy="steps",
        save_steps=SAVE_STEPS,
        save_total_limit=3,
        load_best_model_at_end=False,
        bf16=torch.cuda.is_bf16_supported(),
        fp16=not torch.cuda.is_bf16_supported(),
        optim="adamw_torch_fused",
        gradient_checkpointing=False,
        report_to="none",
        dataloader_num_workers=NUM_WORKERS,
        dataloader_pin_memory=True,
        dataloader_persistent_workers=True,
        dataloader_prefetch_factor=4,
        group_by_length=True,
        ddp_find_unused_parameters=False,
        max_grad_norm=1.0,
        save_safetensors=True,
        remove_unused_columns=False,
        disable_tqdm=False,
        run_name="medarion-a6000-fast",
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=None,
        data_collator=data_collator,
    )
    print("✅ Trainer rebuilt")

# ============================================================
# STEP 6: TRAINING
# ============================================================
if resume_from <= 6:
    save_progress(6, "starting_training")
    print("\n" + "=" * 70)
    print("🚀 STARTING TRAINING - A6000 OPTIMIZED")
    print("=" * 70)
    print(f"📊 Training samples: {len(train_dataset):,}")
    print(f"⚙️ Batch size: {BATCH_SIZE}")
    print(f"📏 Sequence length: {MAX_SEQ_LENGTH}")
    print(f"🔄 Epochs: {NUM_EPOCHS}")
    print(f"💾 Checkpoints every {SAVE_STEPS} steps")
    print("⏱️ Target completion: 4-7 hours")
    print("=" * 70)
    
    try:
        # Check for existing checkpoints to resume
        import glob
        checkpoints = glob.glob(os.path.join(OUTPUT_DIR, "checkpoint-*"))
        
        if checkpoints:
            # Resume from latest checkpoint
            latest_checkpoint = max(checkpoints, key=lambda x: int(x.split("-")[-1]))
            print(f"📂 Resuming from checkpoint: {latest_checkpoint}")
            trainer.train(resume_from_checkpoint=latest_checkpoint)
        else:
            print("🆕 Starting fresh training...")
            trainer.train()
        
        print("\n✅ Training completed successfully!")
        save_progress(6, "training_complete")
        
    except KeyboardInterrupt:
        print("\n⚠️ Training interrupted by user")
        print("💾 Progress saved - run script again to resume")
        save_progress(6, "training_interrupted")
        sys.exit(0)
        
    except Exception as e:
        print(f"\n❌ Training error: {e}")
        print("💾 Progress saved - fix issue and run script again to resume")
        save_progress(6, "training_failed", {"error": str(e)})
        raise e

# ============================================================
# STEP 7: SAVE FINAL MODEL
# ============================================================
if resume_from <= 7:
    save_progress(7, "saving_model")
    print("\n💾 Step 7: Saving final model...")
    
    try:
        model.save_pretrained(OUTPUT_DIR)
        tokenizer.save_pretrained(OUTPUT_DIR)
        print(f"✅ Model saved to: {OUTPUT_DIR}")
        save_progress(7, "model_saved")
        
    except Exception as e:
        print(f"❌ Error saving model: {e}")
        save_progress(7, "save_failed", {"error": str(e)})
        raise e

# ============================================================
# COMPLETION
# ============================================================
print("\n" + "=" * 70)
print("🎉 TRAINING COMPLETE!")
print("=" * 70)
print(f"✅ Model location: {OUTPUT_DIR}")
print(f"✅ Training samples processed: {len(train_dataset):,}")
print("✅ Your Medarion model is ready for deployment!")
print("\n💡 To merge LoRA weights into base model, run:")
print(f"   python merge_lora.py --adapter {OUTPUT_DIR} --output {OUTPUT_DIR}/merged")
print("=" * 70)

save_progress(8, "complete")
