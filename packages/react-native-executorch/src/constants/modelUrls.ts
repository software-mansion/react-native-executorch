import { Platform } from 'react-native';
import { NEXT_VERSION_TAG, URL_PREFIX, VERSION_TAG } from './versions';

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

/**
 * @category Models - LLM
 */
export const LLAMA3_2_3B = {
  modelName: 'llama-3.2-3b',
  modelSource: LLAMA3_2_3B_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const LLAMA3_2_3B_QLORA = {
  modelName: 'llama-3.2-3b-qlora',
  modelSource: LLAMA3_2_3B_QLORA_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const LLAMA3_2_3B_SPINQUANT = {
  modelName: 'llama-3.2-3b-spinquant',
  modelSource: LLAMA3_2_3B_SPINQUANT_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const LLAMA3_2_1B = {
  modelName: 'llama-3.2-1b',
  modelSource: LLAMA3_2_1B_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const LLAMA3_2_1B_QLORA = {
  modelName: 'llama-3.2-1b-qlora',
  modelSource: LLAMA3_2_1B_QLORA_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const LLAMA3_2_1B_SPINQUANT = {
  modelName: 'llama-3.2-1b-spinquant',
  modelSource: LLAMA3_2_1B_SPINQUANT_MODEL,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
} as const;

// QWEN 3
const QWEN3_0_6B_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-0.6B/original/qwen3_0_6b_bf16.pte`;
const QWEN3_0_6B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-0.6B/quantized/qwen3_0_6b_8da4w.pte`;
const QWEN3_1_7B_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-1.7B/original/qwen3_1_7b_bf16.pte`;
const QWEN3_1_7B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-1.7B/quantized/qwen3_1_7b_8da4w.pte`;
const QWEN3_4B_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-4B/original/qwen3_4b_bf16.pte`;
const QWEN3_4B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/qwen-3-4B/quantized/qwen3_4b_8da4w.pte`;
const QWEN3_TOKENIZER = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/tokenizer.json`;
const QWEN3_TOKENIZER_CONFIG = `${URL_PREFIX}-qwen-3/${VERSION_TAG}/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const QWEN3_0_6B = {
  modelName: 'qwen3-0.6b',
  modelSource: QWEN3_0_6B_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_0_6B_QUANTIZED = {
  modelName: 'qwen3-0.6b-quantized',
  modelSource: QWEN3_0_6B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_1_7B = {
  modelName: 'qwen3-1.7b',
  modelSource: QWEN3_1_7B_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_1_7B_QUANTIZED = {
  modelName: 'qwen3-1.7b-quantized',
  modelSource: QWEN3_1_7B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_4B = {
  modelName: 'qwen3-4b',
  modelSource: QWEN3_4B_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_4B_QUANTIZED = {
  modelName: 'qwen3-4b-quantized',
  modelSource: QWEN3_4B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
} as const;

// HAMMER 2.1
const HAMMER2_1_0_5B_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-0.5B/original/hammer2_1_0_5B_bf16.pte`;
const HAMMER2_1_0_5B_QUANTIZED_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-0.5B/quantized/hammer2_1_0_5B_8da4w.pte`;
const HAMMER2_1_1_5B_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-1.5B/original/hammer2_1_1_5B_bf16.pte`;
const HAMMER2_1_1_5B_QUANTIZED_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-1.5B/quantized/hammer2_1_1_5B_8da4w.pte`;
const HAMMER2_1_3B_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-3B/original/hammer2_1_3B_bf16.pte`;
const HAMMER2_1_3B_QUANTIZED_MODEL = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/hammer-2.1-3B/quantized/hammer2_1_3B_8da4w.pte`;
const HAMMER2_1_TOKENIZER = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/tokenizer.json`;
const HAMMER2_1_TOKENIZER_CONFIG = `${URL_PREFIX}-hammer-2.1/${VERSION_TAG}/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const HAMMER2_1_0_5B = {
  modelName: 'hammer2.1-0.5b',
  modelSource: HAMMER2_1_0_5B_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const HAMMER2_1_0_5B_QUANTIZED = {
  modelName: 'hammer2.1-0.5b-quantized',
  modelSource: HAMMER2_1_0_5B_QUANTIZED_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const HAMMER2_1_1_5B = {
  modelName: 'hammer2.1-1.5b',
  modelSource: HAMMER2_1_1_5B_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const HAMMER2_1_1_5B_QUANTIZED = {
  modelName: 'hammer2.1-1.5b-quantized',
  modelSource: HAMMER2_1_1_5B_QUANTIZED_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const HAMMER2_1_3B = {
  modelName: 'hammer2.1-3b',
  modelSource: HAMMER2_1_3B_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const HAMMER2_1_3B_QUANTIZED = {
  modelName: 'hammer2.1-3b-quantized',
  modelSource: HAMMER2_1_3B_QUANTIZED_MODEL,
  tokenizerSource: HAMMER2_1_TOKENIZER,
  tokenizerConfigSource: HAMMER2_1_TOKENIZER_CONFIG,
} as const;

// SMOLLM2
const SMOLLM2_1_135M_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-135M/original/smolLm2_135M_bf16.pte`;
const SMOLLM2_1_135M_QUANTIZED_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-135M/quantized/smolLm2_135M_8da4w.pte`;
const SMOLLM2_1_360M_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-360M/original/smolLm2_360M_bf16.pte`;
const SMOLLM2_1_360M_QUANTIZED_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-360M/quantized/smolLm2_360M_8da4w.pte`;
const SMOLLM2_1_1_7B_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-1.7B/original/smolLm2_1_7B_bf16.pte`;
const SMOLLM2_1_1_7B_QUANTIZED_MODEL = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/smolLm-2-1.7B/quantized/smolLm2_1_7B_8da4w.pte`;
const SMOLLM2_1_TOKENIZER = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/tokenizer.json`;
const SMOLLM2_1_TOKENIZER_CONFIG = `${URL_PREFIX}-smolLm-2/${VERSION_TAG}/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const SMOLLM2_1_135M = {
  modelName: 'smollm2.1-135m',
  modelSource: SMOLLM2_1_135M_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const SMOLLM2_1_135M_QUANTIZED = {
  modelName: 'smollm2.1-135m-quantized',
  modelSource: SMOLLM2_1_135M_QUANTIZED_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const SMOLLM2_1_360M = {
  modelName: 'smollm2.1-360m',
  modelSource: SMOLLM2_1_360M_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const SMOLLM2_1_360M_QUANTIZED = {
  modelName: 'smollm2.1-360m-quantized',
  modelSource: SMOLLM2_1_360M_QUANTIZED_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const SMOLLM2_1_1_7B = {
  modelName: 'smollm2.1-1.7b',
  modelSource: SMOLLM2_1_1_7B_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const SMOLLM2_1_1_7B_QUANTIZED = {
  modelName: 'smollm2.1-1.7b-quantized',
  modelSource: SMOLLM2_1_1_7B_QUANTIZED_MODEL,
  tokenizerSource: SMOLLM2_1_TOKENIZER,
  tokenizerConfigSource: SMOLLM2_1_TOKENIZER_CONFIG,
} as const;

// QWEN 2.5
const QWEN2_5_0_5B_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-0.5B/original/qwen2_5_0_5b_bf16.pte`;
const QWEN2_5_0_5B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-0.5B/quantized/qwen2_5_0_5b_8da4w.pte`;
const QWEN2_5_1_5B_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-1.5B/original/qwen2_5_1_5b_bf16.pte`;
const QWEN2_5_1_5B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-1.5B/quantized/qwen2_5_1_5b_8da4w.pte`;
const QWEN2_5_3B_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-3B/original/qwen2_5_3b_bf16.pte`;
const QWEN2_5_3B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/qwen-2.5-3B/quantized/qwen2_5_3b_8da4w.pte`;
const QWEN2_5_TOKENIZER = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/tokenizer.json`;
const QWEN2_5_TOKENIZER_CONFIG = `${URL_PREFIX}-qwen-2.5/${VERSION_TAG}/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const QWEN2_5_0_5B = {
  modelName: 'qwen2.5-0.5b',
  modelSource: QWEN2_5_0_5B_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN2_5_0_5B_QUANTIZED = {
  modelName: 'qwen2.5-0.5b-quantized',
  modelSource: QWEN2_5_0_5B_QUANTIZED_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN2_5_1_5B = {
  modelName: 'qwen2.5-1.5b',
  modelSource: QWEN2_5_1_5B_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN2_5_1_5B_QUANTIZED = {
  modelName: 'qwen2.5-1.5b-quantized',
  modelSource: QWEN2_5_1_5B_QUANTIZED_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN2_5_3B = {
  modelName: 'qwen2.5-3b',
  modelSource: QWEN2_5_3B_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN2_5_3B_QUANTIZED = {
  modelName: 'qwen2.5-3b-quantized',
  modelSource: QWEN2_5_3B_QUANTIZED_MODEL,
  tokenizerSource: QWEN2_5_TOKENIZER,
  tokenizerConfigSource: QWEN2_5_TOKENIZER_CONFIG,
} as const;

// PHI 4
const PHI_4_MINI_4B_MODEL = `${URL_PREFIX}-phi-4-mini/${VERSION_TAG}/original/phi-4-mini_bf16.pte`;
const PHI_4_MINI_4B_QUANTIZED_MODEL = `${URL_PREFIX}-phi-4-mini/${VERSION_TAG}/quantized/phi-4-mini_8da4w.pte`;
const PHI_4_MINI_TOKENIZER = `${URL_PREFIX}-phi-4-mini/${VERSION_TAG}/tokenizer.json`;
const PHI_4_MINI_TOKENIZER_CONFIG = `${URL_PREFIX}-phi-4-mini/${VERSION_TAG}/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const PHI_4_MINI_4B = {
  modelName: 'phi-4-mini-4b',
  modelSource: PHI_4_MINI_4B_MODEL,
  tokenizerSource: PHI_4_MINI_TOKENIZER,
  tokenizerConfigSource: PHI_4_MINI_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const PHI_4_MINI_4B_QUANTIZED = {
  modelName: 'phi-4-mini-4b-quantized',
  modelSource: PHI_4_MINI_4B_QUANTIZED_MODEL,
  tokenizerSource: PHI_4_MINI_TOKENIZER,
  tokenizerConfigSource: PHI_4_MINI_TOKENIZER_CONFIG,
} as const;

// LFM2.5-1.2B-Instruct
const LFM2_5_1_2B_INSTRUCT_MODEL = `${URL_PREFIX}-lfm2.5-1.2B-instruct/${NEXT_VERSION_TAG}/original/lfm2_5_1_2b_fp16.pte`;
const LFM2_5_1_2B_INSTRUCT_QUANTIZED_MODEL = `${URL_PREFIX}-lfm2.5-1.2B-instruct/${NEXT_VERSION_TAG}/quantized/lfm2_5_1_2b_8da4w.pte`;
const LFM2_5_1_2B_TOKENIZER = `${URL_PREFIX}-lfm2.5-1.2B-instruct/${NEXT_VERSION_TAG}/tokenizer.json`;
const LFM2_5_1_2B_TOKENIZER_CONFIG = `${URL_PREFIX}-lfm2.5-1.2B-instruct/${NEXT_VERSION_TAG}/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const LFM2_5_1_2B_INSTRUCT = {
  modelName: 'lfm2.5-1.2b-instruct',
  modelSource: LFM2_5_1_2B_INSTRUCT_MODEL,
  tokenizerSource: LFM2_5_1_2B_TOKENIZER,
  tokenizerConfigSource: LFM2_5_1_2B_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const LFM2_5_1_2B_INSTRUCT_QUANTIZED = {
  modelName: 'lfm2.5-1.2b-instruct-quantized',
  modelSource: LFM2_5_1_2B_INSTRUCT_QUANTIZED_MODEL,
  tokenizerSource: LFM2_5_1_2B_TOKENIZER,
  tokenizerConfigSource: LFM2_5_1_2B_TOKENIZER_CONFIG,
} as const;

// LFM2.5-VL-1.6B
const LFM2_VL_1_6B_QUANTIZED_MODEL = `${URL_PREFIX}-lfm2.5-VL-1.6B/${NEXT_VERSION_TAG}/quantized/lfm2_5_vl_1_6b_8da4w_xnnpack.pte`;
const LFM2_VL_TOKENIZER = `${URL_PREFIX}-lfm2.5-VL-1.6B/${NEXT_VERSION_TAG}/tokenizer.json`;
const LFM2_VL_TOKENIZER_CONFIG = `${URL_PREFIX}-lfm2.5-VL-1.6B/${NEXT_VERSION_TAG}/tokenizer_config.json`;

/**
 * @category Models - VLM
 */
export const LFM2_VL_1_6B_QUANTIZED = {
  modelName: 'lfm2.5-vl-1.6b-quantized',
  capabilities: ['vision'],
  modelSource: LFM2_VL_1_6B_QUANTIZED_MODEL,
  tokenizerSource: LFM2_VL_TOKENIZER,
  tokenizerConfigSource: LFM2_VL_TOKENIZER_CONFIG,
} as const;

// Classification
const EFFICIENTNET_V2_S_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-efficientnet-v2-s/${NEXT_VERSION_TAG}/coreml/efficientnet_v2_s_coreml_fp32.pte`
    : `${URL_PREFIX}-efficientnet-v2-s/${NEXT_VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_fp32.pte`;
const EFFICIENTNET_V2_S_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-efficientnet-v2-s/${NEXT_VERSION_TAG}/coreml/efficientnet_v2_s_coreml_fp16.pte`
    : `${URL_PREFIX}-efficientnet-v2-s/${NEXT_VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_int8.pte`;

/**
 * @category Models - Classification
 */
export const EFFICIENTNET_V2_S = {
  modelName: 'efficientnet-v2-s',
  modelSource: EFFICIENTNET_V2_S_MODEL,
} as const;

/**
 * @category Models - Classification
 */
export const EFFICIENTNET_V2_S_QUANTIZED = {
  modelName: 'efficientnet-v2-s-quantized',
  modelSource: EFFICIENTNET_V2_S_QUANTIZED_MODEL,
} as const;

// Object detection
const SSDLITE_320_MOBILENET_V3_LARGE_MODEL =
  Platform.OS === 'ios'
    ? `${URL_PREFIX}-ssdlite320-mobilenet-v3-large/${NEXT_VERSION_TAG}/coreml/ssdlite320_mobilenet_v3_large_coreml_fp16.pte`
    : `${URL_PREFIX}-ssdlite320-mobilenet-v3-large/${NEXT_VERSION_TAG}/xnnpack/ssdlite320_mobilenet_v3_large_xnnpack_fp32.pte`;
const RF_DETR_NANO_MODEL = `${URL_PREFIX}-rfdetr-nano-detector/${NEXT_VERSION_TAG}/rfdetr_detector.pte`;

/**
 * @category Models - Object Detection
 */
export const SSDLITE_320_MOBILENET_V3_LARGE = {
  modelName: 'ssdlite-320-mobilenet-v3-large',
  modelSource: SSDLITE_320_MOBILENET_V3_LARGE_MODEL,
} as const;

/**
 * @category Models - Object Detection
 */
export const RF_DETR_NANO = {
  modelName: 'rf-detr-nano',
  modelSource: RF_DETR_NANO_MODEL,
} as const;

// YOLO26 Object Detection
const YOLO26N_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${NEXT_VERSION_TAG}/yolo26n/xnnpack/yolo26n.pte`;
const YOLO26S_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${NEXT_VERSION_TAG}/yolo26s/xnnpack/yolo26s.pte`;
const YOLO26M_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${NEXT_VERSION_TAG}/yolo26m/xnnpack/yolo26m.pte`;
const YOLO26L_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${NEXT_VERSION_TAG}/yolo26l/xnnpack/yolo26l.pte`;
const YOLO26X_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${NEXT_VERSION_TAG}/yolo26x/xnnpack/yolo26x.pte`;

/**
 * @category Models - Object Detection
 */
export const YOLO26N = {
  modelName: 'yolo26n',
  modelSource: YOLO26N_DETECTION_MODEL,
} as const;

/**
 * @category Models - Object Detection
 */
export const YOLO26S = {
  modelName: 'yolo26s',
  modelSource: YOLO26S_DETECTION_MODEL,
} as const;

/**
 * @category Models - Object Detection
 */
export const YOLO26M = {
  modelName: 'yolo26m',
  modelSource: YOLO26M_DETECTION_MODEL,
} as const;

/**
 * @category Models - Object Detection
 */
export const YOLO26L = {
  modelName: 'yolo26l',
  modelSource: YOLO26L_DETECTION_MODEL,
} as const;

/**
 * @category Models - Object Detection
 */
export const YOLO26X = {
  modelName: 'yolo26x',
  modelSource: YOLO26X_DETECTION_MODEL,
} as const;

// Style transfer
const STYLE_TRANSFER_CANDY_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-candy/${NEXT_VERSION_TAG}/coreml/style_transfer_candy_coreml_fp32.pte`
    : `${URL_PREFIX}-style-transfer-candy/${NEXT_VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack_fp32.pte`;
const STYLE_TRANSFER_CANDY_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-candy/${NEXT_VERSION_TAG}/coreml/style_transfer_candy_coreml_fp16.pte`
    : `${URL_PREFIX}-style-transfer-candy/${NEXT_VERSION_TAG}/xnnpack/style_transfer_candy_xnnpack_int8.pte`;
const STYLE_TRANSFER_MOSAIC_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-mosaic/${NEXT_VERSION_TAG}/coreml/style_transfer_mosaic_coreml_fp32.pte`
    : `${URL_PREFIX}-style-transfer-mosaic/${NEXT_VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack_fp32.pte`;
const STYLE_TRANSFER_MOSAIC_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-mosaic/${NEXT_VERSION_TAG}/coreml/style_transfer_mosaic_coreml_fp16.pte`
    : `${URL_PREFIX}-style-transfer-mosaic/${NEXT_VERSION_TAG}/xnnpack/style_transfer_mosaic_xnnpack_int8.pte`;
const STYLE_TRANSFER_RAIN_PRINCESS_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-rain-princess/${NEXT_VERSION_TAG}/coreml/style_transfer_rain_princess_coreml_fp32.pte`
    : `${URL_PREFIX}-style-transfer-rain-princess/${NEXT_VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack_fp32.pte`;
const STYLE_TRANSFER_RAIN_PRINCESS_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-rain-princess/${NEXT_VERSION_TAG}/coreml/style_transfer_rain_princess_coreml_fp16.pte`
    : `${URL_PREFIX}-style-transfer-rain-princess/${NEXT_VERSION_TAG}/xnnpack/style_transfer_rain_princess_xnnpack_int8.pte`;
const STYLE_TRANSFER_UDNIE_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-udnie/${NEXT_VERSION_TAG}/coreml/style_transfer_udnie_coreml_fp32.pte`
    : `${URL_PREFIX}-style-transfer-udnie/${NEXT_VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack_fp32.pte`;
const STYLE_TRANSFER_UDNIE_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? `${URL_PREFIX}-style-transfer-udnie/${NEXT_VERSION_TAG}/coreml/style_transfer_udnie_coreml_fp16.pte`
    : `${URL_PREFIX}-style-transfer-udnie/${NEXT_VERSION_TAG}/xnnpack/style_transfer_udnie_xnnpack_int8.pte`;

/**
 * @category Models - Style Transfer
 */
export const STYLE_TRANSFER_CANDY = {
  modelName: 'style-transfer-candy',
  modelSource: STYLE_TRANSFER_CANDY_MODEL,
} as const;

/**
 * @category Models - Style Transfer
 */
export const STYLE_TRANSFER_CANDY_QUANTIZED = {
  modelName: 'style-transfer-candy-quantized',
  modelSource: STYLE_TRANSFER_CANDY_QUANTIZED_MODEL,
} as const;

/**
 * @category Models - Style Transfer
 */
export const STYLE_TRANSFER_MOSAIC = {
  modelName: 'style-transfer-mosaic',
  modelSource: STYLE_TRANSFER_MOSAIC_MODEL,
} as const;

/**
 * @category Models - Style Transfer
 */
export const STYLE_TRANSFER_MOSAIC_QUANTIZED = {
  modelName: 'style-transfer-mosaic-quantized',
  modelSource: STYLE_TRANSFER_MOSAIC_QUANTIZED_MODEL,
} as const;

/**
 * @category Models - Style Transfer
 */
export const STYLE_TRANSFER_RAIN_PRINCESS = {
  modelName: 'style-transfer-rain-princess',
  modelSource: STYLE_TRANSFER_RAIN_PRINCESS_MODEL,
} as const;

/**
 * @category Models - Style Transfer
 */
export const STYLE_TRANSFER_RAIN_PRINCESS_QUANTIZED = {
  modelName: 'style-transfer-rain-princess-quantized',
  modelSource: STYLE_TRANSFER_RAIN_PRINCESS_QUANTIZED_MODEL,
} as const;

/**
 * @category Models - Style Transfer
 */
export const STYLE_TRANSFER_UDNIE = {
  modelName: 'style-transfer-udnie',
  modelSource: STYLE_TRANSFER_UDNIE_MODEL,
} as const;

/**
 * @category Models - Style Transfer
 */
export const STYLE_TRANSFER_UDNIE_QUANTIZED = {
  modelName: 'style-transfer-udnie-quantized',
  modelSource: STYLE_TRANSFER_UDNIE_QUANTIZED_MODEL,
} as const;

// S2T
const WHISPER_TINY_EN_TOKENIZER = `${URL_PREFIX}-whisper-tiny.en/${VERSION_TAG}/tokenizer.json`;
const WHISPER_TINY_EN_MODEL = `${URL_PREFIX}-whisper-tiny.en/${NEXT_VERSION_TAG}/xnnpack/whisper_tiny_en_xnnpack.pte`;

const WHISPER_TINY_EN_QUANTIZED_TOKENIZER = `${URL_PREFIX}-whisper-tiny-quantized.en/${NEXT_VERSION_TAG}/tokenizer.json`;
const WHISPER_TINY_EN_QUANTIZED_MODEL = `${URL_PREFIX}-whisper-tiny-quantized.en/${NEXT_VERSION_TAG}/xnnpack/whisper_tiny_en_quantized_xnnpack.pte`;

const WHISPER_BASE_EN_TOKENIZER = `${URL_PREFIX}-whisper-base.en/${NEXT_VERSION_TAG}/tokenizer.json`;
const WHISPER_BASE_EN_MODEL = `${URL_PREFIX}-whisper-base.en/${NEXT_VERSION_TAG}/xnnpack/whisper_base_en_xnnpack.pte`;

const WHISPER_BASE_EN_QUANTIZED_TOKENIZER = `${URL_PREFIX}-whisper-base-quantized.en/${VERSION_TAG}/tokenizer.json`;
const WHISPER_BASE_EN_QUANTIZED_MODEL = `${URL_PREFIX}-whisper-base-quantized.en/${NEXT_VERSION_TAG}/xnnpack/whisper_base_en_quantized_xnnpack.pte`;

const WHISPER_SMALL_EN_TOKENIZER = `${URL_PREFIX}-whisper-small.en/${NEXT_VERSION_TAG}/tokenizer.json`;
const WHISPER_SMALL_EN_MODEL = `${URL_PREFIX}-whisper-small.en/${NEXT_VERSION_TAG}/xnnpack/whisper_small_en_xnnpack.pte`;

const WHISPER_SMALL_EN_QUANTIZED_TOKENIZER = `${URL_PREFIX}-whisper-small-quantized.en/${VERSION_TAG}/tokenizer.json`;
const WHISPER_SMALL_EN_QUANTIZED_MODEL = `${URL_PREFIX}-whisper-small-quantized.en/${NEXT_VERSION_TAG}/xnnpack/whisper_small_en_quantized_xnnpack.pte`;

const WHISPER_TINY_TOKENIZER = `${URL_PREFIX}-whisper-tiny/${VERSION_TAG}/tokenizer.json`;
const WHISPER_TINY_MODEL = `${URL_PREFIX}-whisper-tiny/${NEXT_VERSION_TAG}/xnnpack/whisper_tiny_xnnpack.pte`;

const WHISPER_BASE_TOKENIZER = `${URL_PREFIX}-whisper-base/${VERSION_TAG}/tokenizer.json`;
const WHISPER_BASE_MODEL = `${URL_PREFIX}-whisper-base/${NEXT_VERSION_TAG}/xnnpack/whisper_base_xnnpack.pte`;

const WHISPER_SMALL_TOKENIZER = `${URL_PREFIX}-whisper-small/${VERSION_TAG}/tokenizer.json`;
const WHISPER_SMALL_MODEL = `${URL_PREFIX}-whisper-small/${NEXT_VERSION_TAG}/xnnpack/whisper_small_xnnpack.pte`;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_TINY_EN = {
  modelName: 'whisper-tiny-en',
  isMultilingual: false,
  modelSource: WHISPER_TINY_EN_MODEL,
  tokenizerSource: WHISPER_TINY_EN_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_TINY_EN_QUANTIZED = {
  modelName: 'whisper-tiny-en-quantized',
  isMultilingual: false,
  modelSource: WHISPER_TINY_EN_QUANTIZED_MODEL,
  tokenizerSource: WHISPER_TINY_EN_QUANTIZED_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_BASE_EN = {
  modelName: 'whisper-base-en',
  isMultilingual: false,
  modelSource: WHISPER_BASE_EN_MODEL,
  tokenizerSource: WHISPER_BASE_EN_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_BASE_EN_QUANTIZED = {
  modelName: 'whisper-base-en-quantized',
  isMultilingual: false,
  modelSource: WHISPER_BASE_EN_QUANTIZED_MODEL,
  tokenizerSource: WHISPER_BASE_EN_QUANTIZED_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_SMALL_EN = {
  modelName: 'whisper-small-en',
  isMultilingual: false,
  modelSource: WHISPER_SMALL_EN_MODEL,
  tokenizerSource: WHISPER_SMALL_EN_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_SMALL_EN_QUANTIZED = {
  modelName: 'whisper-small-en-quantized',
  isMultilingual: false,
  modelSource: WHISPER_SMALL_EN_QUANTIZED_MODEL,
  tokenizerSource: WHISPER_SMALL_EN_QUANTIZED_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_TINY = {
  modelName: 'whisper-tiny',
  isMultilingual: true,
  modelSource: WHISPER_TINY_MODEL,
  tokenizerSource: WHISPER_TINY_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_BASE = {
  modelName: 'whisper-base',
  isMultilingual: true,
  modelSource: WHISPER_BASE_MODEL,
  tokenizerSource: WHISPER_BASE_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_SMALL = {
  modelName: 'whisper-small',
  isMultilingual: true,
  modelSource: WHISPER_SMALL_MODEL,
  tokenizerSource: WHISPER_SMALL_TOKENIZER,
} as const;

// Semantic Segmentation
const DEEPLAB_V3_RESNET50_MODEL = `${URL_PREFIX}-deeplab-v3/${NEXT_VERSION_TAG}/deeplab-v3-resnet50/xnnpack/deeplabv3_resnet50_xnnpack_fp32.pte`;
const DEEPLAB_V3_RESNET101_MODEL = `${URL_PREFIX}-deeplab-v3/${NEXT_VERSION_TAG}/deeplab-v3-resnet101/xnnpack/deeplabv3_resnet101_xnnpack_fp32.pte`;
const DEEPLAB_V3_MOBILENET_V3_LARGE_MODEL = `${URL_PREFIX}-deeplab-v3/${NEXT_VERSION_TAG}/deeplab-v3-mobilenet-v3-large/xnnpack/deeplabv3_mobilenet_v3_large_xnnpack_fp32.pte`;
const LRASPP_MOBILENET_V3_LARGE_MODEL = `${URL_PREFIX}-lraspp/${NEXT_VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_fp32.pte`;
const FCN_RESNET50_MODEL = `${URL_PREFIX}-fcn/${NEXT_VERSION_TAG}/fcn-resnet50/xnnpack/fcn_resnet50_xnnpack_fp32.pte`;
const FCN_RESNET101_MODEL = `${URL_PREFIX}-fcn/${NEXT_VERSION_TAG}/fcn-resnet101/xnnpack/fcn_resnet101_xnnpack_fp32.pte`;
const DEEPLAB_V3_RESNET50_QUANTIZED_MODEL = `${URL_PREFIX}-deeplab-v3/${NEXT_VERSION_TAG}/deeplab-v3-resnet50/xnnpack/deeplabv3_resnet50_xnnpack_int8.pte`;
const DEEPLAB_V3_RESNET101_QUANTIZED_MODEL = `${URL_PREFIX}-deeplab-v3/${NEXT_VERSION_TAG}/deeplab-v3-resnet101/xnnpack/deeplabv3_resnet101_xnnpack_int8.pte`;
const DEEPLAB_V3_MOBILENET_V3_LARGE_QUANTIZED_MODEL = `${URL_PREFIX}-deeplab-v3/${NEXT_VERSION_TAG}/deeplab-v3-mobilenet-v3-large/xnnpack/deeplabv3_mobilenet_v3_large_xnnpack_int8.pte`;
const LRASPP_MOBILENET_V3_LARGE_QUANTIZED_MODEL = `${URL_PREFIX}-lraspp/${NEXT_VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_int8.pte`;
const FCN_RESNET50_QUANTIZED_MODEL = `${URL_PREFIX}-fcn/${NEXT_VERSION_TAG}/fcn-resnet50/xnnpack/fcn_resnet50_xnnpack_int8.pte`;
const FCN_RESNET101_QUANTIZED_MODEL = `${URL_PREFIX}-fcn/${NEXT_VERSION_TAG}/fcn-resnet101/xnnpack/fcn_resnet101_xnnpack_int8.pte`;

/**
 * @category Models - Semantic Segmentation
 */
export const DEEPLAB_V3_RESNET50 = {
  modelName: 'deeplab-v3-resnet50',
  modelSource: DEEPLAB_V3_RESNET50_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const DEEPLAB_V3_RESNET101 = {
  modelName: 'deeplab-v3-resnet101',
  modelSource: DEEPLAB_V3_RESNET101_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const DEEPLAB_V3_MOBILENET_V3_LARGE = {
  modelName: 'deeplab-v3-mobilenet-v3-large',
  modelSource: DEEPLAB_V3_MOBILENET_V3_LARGE_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const LRASPP_MOBILENET_V3_LARGE = {
  modelName: 'lraspp-mobilenet-v3-large',
  modelSource: LRASPP_MOBILENET_V3_LARGE_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const FCN_RESNET50 = {
  modelName: 'fcn-resnet50',
  modelSource: FCN_RESNET50_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const FCN_RESNET101 = {
  modelName: 'fcn-resnet101',
  modelSource: FCN_RESNET101_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const DEEPLAB_V3_RESNET50_QUANTIZED = {
  modelName: 'deeplab-v3-resnet50-quantized',
  modelSource: DEEPLAB_V3_RESNET50_QUANTIZED_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const DEEPLAB_V3_RESNET101_QUANTIZED = {
  modelName: 'deeplab-v3-resnet101-quantized',
  modelSource: DEEPLAB_V3_RESNET101_QUANTIZED_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const DEEPLAB_V3_MOBILENET_V3_LARGE_QUANTIZED = {
  modelName: 'deeplab-v3-mobilenet-v3-large-quantized',
  modelSource: DEEPLAB_V3_MOBILENET_V3_LARGE_QUANTIZED_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const LRASPP_MOBILENET_V3_LARGE_QUANTIZED = {
  modelName: 'lraspp-mobilenet-v3-large-quantized',
  modelSource: LRASPP_MOBILENET_V3_LARGE_QUANTIZED_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const FCN_RESNET50_QUANTIZED = {
  modelName: 'fcn-resnet50-quantized',
  modelSource: FCN_RESNET50_QUANTIZED_MODEL,
} as const;

/**
 * @category Models - Semantic Segmentation
 */
export const FCN_RESNET101_QUANTIZED = {
  modelName: 'fcn-resnet101-quantized',
  modelSource: FCN_RESNET101_QUANTIZED_MODEL,
} as const;

const SELFIE_SEGMENTATION_MODEL = `${URL_PREFIX}-selfie-segmentation/${NEXT_VERSION_TAG}/xnnpack/selfie-segmentation.pte`;

/**
 * @category Models - Semantic Segmentation
 */
export const SELFIE_SEGMENTATION = {
  modelName: 'selfie-segmentation',
  modelSource: SELFIE_SEGMENTATION_MODEL,
} as const;

/**
 * @category Models - Instance Segmentation
 */
const YOLO26N_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${NEXT_VERSION_TAG}/yolo26n-seg/xnnpack/yolo26n-seg.pte`;
const YOLO26S_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${NEXT_VERSION_TAG}/yolo26s-seg/xnnpack/yolo26s-seg.pte`;
const YOLO26M_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${NEXT_VERSION_TAG}/yolo26m-seg/xnnpack/yolo26m-seg.pte`;
const YOLO26L_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${NEXT_VERSION_TAG}/yolo26l-seg/xnnpack/yolo26l-seg.pte`;
const YOLO26X_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${NEXT_VERSION_TAG}/yolo26x-seg/xnnpack/yolo26x-seg.pte`;
const RF_DETR_NANO_SEG_MODEL = `${URL_PREFIX}-rfdetr-nano-segmentation/${NEXT_VERSION_TAG}/rfdetr_segmentation.pte`;
/**
 * @category Models - Instance Segmentation
 */
export const YOLO26N_SEG = {
  modelName: 'yolo26n-seg',
  modelSource: YOLO26N_SEG_MODEL,
} as const;

/**
 * @category Models - Instance Segmentation
 */
export const YOLO26S_SEG = {
  modelName: 'yolo26s-seg',
  modelSource: YOLO26S_SEG_MODEL,
} as const;

/**
 * @category Models - Instance Segmentation
 */
export const YOLO26M_SEG = {
  modelName: 'yolo26m-seg',
  modelSource: YOLO26M_SEG_MODEL,
} as const;

/**
 * @category Models - Instance Segmentation
 */
export const YOLO26L_SEG = {
  modelName: 'yolo26l-seg',
  modelSource: YOLO26L_SEG_MODEL,
} as const;

/**
 * @category Models - Instance Segmentation
 */
export const YOLO26X_SEG = {
  modelName: 'yolo26x-seg',
  modelSource: YOLO26X_SEG_MODEL,
} as const;

/**
 * @category Models - Instance Segmentation
 */
export const RF_DETR_NANO_SEG = {
  modelName: 'rfdetr-nano-seg',
  modelSource: RF_DETR_NANO_SEG_MODEL,
} as const;

// Image Embeddings
const CLIP_VIT_BASE_PATCH32_IMAGE_MODEL = `${URL_PREFIX}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/xnnpack/clip_vit_base_patch32_vision_xnnpack_fp32.pte`;
const CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED_MODEL = `${URL_PREFIX}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/xnnpack/clip_vit_base_patch32_vision_xnnpack_int8.pte`;

/**
 * @category Models - Image Embeddings
 */
export const CLIP_VIT_BASE_PATCH32_IMAGE = {
  modelName: 'clip-vit-base-patch32-image',
  modelSource: CLIP_VIT_BASE_PATCH32_IMAGE_MODEL,
} as const;

/**
 * @category Models - Image Embeddings
 */
export const CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED = {
  modelName: 'clip-vit-base-patch32-image-quantized',
  modelSource: CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED_MODEL,
} as const;

// Text Embeddings
const ALL_MINILM_L6_V2_MODEL = `${URL_PREFIX}-all-MiniLM-L6-v2/${VERSION_TAG}/all-MiniLM-L6-v2_xnnpack.pte`;
const ALL_MINILM_L6_V2_TOKENIZER = `${URL_PREFIX}-all-MiniLM-L6-v2/${VERSION_TAG}/tokenizer.json`;
const ALL_MPNET_BASE_V2_MODEL = `${URL_PREFIX}-all-mpnet-base-v2/${VERSION_TAG}/all-mpnet-base-v2_xnnpack.pte`;
const ALL_MPNET_BASE_V2_TOKENIZER = `${URL_PREFIX}-all-mpnet-base-v2/${VERSION_TAG}/tokenizer.json`;
const MULTI_QA_MINILM_L6_COS_V1_MODEL = `${URL_PREFIX}-multi-qa-MiniLM-L6-cos-v1/${VERSION_TAG}/multi-qa-MiniLM-L6-cos-v1_xnnpack.pte`;
const MULTI_QA_MINILM_L6_COS_V1_TOKENIZER = `${URL_PREFIX}-multi-qa-MiniLM-L6-cos-v1/${VERSION_TAG}/tokenizer.json`;
const MULTI_QA_MPNET_BASE_DOT_V1_MODEL = `${URL_PREFIX}-multi-qa-mpnet-base-dot-v1/${VERSION_TAG}/multi-qa-mpnet-base-dot-v1_xnnpack.pte`;
const MULTI_QA_MPNET_BASE_DOT_V1_TOKENIZER = `${URL_PREFIX}-multi-qa-mpnet-base-dot-v1/${VERSION_TAG}/tokenizer.json`;
const CLIP_VIT_BASE_PATCH32_TEXT_MODEL = `${URL_PREFIX}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/xnnpack/clip_vit_base_patch32_text_xnnpack_fp32.pte`;
const CLIP_VIT_BASE_PATCH32_TEXT_TOKENIZER = `${URL_PREFIX}-clip-vit-base-patch32/${NEXT_VERSION_TAG}/tokenizer.json`;

/**
 * @category Models - Text Embeddings
 */
export const ALL_MINILM_L6_V2 = {
  modelName: 'all-minilm-l6-v2',
  modelSource: ALL_MINILM_L6_V2_MODEL,
  tokenizerSource: ALL_MINILM_L6_V2_TOKENIZER,
} as const;

/**
 * @category Models - Text Embeddings
 */
export const ALL_MPNET_BASE_V2 = {
  modelName: 'all-mpnet-base-v2',
  modelSource: ALL_MPNET_BASE_V2_MODEL,
  tokenizerSource: ALL_MPNET_BASE_V2_TOKENIZER,
} as const;

/**
 * @category Models - Text Embeddings
 */
export const MULTI_QA_MINILM_L6_COS_V1 = {
  modelName: 'multi-qa-minilm-l6-cos-v1',
  modelSource: MULTI_QA_MINILM_L6_COS_V1_MODEL,
  tokenizerSource: MULTI_QA_MINILM_L6_COS_V1_TOKENIZER,
} as const;

/**
 * @category Models - Text Embeddings
 */
export const MULTI_QA_MPNET_BASE_DOT_V1 = {
  modelName: 'multi-qa-mpnet-base-dot-v1',
  modelSource: MULTI_QA_MPNET_BASE_DOT_V1_MODEL,
  tokenizerSource: MULTI_QA_MPNET_BASE_DOT_V1_TOKENIZER,
} as const;

/**
 * @category Models - Text Embeddings
 */
export const CLIP_VIT_BASE_PATCH32_TEXT = {
  modelName: 'clip-vit-base-patch32-text',
  modelSource: CLIP_VIT_BASE_PATCH32_TEXT_MODEL,
  tokenizerSource: CLIP_VIT_BASE_PATCH32_TEXT_TOKENIZER,
} as const;

// Image generation

/**
 * @category Models - Image Generation
 */
export const BK_SDM_TINY_VPRED_512 = {
  modelName: 'bk-sdm-tiny-vpred-512',
  schedulerSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/scheduler/scheduler_config.json`,
  tokenizerSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/tokenizer/tokenizer.json`,
  encoderSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/text_encoder/model.pte`,
  unetSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/unet/model.pte`,
  decoderSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/vae/model.pte`,
} as const;

/**
 * @category Models - Image Generation
 */
export const BK_SDM_TINY_VPRED_256 = {
  modelName: 'bk-sdm-tiny-vpred-256',
  schedulerSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/scheduler/scheduler_config.json`,
  tokenizerSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/tokenizer/tokenizer.json`,
  encoderSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/text_encoder/model.pte`,
  unetSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/unet/model.256.pte`,
  decoderSource: `${URL_PREFIX}-bk-sdm-tiny/${VERSION_TAG}/vae/model.256.pte`,
} as const;

// Voice Activity Detection
const FSMN_VAD_MODEL = `${URL_PREFIX}-fsmn-vad/${VERSION_TAG}/xnnpack/fsmn-vad_xnnpack.pte`;

/**
 * @category Models - Voice Activity Detection
 */
export const FSMN_VAD = {
  modelName: 'fsmn-vad',
  modelSource: FSMN_VAD_MODEL,
} as const;
