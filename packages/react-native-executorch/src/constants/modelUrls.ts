import { Platform } from 'react-native';

const BASE_URL_PREFIX =
  'https://huggingface.co/software-mansion/react-native-executorch';
const VERSION_TAG = 'resolve/v0.4.0';

// LLM`s

// LLAMA 3.2
export const LLAMA3_2_3B = `${BASE_URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-3B/original/llama3_2_3B_bf16.pte`;
export const LLAMA3_2_3B_QLORA = `${BASE_URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-3B/QLoRA/llama3_2-3B_qat_lora.pte`;
export const LLAMA3_2_3B_SPINQUANT = `${BASE_URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-3B/spinquant/llama3_2_3B_spinquant.pte`;
export const LLAMA3_2_1B = `${BASE_URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-1B/original/llama3_2_bf16.pte`;
export const LLAMA3_2_1B_QLORA = `${BASE_URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-1B/QLoRA/llama3_2_qat_lora.pte`;
export const LLAMA3_2_1B_SPINQUANT = `${BASE_URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-1B/spinquant/llama3_2_spinquant.pte`;
export const LLAMA3_2_TOKENIZER = `${BASE_URL_PREFIX}-llama-3.2/${VERSION_TAG}/tokenizer.json`;
export const LLAMA3_2_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-llama-3.2/${VERSION_TAG}/tokenizer_config.json`;

// QWEN 3
export const QWEN3_0_6B = `${BASE_URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-0.6B/original/qwen3_0_6b_bf16.pte`;
export const QWEN3_0_6B_QUANTIZED = `${BASE_URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-0.6B/quantized/qwen3_0_6b_8da4w.pte`;
export const QWEN3_1_7B = `${BASE_URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-1.7B/original/qwen3_1_7b_bf16.pte`;
export const QWEN3_1_7B_QUANTIZED = `${BASE_URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-1.7B/quantized/qwen3_1_7b_8da4w.pte`;
export const QWEN3_4B = `${BASE_URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-4B/original/qwen3_4b_bf16.pte`;
export const QWEN3_4B_QUANTIZED = `${BASE_URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-4B/quantized/qwen3_4b_8da4w.pte`;
export const QWEN3_TOKENIZER = `${BASE_URL_PREFIX}-qwen-3/${VERSION_TAG}/tokenizer.json`;
export const QWEN3_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-qwen-3/${VERSION_TAG}/tokenizer_config.json`;

// HAMMER 2.1
export const HAMMER2_1_0_5B = `${BASE_URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-0.5B/original/hammer2_1_0_5B_bf16.pte`;
export const HAMMER2_1_0_5B_QUANTIZED = `${BASE_URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-0.5B/quantized/hammer2_1_0_5B_8da4w.pte`;
export const HAMMER2_1_1_5B = `${BASE_URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-1.5B/original/hammer2_1_1_5B_bf16.pte`;
export const HAMMER2_1_1_5B_QUANTIZED = `${BASE_URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-1.5B/quantized/hammer2_1_1_5B_8da4w.pte`;
export const HAMMER2_1_3B = `${BASE_URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-3B/original/hammer2_1_3B_bf16.pte`;
export const HAMMER2_1_3B_QUANTIZED = `${BASE_URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-3B/quantized/hammer2_1_3B_8da4w.pte`;
export const HAMMER2_1_TOKENIZER = `${BASE_URL_PREFIX}-hammer-2.1/${VERSION_TAG}/tokenizer.json`;
export const HAMMER2_1_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-hammer-2.1/${VERSION_TAG}/tokenizer_config.json`;

// SMOLLM2
export const SMOLLM2_1_135M = `${BASE_URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-135M/original/smolLm2_135M_bf16.pte`;
export const SMOLLM2_1_135M_QUANTIZED = `${BASE_URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-135M/quantized/smolLm2_135M_8da4w.pte`;
export const SMOLLM2_1_360M = `${BASE_URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-360M/original/smolLm2_360M_bf16.pte`;
export const SMOLLM2_1_360M_QUANTIZED = `${BASE_URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-360M/quantized/smolLm2_360M_8da4w.pte`;
export const SMOLLM2_1_1_7B = `${BASE_URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-1.7B/original/smolLm2_1_7B_bf16.pte`;
export const SMOLLM2_1_1_7B_QUANTIZED = `${BASE_URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-1.7B/quantized/smolLm2_1_7B_8da4w.pte`;
export const SMOLLM2_1_TOKENIZER = `${BASE_URL_PREFIX}-smolLm-2/${VERSION_TAG}/tokenizer.json`;
export const SMOLLM2_1_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-smolLm-2/${VERSION_TAG}/tokenizer_config.json`;

// QWEN 2.5
export const QWEN2_5_0_5B = `${BASE_URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-0.5B/original/qwen2_5_0_5b_bf16.pte`;
export const QWEN2_5_0_5B_QUANTIZED = `${BASE_URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-0.5B/quantized/qwen2_5_0_5b_8da4w.pte`;
export const QWEN2_5_1_5B = `${BASE_URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-1.5B/original/qwen2_5_1_5b_bf16.pte`;
export const QWEN2_5_1_5B_QUANTIZED = `${BASE_URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-1.5B/quantized/qwen2_5_1_5b_8da4w.pte`;
export const QWEN2_5_3B = `${BASE_URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-3B/original/qwen2_5_3b_bf16.pte`;
export const QWEN2_5_3B_QUANTIZED = `${BASE_URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-3B/quantized/qwen2_5_3b_8da4w.pte`;
export const QWEN2_5_TOKENIZER = `${BASE_URL_PREFIX}-qwen-2.5/${VERSION_TAG}/tokenizer.json`;
export const QWEN2_5_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-qwen-2.5/${VERSION_TAG}/tokenizer_config.json`;

// PHI 4
export const PHI_4_MINI_4B = `${BASE_URL_PREFIX}-phi-4-mini/${VERSION_TAG}/original/phi-4-mini_bf16.pte`;
export const PHI_4_MINI_4B_QUANTIZED = `${BASE_URL_PREFIX}-phi-4-mini/${VERSION_TAG}/quantized/phi-4-mini_8da4w.pte`;
export const PHI_4_MINI_TOKENIZER = `${BASE_URL_PREFIX}-phi-4-mini/${VERSION_TAG}/tokenizer.json`;
export const PHI_4_MINI_TOKENIZER_CONFIG = `${BASE_URL_PREFIX}-phi-4-mini/${VERSION_TAG}/tokenizer_config.json`;

// Classification
export const EFFICIENTNET_V2_S =
  Platform.OS === `ios`
    ? `${BASE_URL_PREFIX}-efficientnet-v2-s/${VERSION_TAG}/coreml/efficientnet_v2_s_coreml_all.pte`
    : `${BASE_URL_PREFIX}-efficientnet-v2-s/${VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack.pte`;

// Object detection
export const SSDLITE_320_MOBILENET_V3_LARGE = `${BASE_URL_PREFIX}-ssdlite320-mobilenet-v3-large/${VERSION_TAG}/ssdlite320-mobilenetv3-large.pte`;

// Style transfer
export const STYLE_TRANSFER_CANDY =
  Platform.OS === `ios`
    ? `${BASE_URL_PREFIX}-style-transfer-candy/${VERSION_TAG}/coreml/style_transfer_candy_coreml.pte`
    : `${BASE_URL_PREFIX}-style-transfer-candy/${VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack.pte`;
export const STYLE_TRANSFER_MOSAIC =
  Platform.OS === `ios`
    ? `${BASE_URL_PREFIX}-style-transfer-mosaic/${VERSION_TAG}/coreml/style_transfer_mosaic_coreml.pte`
    : `${BASE_URL_PREFIX}-style-transfer-mosaic/${VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack.pte`;
export const STYLE_TRANSFER_RAIN_PRINCESS =
  Platform.OS === `ios`
    ? `${BASE_URL_PREFIX}-style-transfer-rain-princess/${VERSION_TAG}/coreml/style_transfer_rain_princess_coreml.pte`
    : `${BASE_URL_PREFIX}-style-transfer-rain-princess/${VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack.pte`;
export const STYLE_TRANSFER_UDNIE =
  Platform.OS === `ios`
    ? `${BASE_URL_PREFIX}-style-transfer-udnie/${VERSION_TAG}/coreml/style_transfer_udnie_coreml.pte`
    : `${BASE_URL_PREFIX}-style-transfer-udnie/${VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack.pte`;

// S2T
export const MOONSHINE_TINY_DECODER = `${BASE_URL_PREFIX}-moonshine-tiny/${VERSION_TAG}/xnnpack/moonshine_tiny_xnnpack_decoder.pte`;
export const MOONSHINE_TINY_ENCODER = `${BASE_URL_PREFIX}-moonshine-tiny/${VERSION_TAG}/xnnpack/moonshine_tiny_xnnpack_encoder.pte`;
export const MOONSHINE_TOKENIZER = `${BASE_URL_PREFIX}-moonshine-tiny/${VERSION_TAG}/moonshine_tiny_tokenizer.json`;
export const WHISPER_TOKENIZER = `${BASE_URL_PREFIX}-whisper-tiny.en/${VERSION_TAG}/whisper_tokenizer.json`;
export const WHISPER_TINY_DECODER = `${BASE_URL_PREFIX}-whisper-tiny.en/${VERSION_TAG}/xnnpack/whisper_tiny_en_xnnpack_decoder.pte`;
export const WHISPER_TINY_ENCODER = `${BASE_URL_PREFIX}-whisper-tiny.en/${VERSION_TAG}/xnnpack/whisper_tiny_en_xnnpack_encoder.pte`;
export const WHISPER_TINY_MULTILINGUAL_ENCODER = `${BASE_URL_PREFIX}-whisper-tiny/${VERSION_TAG}/xnnpack/xnnpack_whisper_encoder.pte`;
export const WHISPER_TINY_MULTILINGUAL_DECODER = `${BASE_URL_PREFIX}-whisper-tiny/${VERSION_TAG}/xnnpack/xnnpack_whisper_decoder.pte`;
export const WHISPER_TINY_MULTILINGUAL_TOKENIZER = `${BASE_URL_PREFIX}-whisper-tiny/${VERSION_TAG}/tokenizer.json`;

// OCR
export const DETECTOR_CRAFT_1280 = `${BASE_URL_PREFIX}-detector-craft/${VERSION_TAG}/xnnpack/xnnpack_craft_1280.pte`;
export const DETECTOR_CRAFT_800 = `${BASE_URL_PREFIX}-detector-craft/${VERSION_TAG}/xnnpack/xnnpack_craft_800.pte`;
export const DETECTOR_CRAFT_320 = `${BASE_URL_PREFIX}-detector-craft/${VERSION_TAG}/xnnpack/xnnpack_craft_320.pte`;

// Image segmentation
export const DEEPLAB_V3_RESNET50 = `${BASE_URL_PREFIX}-deeplab-v3/${VERSION_TAG}/xnnpack/deeplabV3_xnnpack_fp32.pte`;

// Image Embeddings
export const CLIP_VIT_BASE_PATCH32_IMAGE_MODEL =
  'https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/resolve/v0.5.0/clip-vit-base-patch32-vision_xnnpack.pte';

// Text Embeddings
export const ALL_MINILM_L6_V2 = `${BASE_URL_PREFIX}-all-MiniLM-L6-v2/${VERSION_TAG}/all-MiniLM-L6-v2_xnnpack.pte`;
export const ALL_MINILM_L6_V2_TOKENIZER = `${BASE_URL_PREFIX}-all-MiniLM-L6-v2/${VERSION_TAG}/tokenizer.json`;

export const ALL_MPNET_BASE_V2 = `${BASE_URL_PREFIX}-all-mpnet-base-v2/${VERSION_TAG}/all-mpnet-base-v2_xnnpack.pte`;
export const ALL_MPNET_BASE_V2_TOKENIZER = `${BASE_URL_PREFIX}-all-mpnet-base-v2/${VERSION_TAG}/tokenizer.json`;

export const MULTI_QA_MINILM_L6_COS_V1 = `${BASE_URL_PREFIX}-multi-qa-MiniLM-L6-cos-v1/${VERSION_TAG}/multi-qa-MiniLM-L6-cos-v1_xnnpack.pte`;
export const MULTI_QA_MINILM_L6_COS_V1_TOKENIZER = `${BASE_URL_PREFIX}-multi-qa-MiniLM-L6-cos-v1/${VERSION_TAG}/tokenizer.json`;

export const MULTI_QA_MPNET_BASE_DOT_V1 = `${BASE_URL_PREFIX}-multi-qa-mpnet-base-dot-v1/${VERSION_TAG}/multi-qa-mpnet-base-dot-v1_xnnpack.pte`;
export const MULTI_QA_MPNET_BASE_DOT_V1_TOKENIZER = `${BASE_URL_PREFIX}-multi-qa-mpnet-base-dot-v1/${VERSION_TAG}/tokenizer.json`;

export const CLIP_VIT_BASE_PATCH32_TEXT_MODEL =
  'https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/resolve/v0.5.0/clip-vit-base-patch32-text_xnnpack.pte';
export const CLIP_VIT_BASE_PATCH32_TEXT_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32/resolve/v0.5.0/tokenizer.json';

export const CLIP_VIT_BASE_PATCH32_TEXT = {
  modelSource: CLIP_VIT_BASE_PATCH32_TEXT_MODEL,
  tokenizerSource: CLIP_VIT_BASE_PATCH32_TEXT_TOKENIZER,
};

export const CLIP_VIT_BASE_PATCH32_IMAGE = {
  modelSource: CLIP_VIT_BASE_PATCH32_IMAGE_MODEL,
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
