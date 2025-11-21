#!/usr/bin/env python3
"""
RunPod-optimized QLoRA training for single RTX A5000 (24GB)
 - 4-bit (bitsandbytes, nf4, double quant)
 - LoRA adapters on key Mistral/transformer modules
 - Packing via TRL SFTTrainer for speed (less padding)
 - BF16 if supported (fallback to FP16)
 - Gradient checkpointing, TF32, efficient dataloader

Expects a dataset dir containing train.jsonl and validation.jsonl (or val.jsonl)
with fields: instruction, input, output
"""

import argparse
import json
import os
from typing import Dict, Any

import torch
from datasets import load_dataset, DatasetDict
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer


def boolean_flag(parser: argparse.ArgumentParser, name: str, default: bool, help_text: str) -> None:
    group = parser.add_mutually_exclusive_group()
    group.add_argument(f"--{name}", dest=name, action="store_true", help=help_text)
    group.add_argument(f"--no-{name}", dest=name, action="store_false", help=f"Disable {help_text}")
    parser.set_defaults(**{name: default})


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="RunPod A5000 QLoRA trainer")
    parser.add_argument("--base_model", type=str, default="teknium/OpenHermes-2.5-Mistral-7B")
    parser.add_argument("--data_dir", type=str, required=True, help="Directory with train.jsonl and validation.jsonl")
    parser.add_argument("--output_dir", type=str, required=True)

    # Training hyperparameters
    parser.add_argument("--num_train_epochs", type=int, default=2)
    parser.add_argument("--per_device_train_batch_size", type=int, default=2)
    parser.add_argument("--gradient_accumulation_steps", type=int, default=8)
    parser.add_argument("--learning_rate", type=float, default=1e-4)
    parser.add_argument("--warmup_ratio", type=float, default=0.03)
    parser.add_argument("--weight_decay", type=float, default=0.01)
    parser.add_argument("--eval_steps", type=int, default=500)
    parser.add_argument("--save_steps", type=int, default=1000)
    parser.add_argument("--max_seq_length", type=int, default=2048)

    # LoRA
    parser.add_argument("--lora_r", type=int, default=16)
    parser.add_argument("--lora_alpha", type=int, default=32)
    parser.add_argument("--lora_dropout", type=float, default=0.05)

    # BitsAndBytes (4-bit)
    boolean_flag(parser, "load_in_4bit", True, "Load model in 4-bit")
    parser.add_argument("--bnb_4bit_quant_type", type=str, default="nf4", choices=["nf4", "fp4"])

    # Attention impl preference
    parser.add_argument("--attn", type=str, default="auto", choices=["auto", "flash", "sdpa"], help="Attention backend preference")

    # Budget mode: minimize runtime/cost
    boolean_flag(parser, "budget_mode", False, "Enable fast budget mode")
    parser.add_argument("--max_train_samples", type=int, default=None, help="Cap number of training samples")
    parser.add_argument("--max_eval_samples", type=int, default=None, help="Cap number of eval samples")

    # Save/merge
    boolean_flag(parser, "merge_full_model", False, "Merge LoRA into base model after training")

    args = parser.parse_args()
    return args


def bf16_available() -> bool:
    return bool(torch.cuda.is_available() and torch.cuda.is_bf16_supported())


def build_text(example: Dict[str, Any]) -> str:
    instr = (example.get("instruction") or "").strip()
    inp = (example.get("input") or "").strip()
    out = (example.get("output") or "").strip()
    if inp:
        return f"### Instruction\n{instr}\n\n### Input\n{inp}\n\n### Response\n{out}"
    return f"### Instruction\n{instr}\n\n### Response\n{out}"


def main() -> None:
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    # Speed-friendly defaults for A5000
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True

    # Resolve dataset files
    train_path = os.path.join(args.data_dir, "train.jsonl")
    val_path = os.path.join(args.data_dir, "validation.jsonl")
    if not os.path.exists(val_path):
        alt = os.path.join(args.data_dir, "val.jsonl")
        if os.path.exists(alt):
            val_path = alt
        else:
            raise FileNotFoundError("validation.jsonl (or val.jsonl) not found in data_dir")

    data = load_dataset(
        "json",
        data_files={
            "train": train_path,
            "validation": val_path,
        },
    )
    # Apply budget caps early to avoid mapping/tokenization overhead
    if args.budget_mode:
        # Sensible defaults for ~1–2h runtime if not provided
        default_train = 20000
        default_eval = 1000
        max_train = args.max_train_samples or default_train
        max_eval = args.max_eval_samples or default_eval
        data["train"] = data["train"].shuffle(seed=42).select(range(min(len(data["train"]), max_train)))
        data["validation"] = data["validation"].shuffle(seed=42).select(range(min(len(data["validation"]), max_eval)))
    # Map to a simple text field for SFTTrainer with packing
    data = DatasetDict({
        split: ds.map(lambda ex: {"text": build_text(ex)}, remove_columns=[c for c in ds.column_names if c != "text"])  # type: ignore
        for split, ds in data.items()
    })

    # Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.base_model, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Attention implementation preference
    attn_impl = None
    if args.attn == "flash":
        attn_impl = "flash_attention_2"
    elif args.attn == "sdpa":
        attn_impl = "sdpa"

    # Model in 4-bit
    compute_dtype = torch.bfloat16 if bf16_available() else torch.float16
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        device_map="auto",
        low_cpu_mem_usage=True,
        trust_remote_code=False,
        attn_implementation=attn_impl,  # type: ignore[arg-type]
        load_in_4bit=args.load_in_4bit,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type=args.bnb_4bit_quant_type,
        bnb_4bit_compute_dtype=compute_dtype,
    )

    # LoRA adapters
    lora_cfg = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
    )
    model = get_peft_model(model, lora_cfg)

    # Gradient checkpointing: trade memory vs speed
    if not args.budget_mode:
        try:
            model.gradient_checkpointing_enable()
        except Exception:
            pass
        if hasattr(model, "config"):
            try:
                model.config.use_cache = False  # important with gradient checkpointing
            except Exception:
                pass

    # Training args
    # Budget mode overrides for speed
    budget_eval_strategy = "no" if args.budget_mode else "steps"
    budget_save_strategy = "no" if args.budget_mode else "steps"
    budget_eval_steps = args.eval_steps if not args.budget_mode else 0
    budget_save_steps = args.save_steps if not args.budget_mode else 0
    budget_epochs = args.num_train_epochs if not args.budget_mode else 1
    budget_seq_len = args.max_seq_length if not args.budget_mode else min(args.max_seq_length, 512)

    train_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=budget_epochs,
        per_device_train_batch_size=args.per_device_train_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
        warmup_ratio=args.warmup_ratio,
        weight_decay=args.weight_decay,
        bf16=bf16_available(),
        fp16=not bf16_available(),
        logging_steps=10,
        evaluation_strategy=budget_eval_strategy,
        eval_steps=budget_eval_steps,
        save_strategy=budget_save_strategy,
        save_steps=budget_save_steps,
        save_total_limit=3,
        load_best_model_at_end=(not args.budget_mode),
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        gradient_checkpointing=(not args.budget_mode),
        report_to=["none"],
        dataloader_num_workers=4,
        dataloader_pin_memory=True,
        group_by_length=True,
        optim="adamw_torch_fused",
        save_safetensors=True,
    )

    # Trainer with packing for speed
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=data["train"],
        eval_dataset=data["validation"],
        args=train_args,
        packing=True,
        max_seq_length=budget_seq_len,
        dataset_text_field="text",
    )

    trainer.train()
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    if args.merge_full_model:
        # Optional: merge adapters - can use CPU to avoid VRAM spikes
        from peft import PeftModel
        base = AutoModelForCausalLM.from_pretrained(
            args.base_model,
            torch_dtype=torch.bfloat16 if bf16_available() else torch.float16,
            low_cpu_mem_usage=True,
            device_map={"": "cpu"},
            trust_remote_code=False,
        )
        peft_model = PeftModel.from_pretrained(base, args.output_dir)
        merged = peft_model.merge_and_unload()
        merged_dir = os.path.join(args.output_dir, "merged_model")
        os.makedirs(merged_dir, exist_ok=True)
        merged.save_pretrained(merged_dir, safe_serialization=True)
        tokenizer.save_pretrained(merged_dir)


if __name__ == "__main__":
    main()


