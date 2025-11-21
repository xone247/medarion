#!/bin/bash
# Vast.ai Setup Commands for Jupyter Terminal
# Copy and paste these commands into your Jupyter terminal

echo "=========================================="
echo "VAST.AI SETUP - INSTALL DEPENDENCIES"
echo "=========================================="
echo ""

# Step 1: Install Python dependencies
echo "📦 Step 1: Installing Python packages..."
pip install --quiet --root-user-action=ignore torch transformers flask flask-cors transformers accelerate tqdm boto3

echo ""
echo "✅ Dependencies installed!"
echo ""

# Step 2: Verify installations
echo "🔍 Step 2: Verifying installations..."
python3 -c "import torch; print(f'✅ PyTorch: {torch.__version__}')"
python3 -c "import transformers; print(f'✅ Transformers: {transformers.__version__}')"
python3 -c "import flask; print(f'✅ Flask: {flask.__version__}')"
python3 -c "import boto3; print(f'✅ Boto3: {boto3.__version__}')"

echo ""
echo "=========================================="
echo "VAST.AI SETUP - RUN API SERVER"
echo "=========================================="
echo ""

# Step 3: Navigate to workspace and run script
echo "📂 Step 3: Navigating to workspace..."
cd /workspace/model_api || mkdir -p /workspace/model_api && cd /workspace/model_api

echo ""
echo "🚀 Step 4: Starting API server..."
echo "   (This will download, extract, and load the model)"
echo "   (Press Ctrl+C to stop the server)"
echo ""

# Run the script
python3 run_api_on_vast.py

