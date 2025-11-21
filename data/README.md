# Data layout

- raw/: place original source files (txt, md, pdf after text extraction)
- processed/: normalized/cleaned text files
- sft/: instruction tuning JSONL files (train.jsonl, val.jsonl)
- chunks/: output of chunking for RAG (chunks.jsonl)

## Prepare chunks
```bash
python scripts/prepare_chunks.py --input_dir data/processed --output_dir data/chunks
```

## Train QLoRA
```bash
accelerate launch --mixed_precision bf16 \
  scripts/train_qlora.py \
  --base_model meta-llama/Meta-Llama-3.1-8B-Instruct \
  --data_dir data/sft \
  --output_dir models/llama3.1-8b-med-qlora \
  --bits 4 --lora_r 16 --lora_alpha 32 --lora_dropout 0.05 \
  --max_seq_length 4096 --per_device_train_batch_size 2 --gradient_accumulation_steps 16 \
  --learning_rate 1e-4 --num_train_epochs 2 --warmup_ratio 0.03 \
  --eval_steps 500 --save_steps 1000 --gradient_checkpointing
```

## Merge LoRA
```bash
python scripts/merge_lora_and_save.py \
  --base_model meta-llama/Meta-Llama-3.1-8B-Instruct \
  --lora_path models/llama3.1-8b-med-qlora \
  --output_dir models/llama3.1-8b-med-merged
```


