"""
SageMaker Inference Script for Medarion Mistral 7B Model
Improved version with better error handling and file verification
"""

import json
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model and tokenizer
model_dict = None

def model_fn(model_dir):
    """
    Load the model and tokenizer from the model directory.
    This function is called once when the endpoint starts.
    
    Args:
        model_dir: Path to the directory containing model files
        
    Returns:
        Dictionary containing model and tokenizer
    """
    global model_dict
    
    if model_dict is not None:
        logger.info("Model already loaded, reusing...")
        return model_dict
    
    logger.info(f"Loading model from: {model_dir}")
    
    # Verify model_dir exists and list contents
    if not os.path.exists(model_dir):
        error_msg = f"Model directory does not exist: {model_dir}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    
    logger.info(f"Model directory exists: {model_dir}")
    
    # List files in model_dir for debugging
    try:
        files = os.listdir(model_dir)
        logger.info(f"Files in model_dir ({len(files)} total):")
        for f in sorted(files)[:20]:  # Show first 20 files
            filepath = os.path.join(model_dir, f)
            if os.path.isfile(filepath):
                size = os.path.getsize(filepath) / (1024 * 1024)  # MB
                logger.info(f"  - {f} ({size:.2f} MB)")
            else:
                logger.info(f"  - {f}/ (directory)")
        if len(files) > 20:
            logger.info(f"  ... and {len(files) - 20} more files")
    except Exception as e:
        logger.warning(f"Could not list model_dir contents: {e}")
    
    # Check for required model files
    required_files = ['config.json']
    optional_files = ['tokenizer.json', 'tokenizer_config.json', 'model.safetensors', 'pytorch_model.bin']
    
    missing_required = []
    for req_file in required_files:
        req_path = os.path.join(model_dir, req_file)
        if not os.path.exists(req_path):
            missing_required.append(req_file)
    
    if missing_required:
        logger.warning(f"Missing required files: {missing_required}")
        logger.info("Attempting to load anyway - files might be in subdirectories")
    else:
        logger.info("✅ Required model files found")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    if device.type == "cuda":
        logger.info(f"CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
            logger.info(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")
    
    try:
        # Load tokenizer
        logger.info("Loading tokenizer...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                model_dir,
                trust_remote_code=False,
                use_fast=True
            )
            logger.info("✅ Tokenizer loaded successfully")
        except Exception as e:
            logger.error(f"❌ Tokenizer loading failed: {e}")
            raise
        
        # Set pad token if not set
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            logger.info("Set pad_token to eos_token")
        
        # Load model
        logger.info("Loading model...")
        logger.info("This may take several minutes for large models...")
        
        try:
            # Use device_map="auto" for multi-GPU, but fallback if it fails
            model = None
            if device.type == "cuda":
                try:
                    logger.info("Attempting to load with device_map='auto'...")
                    model = AutoModelForCausalLM.from_pretrained(
                        model_dir,
                        torch_dtype=torch.float16,
                        device_map="auto",
                        trust_remote_code=False,
                        low_cpu_mem_usage=True
                    )
                    logger.info("✅ Model loaded with device_map='auto'")
                except Exception as e:
                    logger.warning(f"device_map='auto' failed: {e}")
                    logger.info("Falling back to manual device placement...")
                    model = AutoModelForCausalLM.from_pretrained(
                        model_dir,
                        torch_dtype=torch.float16,
                        device_map=None,
                        trust_remote_code=False,
                        low_cpu_mem_usage=True
                    )
                    model = model.to(device)
                    logger.info("✅ Model loaded with manual device placement")
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
            logger.info("✅ Model loaded successfully and set to eval mode")
            
            # Log model info
            if hasattr(model, 'config'):
                logger.info(f"Model type: {type(model).__name__}")
                if hasattr(model.config, 'model_type'):
                    logger.info(f"Model architecture: {model.config.model_type}")
            
        except Exception as e:
            logger.error(f"❌ Model loading failed: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
        
        model_dict = {
            "model": model,
            "tokenizer": tokenizer,
            "device": device
        }
        
        logger.info("✅ Model and tokenizer ready for inference")
        return model_dict
        
    except Exception as e:
        logger.error(f"❌ Error loading model: {str(e)}")
        import traceback
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
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
    
    # Extract parameters
    messages = input_data.get("messages", [])
    temperature = float(input_data.get("temperature", 0.7))
    max_tokens = int(input_data.get("max_tokens", 4000))
    top_p = float(input_data.get("top_p", 1.0))
    
    logger.info(f"Generating with temperature={temperature}, max_tokens={max_tokens}")
    
    try:
        # Format messages using chat template if available
        if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template:
            try:
                # Use the chat template
                prompt = tokenizer.apply_chat_template(
                    messages,
                    tokenize=False,
                    add_generation_prompt=True
                )
                logger.info("Used chat template for formatting")
            except Exception as e:
                logger.warning(f"Chat template failed: {e}, using fallback")
                # Fallback formatting
                prompt = format_messages_fallback(messages)
        else:
            # Fallback formatting
            prompt = format_messages_fallback(messages)
        
        # Tokenize input
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=32768  # Mistral max context
        ).to(device)
        
        input_token_count = inputs["input_ids"].shape[1]
        logger.info(f"Input tokens: {input_token_count}")
        
        # Generate
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
        
        # Decode generated text (skip input tokens)
        generated_tokens = outputs[0][input_token_count:]
        generated_text = tokenizer.decode(
            generated_tokens,
            skip_special_tokens=True
        )
        
        # Calculate token counts
        completion_token_count = len(generated_tokens)
        total_token_count = input_token_count + completion_token_count
        
        logger.info(f"Generated {completion_token_count} tokens")
        
        # Format response in OpenAI-compatible format
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
        logger.error(f"Error during prediction: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
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

