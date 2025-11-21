import argparse
from transformers import AutoModelForCausalLM
from peft import PeftModel


def parse_args():
	parser = argparse.ArgumentParser()
	parser.add_argument('--base_model', required=True)
	parser.add_argument('--lora_path', required=True)
	parser.add_argument('--output_dir', required=True)
	return parser.parse_args()


def main():
	args = parse_args()
	base = AutoModelForCausalLM.from_pretrained(args.base_model, torch_dtype='auto', device_map='auto')
	peft = PeftModel.from_pretrained(base, args.lora_path)
	merged = peft.merge_and_unload()
	merged.save_pretrained(args.output_dir)


if __name__ == '__main__':
	main()




