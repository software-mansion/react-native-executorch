#!/bin/bash

set -eu

MODEL_PATH=""
PARAMS_PATH=""

REPO_ROOT=$(git rev-parse --show-toplevel) 
OUTPUT_PATH="$REPO_ROOT/llama_export/outputs"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --model-path)
            MODEL_PATH="${2%/}"
            shift 2
            ;;
        --params-path)
            PARAMS_PATH="${2%/}"
            shift 2
            ;;
        --output-path)
            OUTPUT_PATH="${2%/}"
            shift 2
            ;;
        *)
            echo "Unknown option: $1" >&2
            echo "Usage: $0 --model-path <path> --params-path <path> [--output-path <path>]"
            exit 1
            ;;
    esac
done

if [[ -z "$MODEL_PATH" || -z "$PARAMS_PATH" ]]; then
    echo "Error: --model-path, --params-path are required." >&2
    echo "Usage: $0 --model-path <path> --params-path <path> [--output-path <path>]"
    exit 1
fi

[ -f "$MODEL_PATH" ] || { echo "$MODEL_PATH is not a valid path! Make sure to pass a proper path to the model weights!" >&2; exit 1; }
[ -f "$PARAMS_PATH" ] || { echo "$PARAMS_PATH is not a valid path! Make sure to pass a proper path to the model parameters!" >&2; exit 1; }

# Temporarily, someday we'll pull from docker hub
IMAGE_TAG="executorch-llama-export-image"
docker build -t "$IMAGE_TAG" "$REPO_ROOT/llama_export/."

mkdir -p "$OUTPUT_PATH"

# The export_llama.sh from ./scripts is ran inside the docker container
docker run -v "$MODEL_PATH:/model/consolidated.00.pth" -v "$PARAMS_PATH:/model/params.json" -v "$OUTPUT_PATH:/outputs" $IMAGE_TAG 
