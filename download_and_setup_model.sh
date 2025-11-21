#!/bin/bash
# Download and setup model from S3 for new Vast.ai instance
# This script downloads, extracts, and verifies the model

set -e

echo "🚀 Downloading and Setting Up Model from S3"
echo "============================================"

# Configuration
WORKDIR="/workspace/model_api"
MODEL_DIR="$WORKDIR/extracted"
TAR_FILE="$WORKDIR/medarion-final-model.tar.gz"
BUCKET="medarion7b-model-2025-ue2"
TARGZ_KEY="medarion-final-model.tar.gz"
REGION="us-east-2"

# AWS Credentials (from environment or hardcoded for this instance)
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-YOUR_AWS_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-YOUR_AWS_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="$REGION"

# Create working directory
mkdir -p "$WORKDIR"
cd "$WORKDIR"

# Step 1: Install AWS CLI if needed
echo ""
echo "📦 Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo "   Installing AWS CLI..."
    apt-get update -qq
    apt-get install -y awscli
else
    echo "   ✅ AWS CLI already installed"
fi

# Step 2: Download model from S3
echo ""
echo "📥 Downloading model from S3..."
echo "   Bucket: s3://$BUCKET/$TARGZ_KEY"
echo "   Destination: $TAR_FILE"

if [ -f "$TAR_FILE" ]; then
    SIZE=$(du -h "$TAR_FILE" | cut -f1)
    echo "   ✅ Model file already exists: $SIZE"
    echo "   Skipping download..."
else
    echo "   Downloading (this may take 10-20 minutes)..."
    aws s3 cp "s3://$BUCKET/$TARGZ_KEY" "$TAR_FILE" --region "$REGION" 2>&1
    
    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$TAR_FILE" | cut -f1)
        echo "   ✅ Download complete: $SIZE"
    else
        echo "   ❌ Download failed!"
        exit 1
    fi
fi

# Step 3: Extract model
echo ""
echo "📂 Extracting model..."
if [ -d "$MODEL_DIR" ] && [ "$(ls -A $MODEL_DIR 2>/dev/null)" ]; then
    echo "   ✅ Model already extracted"
    echo "   Contents:"
    ls -lh "$MODEL_DIR" | head -5
else
    echo "   Extracting (this may take 5-10 minutes)..."
    mkdir -p "$MODEL_DIR"
    tar -xzf "$TAR_FILE" -C "$MODEL_DIR" --strip-components=1 2>&1 | tail -5
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Extraction complete"
        echo "   Contents:"
        ls -lh "$MODEL_DIR" | head -5
        echo "   Total size:"
        du -sh "$MODEL_DIR"
    else
        echo "   ❌ Extraction failed!"
        exit 1
    fi
fi

# Step 4: Verify model files
echo ""
echo "🔍 Verifying model files..."
if [ -f "$MODEL_DIR/config.json" ] && [ -f "$MODEL_DIR/pytorch_model.bin" ] || [ -d "$MODEL_DIR/pytorch_model.bin.index.json" ]; then
    echo "   ✅ Model files verified"
    echo "   Key files found:"
    ls -lh "$MODEL_DIR"/*.json "$MODEL_DIR"/*.bin 2>/dev/null | head -5 || true
else
    echo "   ⚠️  Some model files may be missing"
    echo "   Listing all files:"
    ls -la "$MODEL_DIR" | head -10
fi

echo ""
echo "✅ Model Setup Complete!"
echo "============================================"
echo "Model location: $MODEL_DIR"
echo "Ready for API to load!"

