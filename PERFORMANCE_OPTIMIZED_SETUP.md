# Performance-Optimized Setup for RTX A5000 (24GB VRAM)

## 🎯 Optimization Strategy

With **24GB VRAM** and **14.3GB currently used**, we optimize for:
- **Best quality** responses
- **Good headroom** (~16GB free)
- **Fast inference** with available resources

## ✅ Optimizations Applied

### 1. 8-bit Quantization
- **VRAM Usage**: ~7-8GB (vs ~14GB FP16, ~4-5GB 4-bit)
- **Quality**: Better than 4-bit, close to FP16
- **Headroom**: Leaves ~16GB free for generation

### 2. Flash Attention 2 / SDPA
- **Speed**: Faster inference with attention optimization
- **Memory**: More efficient attention computation
- **Fallback**: Uses SDPA if Flash Attention not available

### 3. Optimized Generation Parameters
- **max_tokens**: 200-1024 (more detailed responses)
- **temperature**: 0.7-0.8 (more natural, creative)
- **top_p**: 0.95 (better token selection)
- **top_k**: 50 (quality-focused sampling)
- **repetition_penalty**: 1.15-1.2 (stronger, better quality)
- **no_repeat_ngram_size**: 4 (prevents repetition)

### 4. Performance Features
- **KV Cache**: Enabled for faster inference
- **Memory Management**: Optimized cleanup
- **Batch Processing**: Ready for concurrent requests

## 📊 Expected Resource Usage

### VRAM
- **Model (8-bit)**: ~7-8GB
- **Generation Buffer**: ~2-3GB
- **Total**: ~9-11GB
- **Headroom**: ~13-15GB free ✅

### CPU
- **Model Loading**: Uses multiple cores
- **Inference**: Single-threaded per request
- **Headroom**: Plenty available

### Memory
- **Model**: ~7-8GB VRAM
- **System**: ~2-3GB RAM
- **Headroom**: ~60GB+ free ✅

## 🚀 Deployment

### 1. Upload Optimized File
```powershell
scp -P 52695 run_api_on_vast.py root@93.91.156.91:/workspace/
```

### 2. Start API
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
tail -f api.log
```

### 3. Verify Optimization
```bash
# Check VRAM (should be ~7-8GB, not 14GB+)
nvidia-smi

# Check logs for optimization confirmation
grep "8-bit\|Flash Attention\|SDPA" api.log
```

## 🎯 Performance Comparison

| Configuration | VRAM | Quality | Speed | Headroom |
|---------------|------|---------|-------|----------|
| **FP16** | ~14GB | Best | Fast | ~10GB |
| **8-bit (Optimized)** | ~7-8GB | Excellent | Fast | ~16GB ✅ |
| **4-bit** | ~4-5GB | Good | Fast | ~19GB |

**Recommendation**: 8-bit provides best balance for your setup!

## 🔧 Advanced Options

### If You Want Even Better Quality (FP16)
If you want maximum quality and have headroom:
- Change `load_in_8bit=True` to `load_in_8bit=False`
- Remove `quantization_config`
- Use `torch_dtype=torch.float16`
- VRAM: ~14GB (still leaves ~10GB headroom)

### If You Want Maximum Headroom (4-bit)
If you need more headroom for other processes:
- Change `load_in_8bit=True` to `load_in_4bit=True`
- VRAM: ~4-5GB (leaves ~19GB headroom)
- Quality: Still good, but slightly lower than 8-bit

## ✅ Success Criteria

- ✅ VRAM: ~7-8GB (not maxed out)
- ✅ Quality: Excellent responses
- ✅ Speed: Fast inference
- ✅ Headroom: ~16GB free
- ✅ No warnings or errors

## 📝 Notes

- **8-bit quantization** provides best quality/VRAM balance
- **Flash Attention** speeds up inference significantly
- **Optimized parameters** produce better responses
- **Good headroom** prevents OOM errors during generation

