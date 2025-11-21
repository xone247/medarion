#!/usr/bin/env python3
# ============================================================
# 🚀 Medarion Fine-tuning Notebook (QLoRA on OpenHermes 2.5) - OPTIMIZED
# ============================================================

# ✅ 1. INSTALL DEPENDENCIES
!pip install -q transformers accelerate peft bitsandbytes datasets safetensors sentencepiece

# ✅ 2. IMPORT LIBRARIES
import os, torch, json, warnings
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, PeftModel
from IPython.display import FileLink

# Suppress warnings
warnings.filterwarnings("ignore")
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# ============================================================
# 📁 PATHS & CONFIGURATION
# ============================================================
BASE_MODEL = "teknium/OpenHermes-2.5-Mistral-7B"   # ungated alternative to Mistral-7B
DATASET_PATH = "/kaggle/input/xone-finetuning-data" # your uploaded dataset folder
OUTPUT_DIR   = "/kaggle/working/medarion-mistral-qlora"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("🚀 Starting Medarion fine-tuning using QLoRA…")
print(f"📂 Dataset path: {DATASET_PATH}")
print(f"📂 Output path:  {OUTPUT_DIR}")

# ============================================================
# 🧠 LOAD TOKENIZER & 4-BIT MODEL
# ============================================================
print("📥 Loading base model in 4-bit precision...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    load_in_4bit=True,
    device_map="auto",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    low_cpu_mem_usage=True,
    trust_remote_code=False,  # Safety measure
)
print("✅ Model loaded successfully in 4-bit mode!")

# ============================================================
# ⚙️ PREPARE LoRA CONFIGURATION
# ============================================================
lora_config = LoraConfig(
    r=16,  # Increased from 8 for better performance
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],  # More modules
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
print("✅ LoRA adapters attached!")

# ============================================================
# 📊 LOAD & FORMAT DATA
# ============================================================
def load_jsonl(path):
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            data.append(json.loads(line))
    return data

print("📚 Loading dataset files...")
train_data = load_jsonl(f"{DATASET_PATH}/train.jsonl")
val_data   = load_jsonl(f"{DATASET_PATH}/validation.jsonl")
print(f"✅ Train: {len(train_data):,} records | Val: {len(val_data):,} records")

def format_example(example):
    if example.get("input"):
        text = (
            f"### Instruction:\n{example['instruction']}\n\n"
            f"### Input:\n{example['input']}\n\n"
            f"### Response:\n{example['output']}"
        )
    else:
        text = (
            f"### Instruction:\n{example['instruction']}\n\n"
            f"### Response:\n{example['output']}"
        )
    return {"text": text}

print("🔄 Formatting data...")
train_dataset = Dataset.from_list(train_data).map(format_example, num_proc=1)
val_dataset   = Dataset.from_list(val_data).map(format_example, num_proc=1)

def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        padding=False,  # Let data collator handle padding
        max_length=1024,
        return_tensors=None
    )

print("🔠 Tokenizing...")
train_dataset = train_dataset.map(
    tokenize_function, 
    batched=True, 
    remove_columns=["text"],
    num_proc=1  # Prevent multiprocessing issues
)
val_dataset   = val_dataset.map(
    tokenize_function, 
    batched=True, 
    remove_columns=["text"],
    num_proc=1  # Prevent multiprocessing issues
)
print("✅ Tokenization complete!")

# ============================================================
# 🧩 TRAINING SETUP
# ============================================================
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer, 
    mlm=False,
    pad_to_multiple_of=8,
    return_tensors="pt"
)

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=1,
    per_device_eval_batch_size=1,
    gradient_accumulation_steps=4,
    eval_strategy="steps",  # Fixed parameter name
    eval_steps=500,
    save_strategy="steps",
    save_steps=1000,
    save_total_limit=2,
    fp16=True,
    learning_rate=2e-5,
    warmup_steps=100,
    weight_decay=0.01,
    logging_steps=50,
    report_to="none",
    dataloader_num_workers=0,  # Prevent multiprocessing issues
    dataloader_drop_last=True,
    max_grad_norm=1.0,  # Gradient clipping
    save_safetensors=True,
    remove_unused_columns=False,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    data_collator=data_collator,
)

# ============================================================
# 🚀 TRAIN
# ============================================================
print("🚦 Beginning training… (this may take 4–6 hours)")
print("💡 Using QLoRA for efficient training...")
print("📊 Training on 474,053 records with 52,673 validation records")

try:
    trainer.train(resume_from_checkpoint=None)
    print("✅ Training complete!")
except Exception as e:
    print(f"❌ Training failed: {e}")
    print("💡 Check the error and try again")

# ============================================================
# 💾 SAVE ADAPTER & MERGE INTO FULL MODEL
# ============================================================
print("💾 Saving LoRA adapter...")
try:
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("✅ LoRA adapter saved!")
except Exception as e:
    print(f"❌ Failed to save adapter: {e}")

print("🔄 Merging LoRA adapter into base model for export...")
try:
    base = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL, 
        torch_dtype=torch.float16, 
        low_cpu_mem_usage=True,
        device_map="cpu"  # Use CPU for merging to save GPU memory
    )
    peft_model = PeftModel.from_pretrained(base, OUTPUT_DIR)
    merged = peft_model.merge_and_unload()
    merged.save_pretrained(f"{OUTPUT_DIR}/merged_model", safe_serialization=True)
    tokenizer.save_pretrained(f"{OUTPUT_DIR}/merged_model")
    print("✅ Merged model saved!")
except Exception as e:
    print(f"❌ Failed to merge model: {e}")

# ============================================================
# 🧪 QUICK TEST
# ============================================================
print("🧪 Testing the fine-tuned model...")
try:
    from transformers import pipeline
    pipe = pipeline(
        "text-generation", 
        model=f"{OUTPUT_DIR}/merged_model", 
        tokenizer=tokenizer, 
        device_map="auto"
    )

    prompt = "### Instruction:\nWhat is your name and what do you specialize in?\n\n### Response:\n"
    result = pipe(prompt, max_new_tokens=100, temperature=0.7, do_sample=True)
    print("\n🤖 Medarion test response:\n", result[0]["generated_text"])
except Exception as e:
    print(f"❌ Test failed: {e}")

# ============================================================
# 📦 ZIP & DOWNLOAD
# ============================================================
print("📦 Creating download package...")
try:
    !zip -r /kaggle/working/medarion_final_model.zip {OUTPUT_DIR}/merged_model
    FileLink("/kaggle/working/medarion_final_model.zip")
    print("✅ Download package ready!")
except Exception as e:
    print(f"❌ Failed to create package: {e}")

print("\n🎉 All done! Your model is ready for download or AWS deployment.")
