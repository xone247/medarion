# VRAM Usage Diagnostics and Clearing

## Check Current VRAM Usage

### 1. Check GPU Memory with nvidia-smi
```bash
nvidia-smi
```
Shows:
- Total VRAM: 24.0 GB
- Used VRAM: Check this value
- Processes using GPU (PID, Memory, Command)

### 2. Check Python Processes
```bash
ps aux | grep python | grep -v grep
```
Lists all Python processes. Look for:
- Multiple `run_api_on_vast.py` instances
- Other Python scripts using GPU

### 3. Check API Processes Specifically
```bash
ps aux | grep 'run_api_on_vast.py' | grep -v grep
```
Should only show ONE process. If multiple, stop all:
```bash
pkill -f 'run_api_on_vast.py'
```

### 4. Check GPU Memory from Python
```bash
python3 -c "import torch; print(f'VRAM: {torch.cuda.memory_allocated(0)/1024**3:.2f} GB allocated, {torch.cuda.memory_reserved(0)/1024**3:.2f} GB reserved')"
```

## Clear VRAM

### Option 1: Stop All API Processes
```bash
pkill -f 'run_api_on_vast.py'
# Wait 5 seconds
nvidia-smi
# Should show reduced VRAM usage
```

### Option 2: Stop All Python Processes (Nuclear Option)
```bash
pkill -f python
# Wait 5 seconds
nvidia-smi
# Should show 0 MB used
```

### Option 3: Clear from Python (if API is running)
```python
import torch
import gc

# Clear cache
torch.cuda.empty_cache()
torch.cuda.synchronize()
gc.collect()

# Check memory
print(f"VRAM: {torch.cuda.memory_allocated(0)/1024**3:.2f} GB")
```

## Expected VRAM Usage

- **Mistral 7B in FP16 (float16)**: ~14 GB
- **Mistral 7B in 4-bit quantization**: ~4-5 GB
- **Current usage**: 23.4 GB (MAXED OUT!)

## If VRAM is Maxed Out

1. **Check for multiple model instances**
   ```bash
   ps aux | grep 'run_api_on_vast.py' | wc -l
   # Should be 1, not more
   ```

2. **Check for memory leaks**
   - Restart API periodically
   - Use 4-bit quantization (reduces VRAM by ~70%)

3. **Check for other processes**
   ```bash
   nvidia-smi
   # Look for other processes using GPU
   ```

## After Clearing VRAM

1. Restart API with memory optimizations:
   ```bash
   cd /workspace
   nohup python3 run_api_on_vast.py > api.log 2>&1 &
   ```

2. Monitor VRAM:
   ```bash
   watch -n 1 nvidia-smi
   # Press Ctrl+C to stop
   ```

