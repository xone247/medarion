"""
SageMaker Inference Script for Medarion Mistral 7B Model
Optimized for the actual file structure in TAR.GZ
"""

import json
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import logging
import sys

# Configure logging - output to stderr so it appears in CloudWatch
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)  # Use stderr for CloudWatch
    ]
)
logger = logging.getLogger(__name__)

# Global variables for model and tokenizer
model_dict = None

def model_fn(model_dir):
    """
    Load the model and tokenizer from the model directory.
    This function is called once when the endpoint starts.
    
    Args:
        model_dir: Path to the directory containing model files (all in root)
        
    Returns:
        Dictionary containing model and tokenizer
    """
    global model_dict
    
    if model_dict is not None:
        logger.info("Model already loaded, reusing...")
        return model_dict
    
    logger.info("=" * 70)
    logger.info("🚀 STARTING MODEL LOADING")
    logger.info("=" * 70)
    logger.info(f"Model directory: {model_dir}")
    
    # Verify model_dir exists
    if not os.path.exists(model_dir):
        error_msg = f"Model directory does not exist: {model_dir}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    
    # List and verify files in model_dir
    logger.info("📋 Listing files in model_dir...")
    try:
        all_files = os.listdir(model_dir)
        logger.info(f"Found {len(all_files)} files/directories")
        
        # Check for required files
        required_files = {
            'config.json': False,
            'inference.py': False
        }
        
        model_file_patterns = ['model', 'safetensors', 'pytorch_model']
        tokenizer_file_patterns = ['tokenizer']
        
        model_files_found = []
        tokenizer_files_found = []
        
        for filename in all_files:
            filepath = os.path.join(model_dir, filename)
            
            # Check if it's a file (not directory)
            if os.path.isfile(filepath):
                size_mb = os.path.getsize(filepath) / (1024 * 1024)
                
                # Check required files
                if filename == 'config.json':
                    required_files['config.json'] = True
                    logger.info(f"  ✅ config.json ({size_mb:.2f} MB)")
                elif filename == 'inference.py':
                    required_files['inference.py'] = True
                    logger.info(f"  ✅ inference.py ({size_mb:.2f} MB)")
                elif any(pattern in filename.lower() for pattern in model_file_patterns):
                    model_files_found.append(filename)
                    logger.info(f"  ✅ Model: {filename} ({size_mb:.2f} MB)")
                elif any(pattern in filename.lower() for pattern in tokenizer_file_patterns):
                    tokenizer_files_found.append(filename)
                    logger.info(f"  ✅ Tokenizer: {filename} ({size_mb:.2f} MB)")
                else:
                    logger.info(f"  📄 Other: {filename} ({size_mb:.2f} MB)")
        
        # Verify required files
        missing_required = [k for k, v in required_files.items() if not v]
        if missing_required:
            logger.error(f"❌ Missing required files: {missing_required}")
            raise FileNotFoundError(f"Missing required files: {missing_required}")
        
        if not model_files_found:
            logger.error("❌ No model files found!")
            raise FileNotFoundError("No model files (safetensors/pytorch_model) found")
        
        logger.info(f"✅ Found {len(model_files_found)} model file(s)")
        logger.info(f"✅ Found {len(tokenizer_files_found)} tokenizer file(s)")
        
    except Exception as e:
        logger.error(f"Error listing model_dir: {e}")
        raise
    
    # Check device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"🖥️  Device: {device}")
    
    if device.type == "cuda":
        logger.info(f"   GPU: {torch.cuda.get_device_name(0)}")
        gpu_memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        logger.info(f"   GPU Memory: {gpu_memory_gb:.2f} GB")
    
    try:
        # Load tokenizer
        logger.info("📥 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            model_dir,
            trust_remote_code=False,
            use_fast=True
        )
        logger.info("✅ Tokenizer loaded")
        
        # Set pad token
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            logger.info("   Set pad_token to eos_token")
        
        # Load model
        logger.info("📥 Loading model (this may take a few minutes)...")
        logger.info("   Note: AutoModelForCausalLM.from_pretrained() automatically")
        logger.info("         detects and uses model.safetensors.index.json if present")
        
        if device.type == "cuda":
            # Try device_map="auto" first, fallback if it fails
            try:
                logger.info("   Attempting device_map='auto'...")
                model = AutoModelForCausalLM.from_pretrained(
                    model_dir,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    trust_remote_code=False,
                    low_cpu_mem_usage=True
                )
                logger.info("✅ Model loaded with device_map='auto'")
            except Exception as e:
                logger.warning(f"   device_map='auto' failed: {e}")
                logger.info("   Falling back to manual device placement...")
                model = AutoModelForCausalLM.from_pretrained(
                    model_dir,
                    torch_dtype=torch.float16,
                    device_map=None,
                    trust_remote_code=False,
                    low_cpu_mem_usage=True
                )
                model = model.to(device)
                logger.info("✅ Model loaded with manual placement")
        else:
            model = AutoModelForCausalLM.from_pretrained(
                model_dir,
                torch_dtype=torch.float32,
                device_map=None,
                trust_remote_code=False,
                low_cpu_mem_usage=True
            )
            model = model.to(device)
            logger.info("✅ Model loaded on CPU")
        
        model.eval()
        logger.info("✅ Model set to eval mode")
        
        # Log model info
        if hasattr(model, 'config'):
            logger.info(f"   Model type: {type(model).__name__}")
            if hasattr(model.config, 'model_type'):
                logger.info(f"   Architecture: {model.config.model_type}")
        
        model_dict = {
            "model": model,
            "tokenizer": tokenizer,
            "device": device
        }
        
        logger.info("=" * 70)
        logger.info("✅ MODEL LOADING COMPLETE - READY FOR INFERENCE")
        logger.info("=" * 70)
        
        return model_dict
        
    except Exception as e:
        logger.error("=" * 70)
        logger.error("❌ MODEL LOADING FAILED")
        logger.error("=" * 70)
        logger.error(f"Error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise

def input_fn(request_body, request_content_type):
    """
    Parse and validate the input request.
    
    Args:
        request_body: Raw request body (bytes or string)
        request_content_type: Content type of the request
        
    Returns:
        Parsed input data as dictionary
    """
    if request_content_type == "application/json":
        if isinstance(request_body, bytes):
            input_data = json.loads(request_body.decode('utf-8'))
        else:
            input_data = json.loads(request_body)
        
        # Validate required fields
        if "messages" not in input_data:
            raise ValueError("Missing 'messages' field in request")
        
        return input_data
    else:
        raise ValueError(f"Unsupported content type: {request_content_type}. Expected 'application/json'")

def predict_fn(input_data, model_dict):
    """
    Generate prediction using the loaded model.
    
    Args:
        input_data: Parsed input data from input_fn
        model_dict: Dictionary containing model and tokenizer from model_fn
        
    Returns:
        Dictionary with generated text and usage information
    """
    model = model_dict["model"]
    tokenizer = model_dict["tokenizer"]
    device = model_dict["device"]
    
    # Extract parameters with safe defaults
    messages = input_data.get("messages", [])
    temperature = float(input_data.get("temperature", 0.7))
    max_tokens = int(input_data.get("max_tokens", 100))  # Start small for testing
    top_p = float(input_data.get("top_p", 1.0))
    
    logger.info(f"🎯 Generating response...")
    logger.info(f"   Messages: {len(messages)}")
    logger.info(f"   Temperature: {temperature}")
    logger.info(f"   Max tokens: {max_tokens}")
    
    try:
        # Format messages
        if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template:
            try:
                prompt = tokenizer.apply_chat_template(
                    messages,
                    tokenize=False,
                    add_generation_prompt=True
                )
                logger.info("   Used chat template")
            except Exception as e:
                logger.warning(f"   Chat template failed: {e}, using fallback")
                prompt = format_messages_fallback(messages)
        else:
            prompt = format_messages_fallback(messages)
        
        # Tokenize
        logger.info("   Tokenizing input...")
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=32768
        ).to(device)
        
        input_token_count = inputs["input_ids"].shape[1]
        logger.info(f"   Input tokens: {input_token_count}")
        
        # Generate
        logger.info("   Generating tokens...")
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature if temperature > 0 else None,
                top_p=top_p if top_p < 1.0 else None,
                do_sample=temperature > 0,
                pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                repetition_penalty=float(input_data.get("repetition_penalty", 1.1))
            )
        
        # Decode
        generated_tokens = outputs[0][input_token_count:]
        generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
        
        completion_token_count = len(generated_tokens)
        total_token_count = input_token_count + completion_token_count
        
        logger.info(f"   Generated {completion_token_count} tokens")
        logger.info(f"✅ Generation complete")
        
        # Format response
        response = {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": generated_text.strip()
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": input_token_count,
                "completion_tokens": completion_token_count,
                "total_tokens": total_token_count
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Error during prediction: {str(e)}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise

def output_fn(prediction, response_content_type):
    """
    Format the prediction for the response.
    
    Args:
        prediction: Output from predict_fn
        response_content_type: Expected content type for response
        
    Returns:
        Formatted response (JSON string)
    """
    if response_content_type == "application/json":
        return json.dumps(prediction, ensure_ascii=False)
    else:
        raise ValueError(f"Unsupported content type: {response_content_type}. Expected 'application/json'")

def format_messages_fallback(messages):
    """
    Fallback message formatting when chat template is not available.
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
        
    Returns:
        Formatted prompt string
    """
    formatted = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        if role == "system":
            formatted.append(f"System: {content}")
        elif role == "user":
            formatted.append(f"User: {content}")
        elif role == "assistant":
            formatted.append(f"Assistant: {content}")
        else:
            formatted.append(f"{role.capitalize()}: {content}")
    
    formatted.append("Assistant:")
    return "\n".join(formatted)

