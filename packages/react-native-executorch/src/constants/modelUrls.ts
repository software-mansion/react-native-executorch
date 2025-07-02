import { Platform } from 'react-native';

const BASE_URL_PREFIX =
  'https://huggingface.co/software-mansion/react-native-executorch';
const VERSION_TAG = 'resolve/v0.4.0';
const NEXT_DEV_VERSION_TAG = 'resolve/v0.5.0';

const isIOS = Platform.OS === `ios`;

// LLM`s

const LLAMA3_2_MODEL_NAME = 'llama-3.2';
const LLAMA3_2_3B_MODEL = `${BASE_URL_PREFIX}-${LLAMA3_2_MODEL_NAME}/${VERSION_TAG}/llama-3.2-3B/original/llama3_2_3B_bf16.pte`;
const LLAMA3_2_3B_QLORA_MODEL = `${BASE_URL_PREFIX}-${LLAMA3_2_MODEL_NAME}/${VERSION_TAG}/llama-3.2-3B/QLoRA/llama3_2-3B_qat_lora.pte`;
const LLAMA3_2_3B_SPINQUANT_MODEL = `${BASE_URL_PREFIX}-${LLAMA3_2_MODEL_NAME}/${VERSION_TAG}/llama-3.2-3B/spinquant/llama3_2_3B_spinquant.pte`;
const LLAMA3_2_1B_MODEL = `${BASE_URL_PREFIX}-${LLAMA3_2_MODEL_NAME}/${VERSION_TAG}/llama-3.2-1B/original/llama3_2_bf16.pte`;
const LLAMA3_2_1B_QLORA_MODEL = `${BASE_URL_PREFIX}-${LLAMA3_2_MODEL_NAME}/${VERSION_TAG}/llama-3.2-1B/QLoRA/llama3_2_qat_lora.pte`;
const LLAMA3_2_1B_SPINQUANT_MODEL = `${BASE_URL_PREFIX}-${LLAMA3_2_MODEL_NAME}/${VERSION_TAG}/llama-3.2-1B/spinquant/llama3_2_spinquant.pte`;
const LLAMA3_2_TOKENIZER = `${BASE_URL_PREFIX}-${LLAMA3_2_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;
const LLAMA3_2_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-${LLAMA3_2_MODEL_NAME}/${VERSION_TAG}/tokenizer_config.json`;

export const LLAMA3_2_3B = {
  modelSource: LLAMA3_2_3B_MODEL,
  tokenizer: LLAMA3_2_TOKENIZER,
  tokenizerConfig: LLAMA3_2_TOKENIZER_CONFIG
};

export const LLAMA3_2_3B_QLORA = {
  modelSource: LLAMA3_2_3B_QLORA_MODEL,
  tokenizer: LLAMA3_2_TOKENIZER,
  tokenizerConfig: LLAMA3_2_TOKENIZER_CONFIG
};

export const LLAMA3_2_3B_SPINQUANT = {
  modelSource: LLAMA3_2_3B_SPINQUANT_MODEL,
  tokenizer: LLAMA3_2_TOKENIZER,
  tokenizerConfig: LLAMA3_2_TOKENIZER_CONFIG
};

export const LLAMA3_2_1B = {
  modelSource: LLAMA3_2_1B_MODEL,
  tokenizer: LLAMA3_2_TOKENIZER,
  tokenizerConfig: LLAMA3_2_TOKENIZER_CONFIG
};

export const LLAMA3_2_1B_QLORA = {
  modelSource: LLAMA3_2_1B_QLORA_MODEL,
  tokenizer: LLAMA3_2_TOKENIZER,
  tokenizerConfig: LLAMA3_2_TOKENIZER_CONFIG
};

export const LLAMA3_2_1B_SPINQUANT = {
  modelSource: LLAMA3_2_1B_SPINQUANT_MODEL,
  tokenizer: LLAMA3_2_TOKENIZER,
  tokenizerConfig: LLAMA3_2_TOKENIZER_CONFIG
};

const QWEN3_MODEL_NAME = 'qwen-3';
const QWEN3_0_6B_MODEL = `${BASE_URL_PREFIX}-${QWEN3_MODEL_NAME}/${VERSION_TAG}/qwen-3-0.6B/original/qwen3_0_6b_bf16.pte`;
const QWEN3_0_6B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${QWEN3_MODEL_NAME}/${VERSION_TAG}/qwen-3-0.6B/quantized/qwen3_0_6b_8da4w.pte`;
const QWEN3_1_7B_MODEL = `${BASE_URL_PREFIX}-${QWEN3_MODEL_NAME}/${VERSION_TAG}/qwen-3-1.7B/original/qwen3_1_7b_bf16.pte`;
const QWEN3_1_7B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${QWEN3_MODEL_NAME}/${VERSION_TAG}/qwen-3-1.7B/quantized/qwen3_1_7b_8da4w.pte`;
const QWEN3_4B_MODEL = `${BASE_URL_PREFIX}-${QWEN3_MODEL_NAME}/${VERSION_TAG}/qwen-3-4B/original/qwen3_4b_bf16.pte`;
const QWEN3_4B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${QWEN3_MODEL_NAME}/${VERSION_TAG}/qwen-3-4B/quantized/qwen3_4b_8da4w.pte`;
const QWEN3_TOKENIZER = `${BASE_URL_PREFIX}-${QWEN3_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;
const QWEN3_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-${QWEN3_MODEL_NAME}/${VERSION_TAG}/tokenizer_config.json`;

export const QWEN3_0_6B = {
  modelSource: QWEN3_0_6B_MODEL,
  tokenizer: QWEN3_TOKENIZER,
  tokenizerConfig: QWEN3_TOKENIZER_CONFIG
};

export const QWEN3_0_6B_QUANTIZED = {
  modelSource: QWEN3_0_6B_QUANTIZED_MODEL,
  tokenizer: QWEN3_TOKENIZER,
  tokenizerConfig: QWEN3_TOKENIZER_CONFIG
};

export const QWEN3_1_7B = {
  modelSource: QWEN3_1_7B_MODEL,
  tokenizer: QWEN3_TOKENIZER,
  tokenizerConfig: QWEN3_TOKENIZER_CONFIG
};

export const QWEN3_1_7B_QUANTIZED = {
  modelSource: QWEN3_1_7B_QUANTIZED_MODEL,
  tokenizer: QWEN3_TOKENIZER,
  tokenizerConfig: QWEN3_TOKENIZER_CONFIG
};

export const QWEN3_4B = {
  modelSource: QWEN3_4B_MODEL,
  tokenizer: QWEN3_TOKENIZER,
  tokenizerConfig: QWEN3_TOKENIZER_CONFIG
};

export const QWEN3_4B_QUANTIZED = {
  modelSource: QWEN3_4B_QUANTIZED_MODEL,
  tokenizer: QWEN3_TOKENIZER,
  tokenizerConfig: QWEN3_TOKENIZER_CONFIG
};

const HAMMER2_1_MODEL_NAME = 'hammer-2.1';
const HAMMER2_1_0_5B_MODEL = `${BASE_URL_PREFIX}-${HAMMER2_1_MODEL_NAME}/${VERSION_TAG}/hammer-2.1-0.5B/original/hammer2_1_0_5B_bf16.pte`;
const HAMMER2_1_0_5B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${HAMMER2_1_MODEL_NAME}/${VERSION_TAG}/hammer-2.1-0.5B/quantized/hammer2_1_0_5B_8da4w.pte`;
const HAMMER2_1_1_5B_MODEL = `${BASE_URL_PREFIX}-${HAMMER2_1_MODEL_NAME}/${VERSION_TAG}/hammer-2.1-1.5B/original/hammer2_1_1_5B_bf16.pte`;
const HAMMER2_1_1_5B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${HAMMER2_1_MODEL_NAME}/${VERSION_TAG}/hammer-2.1-1.5B/quantized/hammer2_1_1_5B_8da4w.pte`;
const HAMMER2_1_3B_MODEL = `${BASE_URL_PREFIX}-${HAMMER2_1_MODEL_NAME}/${VERSION_TAG}/hammer-2.1-3B/original/hammer2_1_3B_bf16.pte`;
const HAMMER2_1_3B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${HAMMER2_1_MODEL_NAME}/${VERSION_TAG}/hammer-2.1-3B/quantized/hammer2_1_3B_8da4w.pte`;
const HAMMER2_1_TOKENIZER = `${BASE_URL_PREFIX}-${HAMMER2_1_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;
const HAMMER2_1_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-${HAMMER2_1_MODEL_NAME}/${VERSION_TAG}/tokenizer_config.json`;

export const HAMMER2_1_0_5B = {
  modelSource: HAMMER2_1_0_5B_MODEL,
  tokenizer: HAMMER2_1_TOKENIZER,
  tokenizerConfig: HAMMER2_1_TOKENIZER_CONFIG
};

export const HAMMER2_1_0_5B_QUANTIZED = {
  modelSource: HAMMER2_1_0_5B_QUANTIZED_MODEL,
  tokenizer: HAMMER2_1_TOKENIZER,
  tokenizerConfig: HAMMER2_1_TOKENIZER_CONFIG
};

export const HAMMER2_1_1_5B = {
  modelSource: HAMMER2_1_1_5B_MODEL,
  tokenizer: HAMMER2_1_TOKENIZER,
  tokenizerConfig: HAMMER2_1_TOKENIZER_CONFIG
};

export const HAMMER2_1_1_5B_QUANTIZED = {
  modelSource: HAMMER2_1_1_5B_QUANTIZED_MODEL,
  tokenizer: HAMMER2_1_TOKENIZER,
  tokenizerConfig: HAMMER2_1_TOKENIZER_CONFIG
};

export const HAMMER2_1_3B = {
  modelSource: HAMMER2_1_3B_MODEL,
  tokenizer: HAMMER2_1_TOKENIZER,
  tokenizerConfig: HAMMER2_1_TOKENIZER_CONFIG
};

export const HAMMER2_1_3B_QUANTIZED = {
  modelSource: HAMMER2_1_3B_QUANTIZED_MODEL,
  tokenizer: HAMMER2_1_TOKENIZER,
  tokenizerConfig: HAMMER2_1_TOKENIZER_CONFIG
};

const SMOLLM2_MODEL_NAME = 'smolLm-2';
const SMOLLM2_1_135M_MODEL = `${BASE_URL_PREFIX}-${SMOLLM2_MODEL_NAME}/${VERSION_TAG}/smolLm-2-135M/original/smolLm2_135M_bf16.pte`;
const SMOLLM2_1_135M_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${SMOLLM2_MODEL_NAME}/${VERSION_TAG}/smolLm-2-135M/quantized/smolLm2_135M_8da4w.pte`;
const SMOLLM2_1_360M_MODEL = `${BASE_URL_PREFIX}-${SMOLLM2_MODEL_NAME}/${VERSION_TAG}/smolLm-2-360M/original/smolLm2_360M_bf16.pte`;
const SMOLLM2_1_360M_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${SMOLLM2_MODEL_NAME}/${VERSION_TAG}/smolLm-2-360M/quantized/smolLm2_360M_8da4w.pte`;
const SMOLLM2_1_1_7B_MODEL = `${BASE_URL_PREFIX}-${SMOLLM2_MODEL_NAME}/${VERSION_TAG}/smolLm-2-1.7B/original/smolLm2_1_7B_bf16.pte`;
const SMOLLM2_1_1_7B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${SMOLLM2_MODEL_NAME}/${VERSION_TAG}/smolLm-2-1.7B/quantized/smolLm2_1_7B_8da4w.pte`;
const SMOLLM2_1_TOKENIZER = `${BASE_URL_PREFIX}-${SMOLLM2_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;
const SMOLLM2_1_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-${SMOLLM2_MODEL_NAME}/${VERSION_TAG}/tokenizer_config.json`;

export const SMOLLM2_1_135M = {
  modelSource: SMOLLM2_1_135M_MODEL,
  tokenizer: SMOLLM2_1_TOKENIZER,
  tokenizerConfig: SMOLLM2_1_TOKENIZER_CONFIG
};

export const SMOLLM2_1_135M_QUANTIZED = {
  modelSource: SMOLLM2_1_135M_QUANTIZED_MODEL,
  tokenizer: SMOLLM2_1_TOKENIZER,
  tokenizerConfig: SMOLLM2_1_TOKENIZER_CONFIG
};

export const SMOLLM2_1_360M = {
  modelSource: SMOLLM2_1_360M_MODEL,
  tokenizer: SMOLLM2_1_TOKENIZER,
  tokenizerConfig: SMOLLM2_1_TOKENIZER_CONFIG
};

export const SMOLLM2_1_360M_QUANTIZED = {
  modelSource: SMOLLM2_1_360M_QUANTIZED_MODEL,
  tokenizer: SMOLLM2_1_TOKENIZER,
  tokenizerConfig: SMOLLM2_1_TOKENIZER_CONFIG
};

export const SMOLLM2_1_1_7B = {
  modelSource: SMOLLM2_1_1_7B_MODEL,
  tokenizer: SMOLLM2_1_TOKENIZER,
  tokenizerConfig: SMOLLM2_1_TOKENIZER_CONFIG
};

export const SMOLLM2_1_1_7B_QUANTIZED = {
  modelSource: SMOLLM2_1_1_7B_QUANTIZED_MODEL,
  tokenizer: SMOLLM2_1_TOKENIZER,
  tokenizerConfig: SMOLLM2_1_TOKENIZER_CONFIG
};

const QWEN2_5_MODEL_NAME = 'qwen-2.5';
const QWEN2_5_0_5B_MODEL = `${BASE_URL_PREFIX}-${QWEN2_5_MODEL_NAME}/${VERSION_TAG}/qwen-2.5-0.5B/original/qwen2_5_0_5b_bf16.pte`;
const QWEN2_5_0_5B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${QWEN2_5_MODEL_NAME}/${VERSION_TAG}/qwen-2.5-0.5B/quantized/qwen2_5_0_5b_8da4w.pte`;
const QWEN2_5_1_5B_MODEL = `${BASE_URL_PREFIX}-${QWEN2_5_MODEL_NAME}/${VERSION_TAG}/qwen-2.5-1.5B/original/qwen2_5_1_5b_bf16.pte`;
const QWEN2_5_1_5B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${QWEN2_5_MODEL_NAME}/${VERSION_TAG}/qwen-2.5-1.5B/quantized/qwen2_5_1_5b_8da4w.pte`;
const QWEN2_5_3B_MODEL = `${BASE_URL_PREFIX}-${QWEN2_5_MODEL_NAME}/${VERSION_TAG}/qwen-2.5-3B/original/qwen2_5_3b_bf16.pte`;
const QWEN2_5_3B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${QWEN2_5_MODEL_NAME}/${VERSION_TAG}/qwen-2.5-3B/quantized/qwen2_5_3b_8da4w.pte`;
const QWEN2_5_TOKENIZER = `${BASE_URL_PREFIX}-${QWEN2_5_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;
const QWEN2_5_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-${QWEN2_5_MODEL_NAME}/${VERSION_TAG}/tokenizer_config.json`;

export const QWEN2_5_0_5B = {
  modelSource: QWEN2_5_0_5B_MODEL,
  tokenizer: QWEN2_5_TOKENIZER,
  tokenizerConfig: QWEN2_5_TOKENIZER_CONFIG
};

export const QWEN2_5_0_5B_QUANTIZED = {
  modelSource: QWEN2_5_0_5B_QUANTIZED_MODEL,
  tokenizer: QWEN2_5_TOKENIZER,
  tokenizerConfig: QWEN2_5_TOKENIZER_CONFIG
};

export const QWEN2_5_1_5B = {
  modelSource: QWEN2_5_1_5B_MODEL,
  tokenizer: QWEN2_5_TOKENIZER,
  tokenizerConfig: QWEN2_5_TOKENIZER_CONFIG
};

export const QWEN2_5_1_5B_QUANTIZED = {
  modelSource: QWEN2_5_1_5B_QUANTIZED_MODEL,
  tokenizer: QWEN2_5_TOKENIZER,
  tokenizerConfig: QWEN2_5_TOKENIZER_CONFIG
};

export const QWEN2_5_3B = {
  modelSource: QWEN2_5_3B_MODEL,
  tokenizer: QWEN2_5_TOKENIZER,
  tokenizerConfig: QWEN2_5_TOKENIZER_CONFIG
};

export const QWEN2_5_3B_QUANTIZED = {
  modelSource: QWEN2_5_3B_QUANTIZED_MODEL,
  tokenizer: QWEN2_5_TOKENIZER,
  tokenizerConfig: QWEN2_5_TOKENIZER_CONFIG
};

const PHI_4_MINI_MODEL_NAME = 'phi-4-mini';
const PHI_4_MINI_4B_MODEL = `${BASE_URL_PREFIX}-${PHI_4_MINI_MODEL_NAME}/${VERSION_TAG}/original/phi-4-mini_bf16.pte`;
const PHI_4_MINI_4B_QUANTIZED_MODEL = `${BASE_URL_PREFIX}-${PHI_4_MINI_MODEL_NAME}/${VERSION_TAG}/quantized/phi-4-mini_8da4w.pte`;
const PHI_4_MINI_TOKENIZER = `${BASE_URL_PREFIX}-${PHI_4_MINI_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;
const PHI_4_MINI_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-${PHI_4_MINI_MODEL_NAME}/${VERSION_TAG}/tokenizer_config.json`;

export const PHI_4_MINI_4B = {
  modelSource: PHI_4_MINI_4B_MODEL,
  tokenizer: PHI_4_MINI_TOKENIZER,
  tokenizerConfig: PHI_4_MINI_TOKENIZER_CONFIG
};

export const PHI_4_MINI_4B_QUANTIZED = {
  modelSource: PHI_4_MINI_4B_QUANTIZED_MODEL,
  tokenizer: PHI_4_MINI_TOKENIZER,
  tokenizerConfig: PHI_4_MINI_TOKENIZER
};

// Classification
const EFFICIENTNET_V2_S_MODEL_NAME = 'efficientnet-v2-s';
export const EFFICIENTNET_V2_S = isIOS
  ? `${BASE_URL_PREFIX}-${EFFICIENTNET_V2_S_MODEL_NAME}/${VERSION_TAG}/coreml/efficientnet_v2_s_coreml_all.pte`
  : `${BASE_URL_PREFIX}-${EFFICIENTNET_V2_S_MODEL_NAME}/${VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack.pte`;

// Object detection
const SSDLITE_320_MOBILENET_V3_LARGE_MODEL_NAME = 'ssdlite320-mobilenet-v3-large';
export const SSDLITE_320_MOBILENET_V3_LARGE = `${BASE_URL_PREFIX}-${SSDLITE_320_MOBILENET_V3_LARGE_MODEL_NAME}/${VERSION_TAG}/ssdlite320-mobilenetv3-large.pte`;

// Style transfer
const STYLE_TRANSFER_CANDY_MODEL_NAME = 'style-transfer-candy';
export const STYLE_TRANSFER_CANDY = isIOS
  ? `${BASE_URL_PREFIX}-${STYLE_TRANSFER_CANDY_MODEL_NAME}/${VERSION_TAG}/coreml/style_transfer_candy_coreml.pte`
  : `${BASE_URL_PREFIX}-${STYLE_TRANSFER_CANDY_MODEL_NAME}/${VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack.pte`;

const STYLE_TRANSFER_MOSAIC_MODEL_NAME = 'style-transfer-mosaic';
export const STYLE_TRANSFER_MOSAIC = isIOS
  ? `${BASE_URL_PREFIX}-${STYLE_TRANSFER_MOSAIC_MODEL_NAME}/${VERSION_TAG}/coreml/style_transfer_mosaic_coreml.pte`
  : `${BASE_URL_PREFIX}-${STYLE_TRANSFER_MOSAIC_MODEL_NAME}/${VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack.pte`;

const STYLE_TRANSFER_RAIN_PRINCESS_MODEL_NAME = 'style-transfer-rain-princess';
export const STYLE_TRANSFER_RAIN_PRINCESS = isIOS
  ? `${BASE_URL_PREFIX}-${STYLE_TRANSFER_RAIN_PRINCESS_MODEL_NAME}/${VERSION_TAG}/coreml/style_transfer_rain_princess_coreml.pte`
  : `${BASE_URL_PREFIX}-${STYLE_TRANSFER_RAIN_PRINCESS_MODEL_NAME}/${VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack.pte`;

const STYLE_TRANSFER_UDNIE_MODEL_NAME = 'style-transfer-udnie';
export const STYLE_TRANSFER_UDNIE = isIOS
  ? `${BASE_URL_PREFIX}-${STYLE_TRANSFER_UDNIE_MODEL_NAME}/${VERSION_TAG}/coreml/style_transfer_udnie_coreml.pte`
  : `${BASE_URL_PREFIX}-${STYLE_TRANSFER_UDNIE_MODEL_NAME}/${VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack.pte`;

// S2T
const MOONSHINE_TINY_MODEL_NAME = 'moonshine-tiny';
const MOONSHINE_TINY_ENCODER = `${BASE_URL_PREFIX}-${MOONSHINE_TINY_MODEL_NAME}/${VERSION_TAG}/xnnpack/moonshine_tiny_xnnpack_encoder.pte`;
const MOONSHINE_TINY_DECODER = `${BASE_URL_PREFIX}-${MOONSHINE_TINY_MODEL_NAME}/${VERSION_TAG}/xnnpack/moonshine_tiny_xnnpack_decoder.pte`;
const MOONSHINE_TOKENIZER = `${BASE_URL_PREFIX}-${MOONSHINE_TINY_MODEL_NAME}/${VERSION_TAG}/moonshine_tiny_tokenizer.json`;

export const MOONSHINE_TINY = {
  encoder: MOONSHINE_TINY_ENCODER,
  decoder: MOONSHINE_TINY_DECODER,
  tokenizer: MOONSHINE_TOKENIZER
};

const WHISPER_TINY_MODEL_NAME = 'whisper-tiny.en';
const WHISPER_TINY_ENCODER = `${BASE_URL_PREFIX}-${WHISPER_TINY_MODEL_NAME}/${VERSION_TAG}/xnnpack/whisper_tiny_en_xnnpack_encoder.pte`;
const WHISPER_TINY_DECODER = `${BASE_URL_PREFIX}-${WHISPER_TINY_MODEL_NAME}/${VERSION_TAG}/xnnpack/whisper_tiny_en_xnnpack_decoder.pte`;
const WHISPER_TOKENIZER = `${BASE_URL_PREFIX}-${WHISPER_TINY_MODEL_NAME}/${VERSION_TAG}/whisper_tokenizer.json`;

export const WHISPER_TINY = {
  encoder: WHISPER_TINY_ENCODER,
  decoder: WHISPER_TINY_DECODER,
  tokenizer: WHISPER_TOKENIZER
};

const WHISPER_TINY_MULTILINGUAL_MODEL_NAME = 'whisper-tiny';
const WHISPER_TINY_MULTILINGUAL_ENCODER = `${BASE_URL_PREFIX}-${WHISPER_TINY_MULTILINGUAL_MODEL_NAME}/${VERSION_TAG}/xnnpack/xnnpack_whisper_encoder.pte`;
const WHISPER_TINY_MULTILINGUAL_DECODER = `${BASE_URL_PREFIX}-${WHISPER_TINY_MULTILINGUAL_MODEL_NAME}/${VERSION_TAG}/xnnpack/xnnpack_whisper_decoder.pte`;
const WHISPER_TINY_MULTILINGUAL_TOKENIZER = `${BASE_URL_PREFIX}-${WHISPER_TINY_MULTILINGUAL_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;

export const WHISPER_TINY_MULTILINGUAL = {
  encoder: WHISPER_TINY_MULTILINGUAL_ENCODER,
  decoder: WHISPER_TINY_MULTILINGUAL_DECODER,
  tokenizer: WHISPER_TINY_MULTILINGUAL_TOKENIZER
};

// OCR
const DETECTOR_CRAFT_MODEL_NAME = 'detector-craft';
export const DETECTOR_CRAFT_1280 = `${BASE_URL_PREFIX}-${DETECTOR_CRAFT_MODEL_NAME}/${VERSION_TAG}/xnnpack/xnnpack_craft_1280.pte`;
export const DETECTOR_CRAFT_800 = `${BASE_URL_PREFIX}-${DETECTOR_CRAFT_MODEL_NAME}/${VERSION_TAG}/xnnpack/xnnpack_craft_800.pte`;
export const DETECTOR_CRAFT_320 = `${BASE_URL_PREFIX}-${DETECTOR_CRAFT_MODEL_NAME}/${VERSION_TAG}/xnnpack/xnnpack_craft_320.pte`;

// Image segmentation
const DEEPLAB_V3_MODEL_NAME = 'deeplab-v3';
export const DEEPLAB_V3_RESNET50 = `${BASE_URL_PREFIX}-${DEEPLAB_V3_MODEL_NAME}/${VERSION_TAG}/xnnpack/deeplabV3_xnnpack_fp32.pte`;

// Image Embeddings
const CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER_MODEL_NAME = 'clip-vit-base-patch32-image-encoder';
export const CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER_MODEL =
  `${BASE_URL_PREFIX}-${CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER_MODEL_NAME}/${NEXT_DEV_VERSION_TAG}/clip-vit-base-patch32-image-encoder-float32.pte`;

// Text Embeddings
const ALL_MINILM_L6_V2_MODEL_NAME = 'all-MiniLM-L6-v2';
const ALL_MINILM_L6_V2_MODEL = `${BASE_URL_PREFIX}-${ALL_MINILM_L6_V2_MODEL_NAME}/${VERSION_TAG}/all-MiniLM-L6-v2_xnnpack.pte`;
const ALL_MINILM_L6_V2_TOKENIZER = `${BASE_URL_PREFIX}-${ALL_MINILM_L6_V2_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;

export const ALL_MINILM_L6_V2 = {
  modelSource: ALL_MINILM_L6_V2_MODEL,
  tokenizerSource: ALL_MINILM_L6_V2_TOKENIZER,
  meanPooling: false,
};

const ALL_MPNET_BASE_V2_MODEL_NAME = 'all-mpnet-base-v2';
const ALL_MPNET_BASE_V2_MODEL = `${BASE_URL_PREFIX}-${ALL_MPNET_BASE_V2_MODEL_NAME}/${VERSION_TAG}/all-mpnet-base-v2_xnnpack.pte`;
const ALL_MPNET_BASE_V2_TOKENIZER = `${BASE_URL_PREFIX}-${ALL_MPNET_BASE_V2_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;

export const ALL_MPNET_BASE_V2 = {
  modelSource: ALL_MPNET_BASE_V2_MODEL,
  tokenizerSource: ALL_MPNET_BASE_V2_TOKENIZER,
  meanPooling: false,
};

const MULTI_QA_MINILM_L6_COS_V1_MODEL_NAME = 'multi-qa-MiniLM-L6-cos-v1';
const MULTI_QA_MINILM_L6_COS_V1_MODEL = `${BASE_URL_PREFIX}-${MULTI_QA_MINILM_L6_COS_V1_MODEL_NAME}/${VERSION_TAG}/multi-qa-MiniLM-L6-cos-v1_xnnpack.pte`;
const MULTI_QA_MINILM_L6_COS_V1_TOKENIZER = `${BASE_URL_PREFIX}-${MULTI_QA_MINILM_L6_COS_V1_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;

export const MULTI_QA_MINILM_L6_COS_V1 = {
  modelSource: MULTI_QA_MINILM_L6_COS_V1_MODEL,
  tokenizerSource: MULTI_QA_MINILM_L6_COS_V1_TOKENIZER,
  meanPooling: false,
};

const MULTI_QA_MPNET_BASE_DOT_V1_MODEL_NAME = 'multi-qa-mpnet-base-dot-v1';
const MULTI_QA_MPNET_BASE_DOT_V1_MODEL = `${BASE_URL_PREFIX}-${MULTI_QA_MPNET_BASE_DOT_V1_MODEL_NAME}/${VERSION_TAG}/multi-qa-mpnet-base-dot-v1_xnnpack.pte`;
const MULTI_QA_MPNET_BASE_DOT_V1_TOKENIZER = `${BASE_URL_PREFIX}-${MULTI_QA_MPNET_BASE_DOT_V1_MODEL_NAME}/${VERSION_TAG}/tokenizer.json`;

export const MULTI_QA_MPNET_BASE_DOT_V1 = {
  modelSource: MULTI_QA_MPNET_BASE_DOT_V1_MODEL,
  tokenizerSource: MULTI_QA_MPNET_BASE_DOT_V1_TOKENIZER,
  meanPooling: false,
};

const CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER_MODEL_NAME = 'clip-vit-base-patch32-text-encoder';
export const CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER_MODEL =
  `${BASE_URL_PREFIX}-${CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER_MODEL_NAME}/${NEXT_DEV_VERSION_TAG}/clip-vit-base-patch32-text-encoder-float32.pte`;
export const CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER_TOKENIZER =
  `${BASE_URL_PREFIX}-${CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER_MODEL_NAME}/${NEXT_DEV_VERSION_TAG}/tokenizer.json`;

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
