import os
import argparse
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer


def parse_args():
	parser = argparse.ArgumentParser()
	parser.add_argument('--base_model', type=str, required=True)
	parser.add_argument('--data_dir', type=str, required=True)
	parser.add_argument('--output_dir', type=str, required=True)
	parser.add_argument('--bits', type=int, default=4)
	parser.add_argument('--lora_r', type=int, default=16)
	parser.add_argument('--lora_alpha', type=int, default=32)
	parser.add_argument('--lora_dropout', type=float, default=0.05)
	parser.add_argument('--max_seq_length', type=int, default=4096)
	parser.add_argument('--per_device_train_batch_size', type=int, default=2)
	parser.add_argument('--gradient_accumulation_steps', type=int, default=16)
	parser.add_argument('--learning_rate', type=float, default=1e-4)
	parser.add_argument('--num_train_epochs', type=int, default=2)
	parser.add_argument('--warmup_ratio', type=float, default=0.03)
	parser.add_argument('--eval_steps', type=int, default=500)
	parser.add_argument('--save_steps', type=int, default=1000)
	parser.add_argument('--gradient_checkpointing', action='store_true')
	return parser.parse_args()


def main():
	args = parse_args()
	os.makedirs(args.output_dir, exist_ok=True)

	# Load data (expects JSONL with fields: instruction, input, output)
	dataset = load_dataset('json', data_files={
		'train': os.path.join(args.data_dir, 'train.jsonl'),
		'validation': os.path.join(args.data_dir, 'val.jsonl')
	})

	tokenizer = AutoTokenizer.from_pretrained(args.base_model, use_fast=True)
	if tokenizer.pad_token is None:
		tokenizer.pad_token = tokenizer.eos_token

	model = AutoModelForCausalLM.from_pretrained(
		args.base_model,
		trust_remote_code=True,
		low_cpu_mem_usage=True,
		device_map='auto'
	)

	# Apply LoRA
	lora_cfg = LoraConfig(
		r=args.lora_r,
		lora_alpha=args.lora_alpha,
		lora_dropout=args.lora_dropout,
		target_modules=['q_proj','k_proj','v_proj','o_proj','gate_proj','up_proj','down_proj']
	)
	model = get_peft_model(model, lora_cfg)

	training_args = TrainingArguments(
		output_dir=args.output_dir,
		per_device_train_batch_size=args.per_device_train_batch_size,
		gradient_accumulation_steps=args.gradient_accumulation_steps,
		learning_rate=args.learning_rate,
		num_train_epochs=args.num_train_epochs,
		warmup_ratio=args.warmup_ratio,
		evaluation_strategy='steps',
		eval_steps=args.eval_steps,
		save_steps=args.save_steps,
		logging_steps=50,
		bf16=True,
		gradient_checkpointing=args.gradient_checkpointing,
		report_to=['none']
	)

	def format_example(example):
		instr = example.get('instruction','').strip()
		inp = example.get('input','').strip()
		out = example.get('output','').strip()
		if inp:
			prompt = f"### Instruction\n{instr}\n\n### Input\n{inp}\n\n### Response\n"
		else:
			prompt = f"### Instruction\n{instr}\n\n### Response\n"
		return { 'text': prompt + out }

	train_data = dataset['train'].map(format_example)
	val_data = dataset['validation'].map(format_example)

	trainer = SFTTrainer(
		model=model,
		tokenizer=tokenizer,
		train_dataset=train_data,
		eval_dataset=val_data,
		args=training_args,
		max_seq_length=args.max_seq_length,
		packing=True,
		dataset_text_field='text'
	)

	trainer.train()
	trainer.save_model(args.output_dir)


if __name__ == '__main__':
	main()




