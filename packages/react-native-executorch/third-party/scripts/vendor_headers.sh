#!/bin/bash

# 1. Define paths
# Adjust these if your folder structure is different
SOURCE_DIR="third-party/executorch"
DEST_DIR="third-party/include"

# 2. Clean up old headers to ensure a fresh sync
echo "Cleaning $DEST_DIR..."
rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR/executorch"

echo "Syncing headers from $SOURCE_DIR..."

# 3. Copy ExecuTorch core headers
# We use rsync with filters to only grab .h and .hpp files while keeping the structure
rsync -amv --include='*/' --include='*.h' --include='*.hpp' --exclude='*' \
    "$SOURCE_DIR/runtime" \
    "$SOURCE_DIR/extension" \
    "$SOURCE_DIR/util" \
    "$DEST_DIR/executorch/"

# 4. Copy c10 utility headers (often nested in pytorch submodule)
# ExecuTorch depends on a subset of c10
PYTORCH_CORE_DIR="$SOURCE_DIR/third-party/pytorch"
if [ -d "$PYTORCH_CORE_DIR/c10" ]; then
    echo "Found c10 headers in PyTorch submodule, copying..."
    mkdir -p "$DEST_DIR/c10"
    rsync -amv --include='*/' --include='*.h' --include='*.hpp' --exclude='*' \
        "$PYTORCH_CORE_DIR/c10" \
        "$DEST_DIR/"
fi

echo "✅ Header vendoring complete!"
echo "Headers are now in the '$DEST_DIR' folder."