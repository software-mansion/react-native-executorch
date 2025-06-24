import { Platform } from 'react-native';

// LLM's

// LLAMA 3.2
export const LLAMA3_2_3B =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-3B/original/llama3_2_3B_bf16.pte';
export const LLAMA3_2_3B_QLORA =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-3B/QLoRA/llama3_2-3B_qat_lora.pte';
export const LLAMA3_2_3B_SPINQUANT =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-3B/spinquant/llama3_2_3B_spinquant.pte';
export const LLAMA3_2_1B =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-1B/original/llama3_2_bf16.pte';
export const LLAMA3_2_1B_QLORA =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-1B/QLoRA/llama3_2_qat_lora.pte';
export const LLAMA3_2_1B_SPINQUANT =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-1B/spinquant/llama3_2_spinquant.pte';
export const LLAMA3_2_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/tokenizer.json';
export const LLAMA3_2_TOKENIZER_CONFIG =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/tokenizer_config.json';

// QWEN 3
export const QWEN3_0_6B =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.4.0/qwen-3-0.6B/original/qwen3_0_6b_bf16.pte';
export const QWEN3_0_6B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.4.0/qwen-3-0.6B/quantized/qwen3_0_6b_8da4w.pte';
export const QWEN3_1_7B =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.4.0/qwen-3-1.7B/original/qwen3_1_7b_bf16.pte';
export const QWEN3_1_7B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.4.0/qwen-3-1.7B/quantized/qwen3_1_7b_8da4w.pte';
export const QWEN3_4B =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.4.0/qwen-3-4B/original/qwen3_4b_bf16.pte';
export const QWEN3_4B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.4.0/qwen-3-4B/quantized/qwen3_4b_8da4w.pte';
export const QWEN3_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.4.0/tokenizer.json';
export const QWEN3_TOKENIZER_CONFIG =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.4.0/tokenizer_config.json';

// HAMMER 2.1
export const HAMMER2_1_0_5B =
  'https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.4.0/hammer-2.1-0.5B/original/hammer2_1_0_5B_bf16.pte';
export const HAMMER2_1_0_5B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.4.0/hammer-2.1-0.5B/quantized/hammer2_1_0_5B_8da4w.pte';
export const HAMMER2_1_1_5B =
  'https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.4.0/hammer-2.1-1.5B/original/hammer2_1_1_5B_bf16.pte';
export const HAMMER2_1_1_5B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.4.0/hammer-2.1-1.5B/quantized/hammer2_1_1_5B_8da4w.pte';
export const HAMMER2_1_3B =
  'https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.4.0/hammer-2.1-3B/original/hammer2_1_3B_bf16.pte';
export const HAMMER2_1_3B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.4.0/hammer-2.1-3B/quantized/hammer2_1_3B_8da4w.pte';
export const HAMMER2_1_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.4.0/tokenizer.json';
export const HAMMER2_1_TOKENIZER_CONFIG =
  'https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1/resolve/v0.4.0/tokenizer_config.json';

// SMOLLM2
export const SMOLLM2_1_135M =
  'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.4.0/smolLm-2-135M/original/smolLm2_135M_bf16.pte';
export const SMOLLM2_1_135M_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.4.0/smolLm-2-135M/quantized/smolLm2_135M_8da4w.pte';
export const SMOLLM2_1_360M =
  'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.4.0/smolLm-2-360M/original/smolLm2_360M_bf16.pte';
export const SMOLLM2_1_360M_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.4.0/smolLm-2-360M/quantized/smolLm2_360M_8da4w.pte';
export const SMOLLM2_1_1_7B =
  'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.4.0/smolLm-2-1.7B/original/smolLm2_1_7B_bf16.pte';
export const SMOLLM2_1_1_7B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.4.0/smolLm-2-1.7B/quantized/smolLm2_1_7B_8da4w.pte';
export const SMOLLM2_1_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.4.0/tokenizer.json';
export const SMOLLM2_1_TOKENIZER_CONFIG =
  'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/v0.4.0/tokenizer_config.json';

// QWEN 2.5
export const QWEN2_5_0_5B =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.4.0/qwen-2.5-0.5B/original/qwen2_5_0_5b_bf16.pte';
export const QWEN2_5_0_5B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.4.0/qwen-2.5-0.5B/quantized/qwen2_5_0_5b_8da4w.pte';
export const QWEN2_5_1_5B =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.4.0/qwen-2.5-1.5B/original/qwen2_5_1_5b_bf16.pte';
export const QWEN2_5_1_5B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.4.0/qwen-2.5-1.5B/quantized/qwen2_5_1_5b_8da4w.pte';
export const QWEN2_5_3B =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.4.0/qwen-2.5-3B/original/qwen2_5_3b_bf16.pte';
export const QWEN2_5_3B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.4.0/qwen-2.5-3B/quantized/qwen2_5_3b_8da4w.pte';
export const QWEN2_5_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.4.0/tokenizer.json';
export const QWEN2_5_TOKENIZER_CONFIG =
  'https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5/resolve/v0.4.0/tokenizer_config.json';

// PHI 4
export const PHI_4_MINI_4B =
  'https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.4.0/original/phi-4-mini_bf16.pte';
export const PHI_4_MINI_4B_QUANTIZED =
  'https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.4.0/quantized/phi-4-mini_8da4w.pte';
export const PHI_4_MINI_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.4.0/tokenizer.json';
export const PHI_4_MINI_TOKENIZER_CONFIG =
  'https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini/resolve/v0.4.0/tokenizer_config.json';

// Classification
export const EFFICIENTNET_V2_S =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/resolve/v0.4.0/coreml/efficientnet_v2_s_coreml_all.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/resolve/v0.4.0/xnnpack/efficientnet_v2_s_xnnpack.pte';

// Object detection
export const SSDLITE_320_MOBILENET_V3_LARGE =
  'https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/resolve/v0.4.0/ssdlite320-mobilenetv3-large.pte';

// Style transfer
export const STYLE_TRANSFER_CANDY =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/v0.4.0/coreml/style_transfer_candy_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/v0.4.0/xnnpack/style_transfer_candy_xnnpack.pte';
export const STYLE_TRANSFER_MOSAIC =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-mosaic/resolve/v0.4.0/coreml/style_transfer_mosaic_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-mosaic/resolve/v0.4.0/xnnpack/style_transfer_mosaic_xnnpack.pte';
export const STYLE_TRANSFER_RAIN_PRINCESS =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-rain-princess/resolve/v0.4.0/coreml/style_transfer_rain_princess_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-rain-princess/resolve/v0.4.0/xnnpack/style_transfer_rain_princess_xnnpack.pte';
export const STYLE_TRANSFER_UDNIE =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-udnie/resolve/v0.4.0/coreml/style_transfer_udnie_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-udnie/resolve/v0.4.0/xnnpack/style_transfer_udnie_xnnpack.pte';

// S2T
export const MOONSHINE_TINY_DECODER =
  'https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny/resolve/v0.4.0/xnnpack/moonshine_tiny_xnnpack_decoder.pte';
export const MOONSHINE_TINY_ENCODER =
  'https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny/resolve/v0.4.0/xnnpack/moonshine_tiny_xnnpack_encoder.pte';
export const MOONSHINE_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny/resolve/v0.4.0/moonshine_tiny_tokenizer.json';
export const WHISPER_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.4.0/whisper_tokenizer.json';
export const WHISPER_TINY_DECODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.4.0/xnnpack/whisper_tiny_en_xnnpack_decoder.pte';
export const WHISPER_TINY_ENCODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.4.0/xnnpack/whisper_tiny_en_xnnpack_encoder.pte';
export const WHISPER_TINY_MULTILINGUAL_ENCODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny/resolve/v0.4.0/xnnpack/xnnpack_whisper_encoder.pte';
export const WHISPER_TINY_MULTILINGUAL_DECODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny/resolve/v0.4.0/xnnpack/xnnpack_whisper_decoder.pte';
export const WHISPER_TINY_MULTILINGUAL_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny/resolve/v0.4.0/tokenizer.json';

// OCR
export const DETECTOR_CRAFT_1280 =
  'https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.4.0/xnnpack/xnnpack_craft_1280.pte';
export const DETECTOR_CRAFT_800 =
  'https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.4.0/xnnpack/xnnpack_craft_800.pte';
export const DETECTOR_CRAFT_320 =
  'https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.4.0/xnnpack/xnnpack_craft_320.pte';

// Image segmentation
export const DEEPLAB_V3_RESNET50 =
  'https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.4.0/xnnpack/deeplabV3_xnnpack_fp32.pte';

// Image Embeddings
export const CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER_MODEL =
  'https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32-image-encoder/resolve/v0.5.0/clip-vit-base-patch32-image-encoder-float32.pte';

// Text Embeddings
export const ALL_MINILM_L6_V2 =
  'https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.4.0/all-MiniLM-L6-v2_xnnpack.pte';
export const ALL_MINILM_L6_V2_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.4.0/tokenizer.json';

export const ALL_MPNET_BASE_V2 =
  'https://huggingface.co/software-mansion/react-native-executorch-all-mpnet-base-v2/resolve/v0.4.0/all-mpnet-base-v2_xnnpack.pte';
export const ALL_MPNET_BASE_V2_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-all-mpnet-base-v2/resolve/v0.4.0/tokenizer.json';

export const MULTI_QA_MINILM_L6_COS_V1 =
  'https://huggingface.co/software-mansion/react-native-executorch-multi-qa-MiniLM-L6-cos-v1/resolve/v0.4.0/multi-qa-MiniLM-L6-cos-v1_xnnpack.pte';
export const MULTI_QA_MINILM_L6_COS_V1_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-multi-qa-MiniLM-L6-cos-v1/resolve/v0.4.0/tokenizer.json';

export const MULTI_QA_MPNET_BASE_DOT_V1 =
  'https://huggingface.co/software-mansion/react-native-executorch-multi-qa-mpnet-base-dot-v1/resolve/v0.4.0/multi-qa-mpnet-base-dot-v1_xnnpack.pte';
export const MULTI_QA_MPNET_BASE_DOT_V1_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-multi-qa-mpnet-base-dot-v1/resolve/v0.4.0/tokenizer.json';

export const CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER_MODEL =
  'https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32-text-encoder/resolve/v0.5.0/clip-vit-base-patch32-text-encoder-float32.pte';
export const CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32-text-encoder/resolve/v0.5.0/tokenizer.json';

export const CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER = {
  modelSource: CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER_MODEL,
  tokenizerSource: CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER_TOKENIZER,
  meanPooling: false,
};

// Backward compatibility
export const LLAMA3_2_3B_URL = LLAMA3_2_3B;
export const LLAMA3_2_3B_QLORA_URL = LLAMA3_2_3B_QLORA;
export const LLAMA3_2_3B_SPINQUANT_URL = LLAMA3_2_3B_SPINQUANT;
export const LLAMA3_2_1B_URL = LLAMA3_2_1B;
export const LLAMA3_2_1B_QLORA_URL = LLAMA3_2_1B_QLORA;
export const LLAMA3_2_1B_SPINQUANT_URL = LLAMA3_2_1B_SPINQUANT;
export const LLAMA3_2_1B_TOKENIZER = LLAMA3_2_TOKENIZER;
export const LLAMA3_2_3B_TOKENIZER = LLAMA3_2_TOKENIZER;
