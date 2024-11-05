#!/bin/bash

set -eu

# The quantized versions of LLaMa should cointain a quantization_args key in params.json
QUANTIZED=$(grep "lora_args" /model/params.json)

export_cmd="python -m examples.models.llama.export_llama \
    --checkpoint /model/consolidated.00.pth \
    --params /model/params.json \
    -kv \
    --use_sdpa_with_kv_cache \
    -X \
    -d bf16 \
    --metadata '{\"get_bos_id\":128000, \"get_eos_ids\":[128009, 128001]}' \
    --output_name=/outputs/llama3_2.pte"

if [ -n "$QUANTIZED" ]; then
    export_cmd="${export_cmd//-d bf16/-d fp32}"
    export_cmd+=" \
      -qat \
      -lora 16 \
      --preq_mode 8da4w_output_8da8w \
      --preq_group_size 32 \
      --max_seq_length 2048 \
      --xnnpack-extended-ops \
      --preq_embedding_quantize 8,0"
fi

if ! eval "$export_cmd"; then
    echo "Export script failed."
    echo "Please check the following potential issues:"
    echo "1. Your params.json file may be for quantized weights, but the weights you're using are not quantized."
    echo "2. Alternatively, if you're using quantized weights, ensure that your params.json contains the 'lora_args and quantization_args' key."
    exit 1
fi
