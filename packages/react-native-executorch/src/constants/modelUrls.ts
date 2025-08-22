import { Platform } from 'react-native';

const URL_PREFIX =
  'https://huggingface.co/software-mansion/react-native-executorch';
const VERSION_TAG = 'resolve/v0.5.0';

// LLMs

// LLAMA 3.2
const LLAMA3_2_3B_MODEL = `${URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-3B/original/llama3_2_3B_bf16.pte`;
const LLAMA3_2_3B_QLORA_MODEL = `${URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-3B/QLoRA/llama3_2-3B_qat_lora.pte`;
const LLAMA3_2_3B_SPINQUANT_MODEL = `${URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-3B/spinquant/llama3_2_3B_spinquant.pte`;
const LLAMA3_2_1B_MODEL = `${URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-1B/original/llama3_2_bf16.pte`;
const LLAMA3_2_1B_QLORA_MODEL = `${URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-1B/QLoRA/llama3_2_qat_lora.pte`;
const LLAMA3_2_1B_SPINQUANT_MODEL = `${URL_PREFIX}-llama-3.2/${VERSION_TAG}/llama-3.2-1B/spinquant/llama3_2_spinquant.pte`;
const LLAMA3_2_TOKENIZER = `${URL_PREFIX}-llama-3.2/${VERSION_TAG}/tokenizer.json`;
const LLAMA3_2_TOKENIZER_CONFIG = `${URL_PREFIX}-llama-3.2/${VERSION_TAG}/tokenizer_config.json`;

export const LLAMA3_2_3B = {
  modelSource: LLAMA3_2_3B_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
};

export const LLAMA3_2_3B_QLORA = {
  modelSource: LLAMA3_2_3B_QLORA_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
};

export const LLAMA3_2_3B_SPINQUANT = {
  modelSource: LLAMA3_2_3B_SPINQUANT_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
};

export const LLAMA3_2_1B = {
  modelSource: LLAMA3_2_1B_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
};

export const LLAMA3_2_1B_QLORA = {
  modelSource: LLAMA3_2_1B_QLORA_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
};

export const LLAMA3_2_1B_SPINQUANT = {
  modelSource: LLAMA3_2_1B_SPINQUANT_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
};

// QWEN 3
const QWEN3_0_6B_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-0.6B/original/qwen3_0_6b_bf16.pte`;
const QWEN3_0_6B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-0.6B/quantized/qwen3_0_6b_8da4w.pte`;
const QWEN3_1_7B_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-1.7B/original/qwen3_1_7b_bf16.pte`;
const QWEN3_1_7B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-1.7B/quantized/qwen3_1_7b_8da4w.pte`;
const QWEN3_4B_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-4B/original/qwen3_4b_bf16.pte`;
const QWEN3_4B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-4B/quantized/qwen3_4b_8da4w.pte`;
const QWEN3_TOKENIZER = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/tokenizer.json`;
const QWEN3_TOKENIZER_CONFIG = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/tokenizer_config.json`;

export const QWEN3_0_6B = {
  modelSource: QWEN3_0_6B_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
};

export const QWEN3_0_6B_QUANTIZED = {
  modelSource: QWEN3_0_6B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
};

export const QWEN3_1_7B = {
  modelSource: QWEN3_1_7B_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
};

export const QWEN3_1_7B_QUANTIZED = {
  modelSource: QWEN3_1_7B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
};

export const QWEN3_4B = {
  modelSource: QWEN3_4B_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
};

export const QWEN3_4B_QUANTIZED = {
  modelSource: QWEN3_4B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
};

// HAMMER 2.1
const HAMMER2_1_0_5B_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-0.5B/original/hammer2_1_0_5B_bf16.pte`;
const HAMMER2_1_0_5B_QUANTIZED_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-0.5B/quantized/hammer2_1_0_5B_8da4w.pte`;
const HAMMER2_1_1_5B_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-1.5B/original/hammer2_1_1_5B_bf16.pte`;
const HAMMER2_1_1_5B_QUANTIZED_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-1.5B/quantized/hammer2_1_1_5B_8da4w.pte`;
const HAMMER2_1_3B_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-3B/original/hammer2_1_3B_bf16.pte`;
const HAMMER2_1_3B_QUANTIZED_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-3B/quantized/hammer2_1_3B_8da4w.pte`;
const HAMMER2_1_TOKENIZER = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/tokenizer.json`;
const HAMMER2_1_TOKENIZER_CONFIG = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/tokenizer_config.json`;

export const HAMMER2_1_0_5B = {
  modelSource: HAMMER2_1_0_5B_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
};

export const HAMMER2_1_0_5B_QUANTIZED = {
  modelSource: HAMMER2_1_0_5B_QUANTIZED_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
};

export const HAMMER2_1_1_5B = {
  modelSource: HAMMER2_1_1_5B_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
};

export const HAMMER2_1_1_5B_QUANTIZED = {
  modelSource: HAMMER2_1_1_5B_QUANTIZED_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
};

export const HAMMER2_1_3B = {
  modelSource: HAMMER2_1_3B_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
};

export const HAMMER2_1_3B_QUANTIZED = {
  modelSource: HAMMER2_1_3B_QUANTIZED_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
};

// SMOLLM2
const SMOLLM2_1_135M_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-135M/original/smolLm2_135M_bf16.pte`;
const SMOLLM2_1_135M_QUANTIZED_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-135M/quantized/smolLm2_135M_8da4w.pte`;
const SMOLLM2_1_360M_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-360M/original/smolLm2_360M_bf16.pte`;
const SMOLLM2_1_360M_QUANTIZED_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-360M/quantized/smolLm2_360M_8da4w.pte`;
const SMOLLM2_1_1_7B_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-1.7B/original/smolLm2_1_7B_bf16.pte`;
const SMOLLM2_1_1_7B_QUANTIZED_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-1.7B/quantized/smolLm2_1_7B_8da4w.pte`;
const SMOLLM2_1_TOKENIZER = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/tokenizer.json`;
const SMOLLM2_1_TOKENIZER_CONFIG = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/tokenizer_config.json`;

export const SMOLLM2_1_135M = {
  modelSource: SMOLLM2_1_135M_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
};

export const SMOLLM2_1_135M_QUANTIZED = {
  modelSource: SMOLLM2_1_135M_QUANTIZED_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
};

export const SMOLLM2_1_360M = {
  modelSource: SMOLLM2_1_360M_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
};

export const SMOLLM2_1_360M_QUANTIZED = {
  modelSource: SMOLLM2_1_360M_QUANTIZED_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
};

export const SMOLLM2_1_1_7B = {
  modelSource: SMOLLM2_1_1_7B_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
};

export const SMOLLM2_1_1_7B_QUANTIZED = {
  modelSource: SMOLLM2_1_1_7B_QUANTIZED_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
};

// QWEN 2.5
const QWEN2_5_0_5B_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-0.5B/original/qwen2_5_0_5b_bf16.pte`;
const QWEN2_5_0_5B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-0.5B/quantized/qwen2_5_0_5b_8da4w.pte`;
const QWEN2_5_1_5B_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-1.5B/original/qwen2_5_1_5b_bf16.pte`;
const QWEN2_5_1_5B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-1.5B/quantized/qwen2_5_1_5b_8da4w.pte`;
const QWEN2_5_3B_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-3B/original/qwen2_5_3b_bf16.pte`;
const QWEN2_5_3B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-3B/quantized/qwen2_5_3b_8da4w.pte`;
const QWEN2_5_TOKENIZER = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/tokenizer.json`;
const QWEN2_5_TOKENIZER_CONFIG = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/tokenizer_config.json`;

export const QWEN2_5_0_5B = {
  modelSource: QWEN2_5_0_5B_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
};

export const QWEN2_5_0_5B_QUANTIZED = {
  modelSource: QWEN2_5_0_5B_QUANTIZED_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
};

export const QWEN2_5_1_5B = {
  modelSource: QWEN2_5_1_5B_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
};

export const QWEN2_5_1_5B_QUANTIZED = {
  modelSource: QWEN2_5_1_5B_QUANTIZED_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
};

export const QWEN2_5_3B = {
  modelSource: QWEN2_5_3B_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
};

export const QWEN2_5_3B_QUANTIZED = {
  modelSource: QWEN2_5_3B_QUANTIZED_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
};

// PHI 4
const PHI_4_MINI_4B_MODEL = `${URL_PREFIX}-phi-4-mini/${VERSION_TAG}/original/phi-4-mini_bf16.pte`;
const PHI_4_MINI_4B_QUANTIZED_MODEL = `${URL_PREFIX}-phi-4-mini/${VERSION_TAG}/quantized/phi-4-mini_8da4w.pte`;
const PHI_4_MINI_TOKENIZER = `${URL_PREFIX}-phi-4-mini/${VERSION_TAG}/tokenizer.json`;
const PHI_4_MINI_TOKENIZER_CONFIG = `${URL_PREFIX}-phi-4-mini/${VERSION_TAG}/tokenizer_config.json`;

export const PHI_4_MINI_4B = {
  modelSource: PHI_4_MINI_4B_MODEL,
  tokenizerSource: PHI_4_MINI_TOKENIZER,
  tokenizerConfigSource: PHI_4_MINI_TOKENIZER_CONFIG,
};

export const PHI_4_MINI_4B_QUANTIZED = {
  modelSource: PHI_4_MINI_4B_QUANTIZED_MODEL,
  tokenizerSource: PHI_4_MINI_TOKENIZER,
  tokenizerConfigSource: PHI_4_MINI_TOKENIZER_CONFIG,
};

// Classification
const EFFICIENTNET_V2_S_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-efficientnet-v2-s/${VERSION_TAG}/coreml/efficientnet_v2_s_coreml_all.pte`
    : `${URL_PREFIX}-efficientnet-v2-s/${VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack.pte`;

export const EFFICIENTNET_V2_S = {
  modelSource: EFFICIENTNET_V2_S_MODEL,
};

// Object detection
const SSDLITE_320_MOBILENET_V3_LARGE_MODEL = `${URL_PREFIX}-ssdlite320-mobilenet-v3-large/${VERSION_TAG}/ssdlite320-mobilenetv3-large.pte`;

export const SSDLITE_320_MOBILENET_V3_LARGE = {
  modelSource: SSDLITE_320_MOBILENET_V3_LARGE_MODEL,
};

// Style transfer
const STYLE_TRANSFER_CANDY_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-candy/${VERSION_TAG}/coreml/style_transfer_candy_coreml.pte`
    : `${URL_PREFIX}-style-transfer-candy/${VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack.pte`;
const STYLE_TRANSFER_MOSAIC_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-mosaic/${VERSION_TAG}/coreml/style_transfer_mosaic_coreml.pte`
    : `${URL_PREFIX}-style-transfer-mosaic/${VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack.pte`;
const STYLE_TRANSFER_RAIN_PRINCESS_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-rain-princess/${VERSION_TAG}/coreml/style_transfer_rain_princess_coreml.pte`
    : `${URL_PREFIX}-style-transfer-rain-princess/${VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack.pte`;
const STYLE_TRANSFER_UDNIE_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-udnie/${VERSION_TAG}/coreml/style_transfer_udnie_coreml.pte`
    : `${URL_PREFIX}-style-transfer-udnie/${VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack.pte`;

export const STYLE_TRANSFER_CANDY = {
  modelSource: STYLE_TRANSFER_CANDY_MODEL,
};

export const STYLE_TRANSFER_MOSAIC = {
  modelSource: STYLE_TRANSFER_MOSAIC_MODEL,
};

export const STYLE_TRANSFER_RAIN_PRINCESS = {
  modelSource: STYLE_TRANSFER_RAIN_PRINCESS_MODEL,
};

export const STYLE_TRANSFER_UDNIE = {
  modelSource: STYLE_TRANSFER_UDNIE_MODEL,
};

// S2T
const WHISPER_TINY_EN_TOKENIZER = `${URL_PREFIX}-whisper-tiny.en/${VERSION_TAG}/tokenizer.json`;
const WHISPER_TINY_EN_ENCODER = `${URL_PREFIX}-whisper-tiny.en/${VERSION_TAG}/xnnpack/whisper_tiny_en_encoder_xnnpack.pte`;
const WHISPER_TINY_EN_DECODER = `${URL_PREFIX}-whisper-tiny.en/${VERSION_TAG}/xnnpack/whisper_tiny_en_decoder_xnnpack.pte`;

const WHISPER_BASE_EN_TOKENIZER = `${URL_PREFIX}-whisper-base.en/${VERSION_TAG}/tokenizer.json`;
const WHISPER_BASE_EN_ENCODER = `${URL_PREFIX}-whisper-base.en/${VERSION_TAG}/xnnpack/whisper_base_en_encoder_xnnpack.pte`;
const WHISPER_BASE_EN_DECODER = `${URL_PREFIX}-whisper-base.en/${VERSION_TAG}/xnnpack/whisper_base_en_decoder_xnnpack.pte`;

const WHISPER_SMALL_EN_TOKENIZER = `${URL_PREFIX}-whisper-small.en/${VERSION_TAG}/tokenizer.json`;
const WHISPER_SMALL_EN_ENCODER = `${URL_PREFIX}-whisper-small.en/${VERSION_TAG}/xnnpack/whisper_small_en_encoder_xnnpack.pte`;
const WHISPER_SMALL_EN_DECODER = `${URL_PREFIX}-whisper-small.en/${VERSION_TAG}/xnnpack/whisper_small_en_decoder_xnnpack.pte`;

const WHISPER_TINY_TOKENIZER = `${URL_PREFIX}-whisper-tiny/${VERSION_TAG}/tokenizer.json`;
const WHISPER_TINY_ENCODER_MODEL = `${URL_PREFIX}-whisper-tiny/${VERSION_TAG}/xnnpack/whisper_tiny_encoder_xnnpack.pte`;
const WHISPER_TINY_DECODER_MODEL = `${URL_PREFIX}-whisper-tiny/${VERSION_TAG}/xnnpack/whisper_tiny_decoder_xnnpack.pte`;

const WHISPER_BASE_TOKENIZER = `${URL_PREFIX}-whisper-base/${VERSION_TAG}/tokenizer.json`;
const WHISPER_BASE_ENCODER_MODEL = `${URL_PREFIX}-whisper-base/${VERSION_TAG}/xnnpack/whisper_base_encoder_xnnpack.pte`;
const WHISPER_BASE_DECODER_MODEL = `${URL_PREFIX}-whisper-base/${VERSION_TAG}/xnnpack/whisper_base_decoder_xnnpack.pte`;

const WHISPER_SMALL_TOKENIZER = `${URL_PREFIX}-whisper-small/${VERSION_TAG}/tokenizer.json`;
const WHISPER_SMALL_ENCODER_MODEL = `${URL_PREFIX}-whisper-small/${VERSION_TAG}/xnnpack/whisper_small_encoder_xnnpack.pte`;
const WHISPER_SMALL_DECODER_MODEL = `${URL_PREFIX}-whisper-small/${VERSION_TAG}/xnnpack/whisper_small_decoder_xnnpack.pte`;

export const WHISPER_TINY_EN = {
  isMultilingual: false,
  encoderSource: WHISPER_TINY_EN_ENCODER,
  decoderSource: WHISPER_TINY_EN_DECODER,
  tokenizerSource: WHISPER_TINY_EN_TOKENIZER,
};

export const WHISPER_BASE_EN = {
  isMultilingual: false,
  encoderSource: WHISPER_BASE_EN_ENCODER,
  decoderSource: WHISPER_BASE_EN_DECODER,
  tokenizerSource: WHISPER_BASE_EN_TOKENIZER,
};

export const WHISPER_SMALL_EN = {
  isMultilingual: false,
  encoderSource: WHISPER_SMALL_EN_ENCODER,
  decoderSource: WHISPER_SMALL_EN_DECODER,
  tokenizerSource: WHISPER_SMALL_EN_TOKENIZER,
};

export const WHISPER_TINY = {
  isMultilingual: true,
  encoderSource: WHISPER_TINY_ENCODER_MODEL,
  decoderSource: WHISPER_TINY_DECODER_MODEL,
  tokenizerSource: WHISPER_TINY_TOKENIZER,
};

export const WHISPER_BASE = {
  isMultilingual: true,
  encoderSource: WHISPER_BASE_ENCODER_MODEL,
  decoderSource: WHISPER_BASE_DECODER_MODEL,
  tokenizerSource: WHISPER_BASE_TOKENIZER,
};

export const WHISPER_SMALL = {
  isMultilingual: true,
  encoderSource: WHISPER_SMALL_ENCODER_MODEL,
  decoderSource: WHISPER_SMALL_DECODER_MODEL,
  tokenizerSource: WHISPER_SMALL_TOKENIZER,
};

// Image segmentation
const DEEPLAB_V3_RESNET50_MODEL = `${URL_PREFIX}-deeplab-v3/${VERSION_TAG}/xnnpack/deeplabV3_xnnpack_fp32.pte`;

export const DEEPLAB_V3_RESNET50 = {
  modelSource: DEEPLAB_V3_RESNET50_MODEL,
};

// Image Embeddings
const CLIP_VIT_BASE_PATCH32_IMAGE_MODEL = `${URL_PREFIX}-clip-vit-base-patch32/${VERSION_TAG}/clip-vit-base-patch32-vision_xnnpack.pte`;

export const CLIP_VIT_BASE_PATCH32_IMAGE = {
  modelSource: CLIP_VIT_BASE_PATCH32_IMAGE_MODEL,
};

// Text Embeddings
const ALL_MINILM_L6_V2_MODEL = `${URL_PREFIX}-all-MiniLM-L6-v2/${VERSION_TAG}/all-MiniLM-L6-v2_xnnpack.pte`;
const ALL_MINILM_L6_V2_TOKENIZER = `${URL_PREFIX}-all-MiniLM-L6-v2/${VERSION_TAG}/tokenizer.json`;
const ALL_MPNET_BASE_V2_MODEL = `${URL_PREFIX}-all-mpnet-base-v2/${VERSION_TAG}/all-mpnet-base-v2_xnnpack.pte`;
const ALL_MPNET_BASE_V2_TOKENIZER = `${URL_PREFIX}-all-mpnet-base-v2/${VERSION_TAG}/tokenizer.json`;
const MULTI_QA_MINILM_L6_COS_V1_MODEL = `${URL_PREFIX}-multi-qa-MiniLM-L6-cos-v1/${VERSION_TAG}/multi-qa-MiniLM-L6-cos-v1_xnnpack.pte`;
const MULTI_QA_MINILM_L6_COS_V1_TOKENIZER = `${URL_PREFIX}-multi-qa-MiniLM-L6-cos-v1/${VERSION_TAG}/tokenizer.json`;
const MULTI_QA_MPNET_BASE_DOT_V1_MODEL = `${URL_PREFIX}-multi-qa-mpnet-base-dot-v1/${VERSION_TAG}/multi-qa-mpnet-base-dot-v1_xnnpack.pte`;
const MULTI_QA_MPNET_BASE_DOT_V1_TOKENIZER = `${URL_PREFIX}-multi-qa-mpnet-base-dot-v1/${VERSION_TAG}/tokenizer.json`;
const CLIP_VIT_BASE_PATCH32_TEXT_MODEL = `${URL_PREFIX}-clip-vit-base-patch32/${VERSION_TAG}/clip-vit-base-patch32-text_xnnpack.pte`;
const CLIP_VIT_BASE_PATCH32_TEXT_TOKENIZER = `${URL_PREFIX}-clip-vit-base-patch32/${VERSION_TAG}/tokenizer.json`;

export const ALL_MINILM_L6_V2 = {
  modelSource: ALL_MINILM_L6_V2_MODEL,
  tokenizerSource: ALL_MINILM_L6_V2_TOKENIZER,
};

export const ALL_MPNET_BASE_V2 = {
  modelSource: ALL_MPNET_BASE_V2_MODEL,
  tokenizerSource: ALL_MPNET_BASE_V2_TOKENIZER,
};

export const MULTI_QA_MINILM_L6_COS_V1 = {
  modelSource: MULTI_QA_MINILM_L6_COS_V1_MODEL,
  tokenizerSource: MULTI_QA_MINILM_L6_COS_V1_TOKENIZER,
};

export const MULTI_QA_MPNET_BASE_DOT_V1 = {
  modelSource: MULTI_QA_MPNET_BASE_DOT_V1_MODEL,
  tokenizerSource: MULTI_QA_MPNET_BASE_DOT_V1_TOKENIZER,
};

export const CLIP_VIT_BASE_PATCH32_TEXT = {
  modelSource: CLIP_VIT_BASE_PATCH32_TEXT_MODEL,
  tokenizerSource: CLIP_VIT_BASE_PATCH32_TEXT_TOKENIZER,
};
