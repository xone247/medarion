#!/bin/bash
# Install all dependencies for Vast.ai API
# Run this on the Vast.ai instance

echo "=========================================="
echo "Installing Dependencies for Medarion AI"
echo "=========================================="

# Update pip first
echo "[1/4] Updating pip..."
python3 -m pip install --upgrade pip

# Install PyTorch with CUDA support (for GPU)
echo ""
echo "[2/4] Installing PyTorch with CUDA..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install Flask and transformers
echo ""
echo "[3/4] Installing Flask and Transformers..."
pip install flask transformers accelerate

# Verify installations
echo ""
echo "[4/4] Verifying installations..."
python3 -c "import torch; print(f'✅ PyTorch: {torch.__version__}')"
python3 -c "import flask; print(f'✅ Flask: {flask.__version__}')"
python3 -c "import transformers; print(f'✅ Transformers: {transformers.__version__}')"

echo ""
echo "=========================================="
echo "✅ All dependencies installed!"
echo "=========================================="
