import { Platform } from 'react-native';
import {
  PRIVACY_FILTER_NEMOTRON_LABELS,
  PRIVACY_FILTER_OPENAI_LABELS,
} from './privacyFilterLabels';
import { URL_PREFIX, PREVIOUS_VERSION_TAG } from './versions';

// LLMs

// LLAMA 3.2
const LLAMA3_2_3B_MODEL = `${URL_PREFIX}-llama-3.2/${PREVIOUS_VERSION_TAG}/3b/xnnpack/llama_3_2_3b_xnnpack_bf16.pte`;
// Pinned to v0.8.0 — the last HF tag where the QLoRA files live; SpinQuant
// supersedes them in later releases.
const LLAMA3_2_3B_QLORA_MODEL = `${URL_PREFIX}-llama-3.2/resolve/v0.8.0/llama-3.2-3B/QLoRA/llama3_2-3B_qat_lora.pte`;
const LLAMA3_2_3B_SPINQUANT_MODEL = `${URL_PREFIX}-llama-3.2/${PREVIOUS_VERSION_TAG}/3b/xnnpack/llama_3_2_3b_xnnpack_spinquant.pte`;
const LLAMA3_2_1B_MODEL = `${URL_PREFIX}-llama-3.2/${PREVIOUS_VERSION_TAG}/1b/xnnpack/llama_3_2_1b_xnnpack_bf16.pte`;
// Pinned to v0.8.0 — see note above on LLAMA3_2_3B_QLORA_MODEL.
const LLAMA3_2_1B_QLORA_MODEL = `${URL_PREFIX}-llama-3.2/resolve/v0.8.0/llama-3.2-1B/QLoRA/llama3_2_qat_lora.pte`;
const LLAMA3_2_1B_SPINQUANT_MODEL = `${URL_PREFIX}-llama-3.2/${PREVIOUS_VERSION_TAG}/1b/xnnpack/llama_3_2_1b_xnnpack_spinquant.pte`;
const LLAMA3_2_TOKENIZER = `${URL_PREFIX}-llama-3.2/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const LLAMA3_2_TOKENIZER_CONFIG = `${URL_PREFIX}-llama-3.2/${PREVIOUS_VERSION_TAG}/tokenizer_config.json`;

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
 * @deprecated Use `LLAMA3_2_3B_SPINQUANT` instead — SpinQuant is the
 * canonical quantized Llama 3.2 3B variant going forward. This alias
 * still resolves the v0.8.0 file for back-compat and will be removed in
 * a future major release.
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
 * @deprecated Use `LLAMA3_2_1B_SPINQUANT` instead — SpinQuant is the
 * canonical quantized Llama 3.2 1B variant going forward. This alias
 * still resolves the v0.8.0 file for back-compat and will be removed in
 * a future major release.
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
const QWEN3_0_6B_MODEL = `${URL_PREFIX}-qwen-3/${PREVIOUS_VERSION_TAG}/0_6b/xnnpack/qwen_3_0_6b_xnnpack_bf16.pte`;
const QWEN3_0_6B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3/${PREVIOUS_VERSION_TAG}/0_6b/xnnpack/qwen_3_0_6b_xnnpack_8da4w.pte`;
const QWEN3_1_7B_MODEL = `${URL_PREFIX}-qwen-3/${PREVIOUS_VERSION_TAG}/1_7b/xnnpack/qwen_3_1_7b_xnnpack_bf16.pte`;
const QWEN3_1_7B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3/${PREVIOUS_VERSION_TAG}/1_7b/xnnpack/qwen_3_1_7b_xnnpack_8da4w.pte`;
const QWEN3_4B_MODEL = `${URL_PREFIX}-qwen-3/${PREVIOUS_VERSION_TAG}/4b/xnnpack/qwen_3_4b_xnnpack_bf16.pte`;
const QWEN3_4B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3/${PREVIOUS_VERSION_TAG}/4b/xnnpack/qwen_3_4b_xnnpack_8da4w.pte`;
const QWEN3_TOKENIZER = `${URL_PREFIX}-qwen-3/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const QWEN3_TOKENIZER_CONFIG = `${URL_PREFIX}-qwen-3/${PREVIOUS_VERSION_TAG}/tokenizer_config.json`;

// Qwen3's published generation_config.json recommends temperature=0.6 and
// top_p=0.95. We propagate those to every Qwen3 preset so model quality is
// reasonable out of the box; users can override via `configure()`.
const QWEN3_GENERATION_CONFIG = {
  temperature: 0.6,
  topP: 0.95,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_0_6B = {
  modelName: 'qwen3-0.6b',
  modelSource: QWEN3_0_6B_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
  generationConfig: QWEN3_GENERATION_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_0_6B_QUANTIZED = {
  modelName: 'qwen3-0.6b-quantized',
  modelSource: QWEN3_0_6B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
  generationConfig: QWEN3_GENERATION_CONFIG,
} as const;

// GEMMA 4
const GEMMA4_E2B_XNNPACK = `${URL_PREFIX}-gemma-4/${PREVIOUS_VERSION_TAG}/e2b/xnnpack/gemma_4_e2b_xnnpack_8da4w.pte`;
const GEMMA4_E2B_VULKAN = `${URL_PREFIX}-gemma-4/${PREVIOUS_VERSION_TAG}/e2b/vulkan/gemma_4_e2b_vulkan_8da4w.pte`;
const GEMMA4_E2B_XNNPACK_MM = `${URL_PREFIX}-gemma-4-multimodal/${PREVIOUS_VERSION_TAG}/e2b/xnnpack/gemma_4_e2b_xnnpack_8da4w.pte`;
const GEMMA4_E2B_VULKAN_MM = `${URL_PREFIX}-gemma-4-multimodal/${PREVIOUS_VERSION_TAG}/e2b/vulkan/gemma_4_e2b_vulkan_8da4w.pte`;
const GEMMA4_TOKENIZER = `${URL_PREFIX}-gemma-4/${PREVIOUS_VERSION_TAG}/e2b/xnnpack/tokenizer.json`;
const GEMMA4_TOKENIZER_CONFIG = `${URL_PREFIX}-gemma-4/${PREVIOUS_VERSION_TAG}/e2b/xnnpack/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const GEMMA4_E2B = {
  modelName: 'gemma4-e2b',
  modelSource:
    Platform.OS === `android` ? GEMMA4_E2B_VULKAN : GEMMA4_E2B_XNNPACK,
  tokenizerSource: GEMMA4_TOKENIZER,
  tokenizerConfigSource: GEMMA4_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - VLM
 */
export const GEMMA4_E2B_MM = {
  modelName: 'gemma4-e2b-multimodal',
  modelSource:
    Platform.OS === `android` ? GEMMA4_E2B_VULKAN_MM : GEMMA4_E2B_XNNPACK_MM,
  tokenizerSource: GEMMA4_TOKENIZER,
  tokenizerConfigSource: GEMMA4_TOKENIZER_CONFIG,
  capabilities: ['vision', 'audio'],
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_1_7B = {
  modelName: 'qwen3-1.7b',
  modelSource: QWEN3_1_7B_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
  generationConfig: QWEN3_GENERATION_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_1_7B_QUANTIZED = {
  modelName: 'qwen3-1.7b-quantized',
  modelSource: QWEN3_1_7B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
  generationConfig: QWEN3_GENERATION_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_4B = {
  modelName: 'qwen3-4b',
  modelSource: QWEN3_4B_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
  generationConfig: QWEN3_GENERATION_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const QWEN3_4B_QUANTIZED = {
  modelName: 'qwen3-4b-quantized',
  modelSource: QWEN3_4B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_TOKENIZER,
  tokenizerConfigSource: QWEN3_TOKENIZER_CONFIG,
  generationConfig: QWEN3_GENERATION_CONFIG,
} as const;

// HAMMER 2.1
const HAMMER2_1_0_5B_MODEL = `${URL_PREFIX}-hammer-2.1/${PREVIOUS_VERSION_TAG}/0_5b/xnnpack/hammer_2_1_0_5b_xnnpack_bf16.pte`;
const HAMMER2_1_0_5B_QUANTIZED_MODEL = `${URL_PREFIX}-hammer-2.1/${PREVIOUS_VERSION_TAG}/0_5b/xnnpack/hammer_2_1_0_5b_xnnpack_8da4w.pte`;
const HAMMER2_1_1_5B_MODEL = `${URL_PREFIX}-hammer-2.1/${PREVIOUS_VERSION_TAG}/1_5b/xnnpack/hammer_2_1_1_5b_xnnpack_bf16.pte`;
const HAMMER2_1_1_5B_QUANTIZED_MODEL = `${URL_PREFIX}-hammer-2.1/${PREVIOUS_VERSION_TAG}/1_5b/xnnpack/hammer_2_1_1_5b_xnnpack_8da4w.pte`;
const HAMMER2_1_3B_MODEL = `${URL_PREFIX}-hammer-2.1/${PREVIOUS_VERSION_TAG}/3b/xnnpack/hammer_2_1_3b_xnnpack_bf16.pte`;
const HAMMER2_1_3B_QUANTIZED_MODEL = `${URL_PREFIX}-hammer-2.1/${PREVIOUS_VERSION_TAG}/3b/xnnpack/hammer_2_1_3b_xnnpack_8da4w.pte`;
const HAMMER2_1_TOKENIZER = `${URL_PREFIX}-hammer-2.1/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const HAMMER2_1_TOKENIZER_CONFIG = `${URL_PREFIX}-hammer-2.1/${PREVIOUS_VERSION_TAG}/tokenizer_config.json`;

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
const SMOLLM2_1_135M_MODEL = `${URL_PREFIX}-smolLm-2/${PREVIOUS_VERSION_TAG}/135m/xnnpack/smollm2_135m_xnnpack_bf16.pte`;
const SMOLLM2_1_135M_QUANTIZED_MODEL = `${URL_PREFIX}-smolLm-2/${PREVIOUS_VERSION_TAG}/135m/xnnpack/smollm2_135m_xnnpack_8da4w.pte`;
const SMOLLM2_1_360M_MODEL = `${URL_PREFIX}-smolLm-2/${PREVIOUS_VERSION_TAG}/360m/xnnpack/smollm2_360m_xnnpack_bf16.pte`;
const SMOLLM2_1_360M_QUANTIZED_MODEL = `${URL_PREFIX}-smolLm-2/${PREVIOUS_VERSION_TAG}/360m/xnnpack/smollm2_360m_xnnpack_8da4w.pte`;
const SMOLLM2_1_1_7B_MODEL = `${URL_PREFIX}-smolLm-2/${PREVIOUS_VERSION_TAG}/1_7b/xnnpack/smollm2_1_7b_xnnpack_bf16.pte`;
const SMOLLM2_1_1_7B_QUANTIZED_MODEL = `${URL_PREFIX}-smolLm-2/${PREVIOUS_VERSION_TAG}/1_7b/xnnpack/smollm2_1_7b_xnnpack_8da4w.pte`;
const SMOLLM2_1_TOKENIZER = `${URL_PREFIX}-smolLm-2/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const SMOLLM2_1_TOKENIZER_CONFIG = `${URL_PREFIX}-smolLm-2/${PREVIOUS_VERSION_TAG}/tokenizer_config.json`;

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
const QWEN2_5_0_5B_MODEL = `${URL_PREFIX}-qwen-2.5/${PREVIOUS_VERSION_TAG}/0_5b/xnnpack/qwen_2_5_0_5b_xnnpack_bf16.pte`;
const QWEN2_5_0_5B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-2.5/${PREVIOUS_VERSION_TAG}/0_5b/xnnpack/qwen_2_5_0_5b_xnnpack_8da4w.pte`;
const QWEN2_5_1_5B_MODEL = `${URL_PREFIX}-qwen-2.5/${PREVIOUS_VERSION_TAG}/1_5b/xnnpack/qwen_2_5_1_5b_xnnpack_bf16.pte`;
const QWEN2_5_1_5B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-2.5/${PREVIOUS_VERSION_TAG}/1_5b/xnnpack/qwen_2_5_1_5b_xnnpack_8da4w.pte`;
const QWEN2_5_3B_MODEL = `${URL_PREFIX}-qwen-2.5/${PREVIOUS_VERSION_TAG}/3b/xnnpack/qwen_2_5_3b_xnnpack_bf16.pte`;
const QWEN2_5_3B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-2.5/${PREVIOUS_VERSION_TAG}/3b/xnnpack/qwen_2_5_3b_xnnpack_8da4w.pte`;
const QWEN2_5_TOKENIZER = `${URL_PREFIX}-qwen-2.5/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const QWEN2_5_TOKENIZER_CONFIG = `${URL_PREFIX}-qwen-2.5/${PREVIOUS_VERSION_TAG}/tokenizer_config.json`;

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

// QWEN3.5-0.8B
const QWEN3_5_0_8B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3.5/${PREVIOUS_VERSION_TAG}/0_8b/xnnpack/qwen_3_5_0_8b_xnnpack_8da4w.pte`;
const QWEN3_5_0_8B_TOKENIZER = `${URL_PREFIX}-qwen-3.5/${PREVIOUS_VERSION_TAG}/0_8b/tokenizer.json`;
const QWEN3_5_0_8B_TOKENIZER_CONFIG = `${URL_PREFIX}-qwen-3.5/${PREVIOUS_VERSION_TAG}/0_8b/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const QWEN3_5_0_8B_QUANTIZED = {
  modelName: 'qwen3.5-0.8b-quantized',
  modelSource: QWEN3_5_0_8B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_5_0_8B_TOKENIZER,
  tokenizerConfigSource: QWEN3_5_0_8B_TOKENIZER_CONFIG,
} as const;

// QWEN3.5-2B
const QWEN3_5_2B_QUANTIZED_MODEL = `${URL_PREFIX}-qwen-3.5/${PREVIOUS_VERSION_TAG}/2b/xnnpack/qwen_3_5_2b_xnnpack_8da4w.pte`;
const QWEN3_5_2B_TOKENIZER = `${URL_PREFIX}-qwen-3.5/${PREVIOUS_VERSION_TAG}/2b/tokenizer.json`;
const QWEN3_5_2B_TOKENIZER_CONFIG = `${URL_PREFIX}-qwen-3.5/${PREVIOUS_VERSION_TAG}/2b/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const QWEN3_5_2B_QUANTIZED = {
  modelName: 'qwen3.5-2b-quantized',
  modelSource: QWEN3_5_2B_QUANTIZED_MODEL,
  tokenizerSource: QWEN3_5_2B_TOKENIZER,
  tokenizerConfigSource: QWEN3_5_2B_TOKENIZER_CONFIG,
} as const;

// PHI 4
const PHI_4_MINI_4B_MODEL = `${URL_PREFIX}-phi-4-mini/${PREVIOUS_VERSION_TAG}/xnnpack/phi_4_mini_xnnpack_bf16.pte`;
const PHI_4_MINI_4B_QUANTIZED_MODEL = `${URL_PREFIX}-phi-4-mini/${PREVIOUS_VERSION_TAG}/xnnpack/phi_4_mini_xnnpack_8da4w.pte`;
const PHI_4_MINI_TOKENIZER = `${URL_PREFIX}-phi-4-mini/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const PHI_4_MINI_TOKENIZER_CONFIG = `${URL_PREFIX}-phi-4-mini/${PREVIOUS_VERSION_TAG}/tokenizer_config.json`;

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
const LFM2_5_1_2B_INSTRUCT_MODEL = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/1_2b/xnnpack/lfm_2_5_1_2b_xnnpack_fp16.pte`;
const LFM2_5_1_2B_INSTRUCT_QUANTIZED_MODEL = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/1_2b/xnnpack/lfm_2_5_1_2b_xnnpack_8da4w.pte`;
const LFM2_5_1_2B_TOKENIZER = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/1_2b/tokenizer.json`;
const LFM2_5_1_2B_TOKENIZER_CONFIG = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/1_2b/tokenizer_config.json`;

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

// LFM2.5-350M
const LFM2_5_350M_MODEL = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/350m/xnnpack/lfm_2_5_350m_xnnpack_fp16.pte`;
const LFM2_5_350M_QUANTIZED_MODEL = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/350m/xnnpack/lfm_2_5_350m_xnnpack_8da4w.pte`;
const LFM2_5_350M_TOKENIZER = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/350m/tokenizer.json`;
const LFM2_5_350M_TOKENIZER_CONFIG = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/350m/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const LFM2_5_350M = {
  modelName: 'lfm2.5-350m',
  modelSource: LFM2_5_350M_MODEL,
  tokenizerSource: LFM2_5_350M_TOKENIZER,
  tokenizerConfigSource: LFM2_5_350M_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const LFM2_5_350M_QUANTIZED = {
  modelName: 'lfm2.5-350m-quantized',
  modelSource: LFM2_5_350M_QUANTIZED_MODEL,
  tokenizerSource: LFM2_5_350M_TOKENIZER,
  tokenizerConfigSource: LFM2_5_350M_TOKENIZER_CONFIG,
} as const;

// Bielik-v3.0
const BIELIK_V3_0_1_5B_MODEL = `${URL_PREFIX}-bielik-v3.0/${PREVIOUS_VERSION_TAG}/xnnpack/bielik_v3_0_1_5b_xnnpack_fp16.pte`;
const BIELIK_V3_0_1_5B_QUANTIZED_MODEL = `${URL_PREFIX}-bielik-v3.0/${PREVIOUS_VERSION_TAG}/xnnpack/bielik_v3_0_1_5b_xnnpack_8da4w.pte`;
const BIELIK_V3_0_TOKENIZER = `${URL_PREFIX}-bielik-v3.0/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const BIELIK_V3_0_TOKENIZER_CONFIG = `${URL_PREFIX}-bielik-v3.0/${PREVIOUS_VERSION_TAG}/tokenizer_config.json`;

/**
 * @category Models - LLM
 */
export const BIELIK_V3_0_1_5B = {
  modelName: 'bielik-v3.0-1.5b',
  modelSource: BIELIK_V3_0_1_5B_MODEL,
  tokenizerSource: BIELIK_V3_0_TOKENIZER,
  tokenizerConfigSource: BIELIK_V3_0_TOKENIZER_CONFIG,
} as const;

/**
 * @category Models - LLM
 */
export const BIELIK_V3_0_1_5B_QUANTIZED = {
  modelName: 'bielik-v3.0-1.5b-quantized',
  modelSource: BIELIK_V3_0_1_5B_QUANTIZED_MODEL,
  tokenizerSource: BIELIK_V3_0_TOKENIZER,
  tokenizerConfigSource: BIELIK_V3_0_TOKENIZER_CONFIG,
} as const;

// LFM2.5-VL-1.6B
const LFM2_VL_1_6B_QUANTIZED_MODEL = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/vl_1_6b/xnnpack/lfm_2_5_vl_1_6b_xnnpack_8da4w.pte`;
const LFM2_VL_1_6B_TOKENIZER = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/vl_1_6b/tokenizer.json`;
const LFM2_VL_1_6B_TOKENIZER_CONFIG = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/vl_1_6b/tokenizer_config.json`;

// LFM2.5-VL-450M
const LFM2_VL_450M_QUANTIZED_MODEL = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/vl_450m/xnnpack/lfm_2_5_vl_450m_xnnpack_8da4w.pte`;
const LFM2_VL_450M_TOKENIZER = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/vl_450m/tokenizer.json`;
const LFM2_VL_450M_TOKENIZER_CONFIG = `${URL_PREFIX}-lfm-2.5/${PREVIOUS_VERSION_TAG}/vl_450m/tokenizer_config.json`;

/**
 * @category Models - VLM
 */
// LiquidAI's LFM2-VL model card recommends the following sampling settings.
// Without them the model often produces generic / repetitive responses.
const LFM2_5_VL_GENERATION_CONFIG = {
  temperature: 0.1,
  minP: 0.15,
  repetitionPenalty: 1.05,
} as const;

/**
 * @category Models - VLM
 */
export const LFM2_5_VL_1_6B_QUANTIZED = {
  modelName: 'lfm2.5-vl-1.6b-quantized',
  capabilities: ['vision'],
  modelSource: LFM2_VL_1_6B_QUANTIZED_MODEL,
  tokenizerSource: LFM2_VL_1_6B_TOKENIZER,
  tokenizerConfigSource: LFM2_VL_1_6B_TOKENIZER_CONFIG,
  generationConfig: LFM2_5_VL_GENERATION_CONFIG,
} as const;

/**
 * @category Models - VLM
 */
export const LFM2_5_VL_450M_QUANTIZED = {
  modelName: 'lfm2.5-vl-450m-quantized',
  capabilities: ['vision'],
  modelSource: LFM2_VL_450M_QUANTIZED_MODEL,
  tokenizerSource: LFM2_VL_450M_TOKENIZER,
  tokenizerConfigSource: LFM2_VL_450M_TOKENIZER_CONFIG,
  generationConfig: LFM2_5_VL_GENERATION_CONFIG,
} as const;

/**
 * @deprecated Use `LFM2_5_VL_1_6B_QUANTIZED` instead — the model is from the
 * LFM2.5 family. This alias will be removed in a future major release.
 * @category Models - VLM
 */
export const LFM2_VL_1_6B_QUANTIZED = LFM2_5_VL_1_6B_QUANTIZED;

/**
 * @deprecated Use `LFM2_5_VL_450M_QUANTIZED` instead — the model is from the
 * LFM2.5 family. This alias will be removed in a future major release.
 * @category Models - VLM
 */
export const LFM2_VL_450M_QUANTIZED = LFM2_5_VL_450M_QUANTIZED;

// Classification
export const EFFICIENTNET_V2_S_XNNPACK_FP32_MODEL = `${URL_PREFIX}-efficientnet-v2-s/${PREVIOUS_VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_fp32.pte`;
export const EFFICIENTNET_V2_S_XNNPACK_INT8_MODEL = `${URL_PREFIX}-efficientnet-v2-s/${PREVIOUS_VERSION_TAG}/xnnpack/efficientnet_v2_s_xnnpack_int8.pte`;
export const EFFICIENTNET_V2_S_COREML_FP32_MODEL = `${URL_PREFIX}-efficientnet-v2-s/${PREVIOUS_VERSION_TAG}/coreml/efficientnet_v2_s_coreml_fp32.pte`;
export const EFFICIENTNET_V2_S_COREML_FP16_MODEL = `${URL_PREFIX}-efficientnet-v2-s/${PREVIOUS_VERSION_TAG}/coreml/efficientnet_v2_s_coreml_fp16.pte`;
const EFFICIENTNET_V2_S_MODEL =
  Platform.OS === `ios`
    ? EFFICIENTNET_V2_S_COREML_FP32_MODEL
    : EFFICIENTNET_V2_S_XNNPACK_FP32_MODEL;
const EFFICIENTNET_V2_S_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? EFFICIENTNET_V2_S_COREML_FP16_MODEL
    : EFFICIENTNET_V2_S_XNNPACK_INT8_MODEL;

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
export const SSDLITE_320_MOBILENET_V3_LARGE_XNNPACK_FP32_MODEL = `${URL_PREFIX}-ssdlite320-mobilenet-v3-large/${PREVIOUS_VERSION_TAG}/xnnpack/ssdlite320_mobilenet_v3_large_xnnpack_fp32.pte`;
export const SSDLITE_320_MOBILENET_V3_LARGE_COREML_FP16_MODEL = `${URL_PREFIX}-ssdlite320-mobilenet-v3-large/${PREVIOUS_VERSION_TAG}/coreml/ssdlite320_mobilenet_v3_large_coreml_fp16.pte`;
export const RF_DETR_NANO_XNNPACK_FP32_MODEL = `${URL_PREFIX}-rfdetr-nano-detector/${PREVIOUS_VERSION_TAG}/xnnpack/rfdetr_nano_xnnpack_fp32.pte`;
export const RF_DETR_NANO_COREML_INT8_MODEL = `${URL_PREFIX}-rfdetr-nano-detector/${PREVIOUS_VERSION_TAG}/coreml/rfdetr_nano_coreml_int8.pte`;
const SSDLITE_320_MOBILENET_V3_LARGE_MODEL =
  Platform.OS === 'ios'
    ? SSDLITE_320_MOBILENET_V3_LARGE_COREML_FP16_MODEL
    : SSDLITE_320_MOBILENET_V3_LARGE_XNNPACK_FP32_MODEL;
const RF_DETR_NANO_MODEL =
  Platform.OS === 'ios'
    ? RF_DETR_NANO_COREML_INT8_MODEL
    : RF_DETR_NANO_XNNPACK_FP32_MODEL;

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
const YOLO26N_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${PREVIOUS_VERSION_TAG}/n/xnnpack/yolo26_n_xnnpack_fp32.pte`;
const YOLO26S_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${PREVIOUS_VERSION_TAG}/s/xnnpack/yolo26_s_xnnpack_fp32.pte`;
const YOLO26M_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${PREVIOUS_VERSION_TAG}/m/xnnpack/yolo26_m_xnnpack_fp32.pte`;
const YOLO26L_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${PREVIOUS_VERSION_TAG}/l/xnnpack/yolo26_l_xnnpack_fp32.pte`;
const YOLO26X_DETECTION_MODEL = `${URL_PREFIX}-yolo26/${PREVIOUS_VERSION_TAG}/x/xnnpack/yolo26_x_xnnpack_fp32.pte`;

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

// YOLO26 Pose Estimation
const YOLO26N_POSE_MODEL = `${URL_PREFIX}-yolo26-pose/${PREVIOUS_VERSION_TAG}/xnnpack/yolo26_pose_n_xnnpack_fp32.pte`;

/**
 * @category Models - Pose Estimation
 */
export const YOLO26N_POSE = {
  modelName: 'yolo26n-pose',
  modelSource: YOLO26N_POSE_MODEL,
} as const;

// Style transfer
/**
 * Builds the four `(backend, precision)` URLs for a single style-transfer style.
 * @param display - HF repo suffix (e.g. `rain-princess`).
 * @param slug - .pte filename token (e.g. `rain_princess`). Differs from
 *   `display` for styles whose names contain spaces.
 * @returns Per-(backend, precision) URLs for the requested style.
 */
export function styleTransferUrls<
  const Display extends string,
  const Slug extends string,
>(display: Display, slug: Slug) {
  return {
    xnnpackBase: `${URL_PREFIX}-style-transfer-${display}/${PREVIOUS_VERSION_TAG}/xnnpack/style_transfer_${slug}_xnnpack_fp32.pte`,
    xnnpackQuant: `${URL_PREFIX}-style-transfer-${display}/${PREVIOUS_VERSION_TAG}/xnnpack/style_transfer_${slug}_xnnpack_int8.pte`,
    coremlBase: `${URL_PREFIX}-style-transfer-${display}/${PREVIOUS_VERSION_TAG}/coreml/style_transfer_${slug}_coreml_fp32.pte`,
    coremlQuant: `${URL_PREFIX}-style-transfer-${display}/${PREVIOUS_VERSION_TAG}/coreml/style_transfer_${slug}_coreml_fp16.pte`,
  };
}
const STYLE_TRANSFER_CANDY_URLS = styleTransferUrls('candy', 'candy');
const STYLE_TRANSFER_MOSAIC_URLS = styleTransferUrls('mosaic', 'mosaic');
const STYLE_TRANSFER_RAIN_PRINCESS_URLS = styleTransferUrls(
  'rain-princess',
  'rain_princess'
);
const STYLE_TRANSFER_UDNIE_URLS = styleTransferUrls('udnie', 'udnie');
const STYLE_TRANSFER_CANDY_MODEL =
  Platform.OS === `ios`
    ? STYLE_TRANSFER_CANDY_URLS.coremlBase
    : STYLE_TRANSFER_CANDY_URLS.xnnpackBase;
const STYLE_TRANSFER_CANDY_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? STYLE_TRANSFER_CANDY_URLS.coremlQuant
    : STYLE_TRANSFER_CANDY_URLS.xnnpackQuant;
const STYLE_TRANSFER_MOSAIC_MODEL =
  Platform.OS === `ios`
    ? STYLE_TRANSFER_MOSAIC_URLS.coremlBase
    : STYLE_TRANSFER_MOSAIC_URLS.xnnpackBase;
const STYLE_TRANSFER_MOSAIC_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? STYLE_TRANSFER_MOSAIC_URLS.coremlQuant
    : STYLE_TRANSFER_MOSAIC_URLS.xnnpackQuant;
const STYLE_TRANSFER_RAIN_PRINCESS_MODEL =
  Platform.OS === `ios`
    ? STYLE_TRANSFER_RAIN_PRINCESS_URLS.coremlBase
    : STYLE_TRANSFER_RAIN_PRINCESS_URLS.xnnpackBase;
const STYLE_TRANSFER_RAIN_PRINCESS_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? STYLE_TRANSFER_RAIN_PRINCESS_URLS.coremlQuant
    : STYLE_TRANSFER_RAIN_PRINCESS_URLS.xnnpackQuant;
const STYLE_TRANSFER_UDNIE_MODEL =
  Platform.OS === `ios`
    ? STYLE_TRANSFER_UDNIE_URLS.coremlBase
    : STYLE_TRANSFER_UDNIE_URLS.xnnpackBase;
const STYLE_TRANSFER_UDNIE_QUANTIZED_MODEL =
  Platform.OS === `ios`
    ? STYLE_TRANSFER_UDNIE_URLS.coremlQuant
    : STYLE_TRANSFER_UDNIE_URLS.xnnpackQuant;

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
export const WHISPER_TINY_EN_TOKENIZER = `${URL_PREFIX}-whisper-tiny.en/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
export const WHISPER_TINY_EN_MODEL_XNNPACK = `${URL_PREFIX}-whisper-tiny.en/${PREVIOUS_VERSION_TAG}/xnnpack/whisper_tiny_en_xnnpack_fp32.pte`;
export const WHISPER_TINY_EN_MODEL_COREML = `${URL_PREFIX}-whisper-tiny.en/${PREVIOUS_VERSION_TAG}/coreml/whisper_tiny_en_coreml_fp32.pte`;

export const WHISPER_BASE_EN_TOKENIZER = `${URL_PREFIX}-whisper-base.en/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
export const WHISPER_BASE_EN_MODEL_XNNPACK = `${URL_PREFIX}-whisper-base.en/${PREVIOUS_VERSION_TAG}/xnnpack/whisper_base_en_xnnpack_fp32.pte`;
export const WHISPER_BASE_EN_MODEL_COREML = `${URL_PREFIX}-whisper-base.en/${PREVIOUS_VERSION_TAG}/coreml/whisper_base_en_coreml_fp32.pte`;

export const WHISPER_SMALL_EN_TOKENIZER = `${URL_PREFIX}-whisper-small.en/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
export const WHISPER_SMALL_EN_MODEL_XNNPACK = `${URL_PREFIX}-whisper-small.en/${PREVIOUS_VERSION_TAG}/xnnpack/whisper_small_en_xnnpack_fp32.pte`;
export const WHISPER_SMALL_EN_MODEL_COREML = `${URL_PREFIX}-whisper-small.en/${PREVIOUS_VERSION_TAG}/coreml/whisper_small_en_coreml_fp32.pte`;

export const WHISPER_TINY_TOKENIZER = `${URL_PREFIX}-whisper-tiny/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
export const WHISPER_TINY_MODEL_XNNPACK = `${URL_PREFIX}-whisper-tiny/${PREVIOUS_VERSION_TAG}/xnnpack/whisper_tiny_xnnpack_fp32.pte`;
export const WHISPER_TINY_MODEL_COREML = `${URL_PREFIX}-whisper-tiny/${PREVIOUS_VERSION_TAG}/coreml/whisper_tiny_coreml_fp32.pte`;

export const WHISPER_BASE_TOKENIZER = `${URL_PREFIX}-whisper-base/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
export const WHISPER_BASE_MODEL_XNNPACK = `${URL_PREFIX}-whisper-base/${PREVIOUS_VERSION_TAG}/xnnpack/whisper_base_xnnpack_fp32.pte`;
export const WHISPER_BASE_MODEL_COREML = `${URL_PREFIX}-whisper-base/${PREVIOUS_VERSION_TAG}/coreml/whisper_base_coreml_fp32.pte`;

export const WHISPER_SMALL_TOKENIZER = `${URL_PREFIX}-whisper-small/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
export const WHISPER_SMALL_MODEL_XNNPACK = `${URL_PREFIX}-whisper-small/${PREVIOUS_VERSION_TAG}/xnnpack/whisper_small_xnnpack_fp32.pte`;
export const WHISPER_SMALL_MODEL_COREML = `${URL_PREFIX}-whisper-small/${PREVIOUS_VERSION_TAG}/coreml/whisper_small_coreml_fp32.pte`;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_TINY_EN = {
  modelName: 'whisper-tiny-en',
  isMultilingual: false,
  modelSource:
    Platform.OS === 'ios'
      ? WHISPER_TINY_EN_MODEL_COREML
      : WHISPER_TINY_EN_MODEL_XNNPACK,
  tokenizerSource: WHISPER_TINY_EN_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_BASE_EN = {
  modelName: 'whisper-base-en',
  isMultilingual: false,
  modelSource:
    Platform.OS === 'ios'
      ? WHISPER_BASE_EN_MODEL_COREML
      : WHISPER_BASE_EN_MODEL_XNNPACK,
  tokenizerSource: WHISPER_BASE_EN_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_SMALL_EN = {
  modelName: 'whisper-small-en',
  isMultilingual: false,
  modelSource:
    Platform.OS === 'ios'
      ? WHISPER_SMALL_EN_MODEL_COREML
      : WHISPER_SMALL_EN_MODEL_XNNPACK,
  tokenizerSource: WHISPER_SMALL_EN_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_TINY = {
  modelName: 'whisper-tiny',
  isMultilingual: true,
  modelSource:
    Platform.OS === 'ios'
      ? WHISPER_TINY_MODEL_COREML
      : WHISPER_TINY_MODEL_XNNPACK,
  tokenizerSource: WHISPER_TINY_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_BASE = {
  modelName: 'whisper-base',
  isMultilingual: true,
  modelSource:
    Platform.OS === 'ios'
      ? WHISPER_BASE_MODEL_COREML
      : WHISPER_BASE_MODEL_XNNPACK,
  tokenizerSource: WHISPER_BASE_TOKENIZER,
} as const;

/**
 * @category Models - Speech To Text
 */
export const WHISPER_SMALL = {
  modelName: 'whisper-small',
  isMultilingual: true,
  modelSource:
    Platform.OS === 'ios'
      ? WHISPER_SMALL_MODEL_COREML
      : WHISPER_SMALL_MODEL_XNNPACK,
  tokenizerSource: WHISPER_SMALL_TOKENIZER,
} as const;

// Semantic Segmentation
const DEEPLAB_V3_RESNET50_MODEL = `${URL_PREFIX}-deeplab-v3/${PREVIOUS_VERSION_TAG}/xnnpack/deeplab_v3_resnet50_xnnpack_fp32.pte`;
const DEEPLAB_V3_RESNET101_MODEL = `${URL_PREFIX}-deeplab-v3/${PREVIOUS_VERSION_TAG}/xnnpack/deeplab_v3_resnet101_xnnpack_fp32.pte`;
const DEEPLAB_V3_MOBILENET_V3_LARGE_MODEL = `${URL_PREFIX}-deeplab-v3/${PREVIOUS_VERSION_TAG}/xnnpack/deeplab_v3_mobilenet_v3_large_xnnpack_fp32.pte`;
const LRASPP_MOBILENET_V3_LARGE_MODEL = `${URL_PREFIX}-lraspp/${PREVIOUS_VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_fp32.pte`;
const FCN_RESNET50_MODEL = `${URL_PREFIX}-fcn/${PREVIOUS_VERSION_TAG}/xnnpack/fcn_resnet50_xnnpack_fp32.pte`;
const FCN_RESNET101_MODEL = `${URL_PREFIX}-fcn/${PREVIOUS_VERSION_TAG}/xnnpack/fcn_resnet101_xnnpack_fp32.pte`;
const DEEPLAB_V3_RESNET50_QUANTIZED_MODEL = `${URL_PREFIX}-deeplab-v3/${PREVIOUS_VERSION_TAG}/xnnpack/deeplab_v3_resnet50_xnnpack_int8.pte`;
const DEEPLAB_V3_RESNET101_QUANTIZED_MODEL = `${URL_PREFIX}-deeplab-v3/${PREVIOUS_VERSION_TAG}/xnnpack/deeplab_v3_resnet101_xnnpack_int8.pte`;
const DEEPLAB_V3_MOBILENET_V3_LARGE_QUANTIZED_MODEL = `${URL_PREFIX}-deeplab-v3/${PREVIOUS_VERSION_TAG}/xnnpack/deeplab_v3_mobilenet_v3_large_xnnpack_int8.pte`;
const LRASPP_MOBILENET_V3_LARGE_QUANTIZED_MODEL = `${URL_PREFIX}-lraspp/${PREVIOUS_VERSION_TAG}/xnnpack/lraspp_mobilenet_v3_large_xnnpack_int8.pte`;
const FCN_RESNET50_QUANTIZED_MODEL = `${URL_PREFIX}-fcn/${PREVIOUS_VERSION_TAG}/xnnpack/fcn_resnet50_xnnpack_int8.pte`;
const FCN_RESNET101_QUANTIZED_MODEL = `${URL_PREFIX}-fcn/${PREVIOUS_VERSION_TAG}/xnnpack/fcn_resnet101_xnnpack_int8.pte`;

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

const SELFIE_SEGMENTATION_MODEL = `${URL_PREFIX}-selfie-segmentation/${PREVIOUS_VERSION_TAG}/xnnpack/selfie_segmentation_xnnpack_fp32.pte`;

/**
 * @category Models - Semantic Segmentation
 */
export const SELFIE_SEGMENTATION = {
  modelName: 'selfie-segmentation',
  modelSource: SELFIE_SEGMENTATION_MODEL,
} as const;

// FastSAM Instance Segmentation
export const FASTSAM_S_XNNPACK_FP32_MODEL = `${URL_PREFIX}-fast-sam/${PREVIOUS_VERSION_TAG}/s/xnnpack/fast_sam_s_xnnpack_fp32.pte`;
export const FASTSAM_S_COREML_FP16_MODEL = `${URL_PREFIX}-fast-sam/${PREVIOUS_VERSION_TAG}/s/coreml/fast_sam_s_coreml_fp16.pte`;
export const FASTSAM_X_XNNPACK_FP32_MODEL = `${URL_PREFIX}-fast-sam/${PREVIOUS_VERSION_TAG}/x/xnnpack/fast_sam_x_xnnpack_fp32.pte`;
export const FASTSAM_X_COREML_FP16_MODEL = `${URL_PREFIX}-fast-sam/${PREVIOUS_VERSION_TAG}/x/coreml/fast_sam_x_coreml_fp16.pte`;
const FASTSAM_S_SEG_MODEL =
  Platform.OS === 'ios'
    ? FASTSAM_S_COREML_FP16_MODEL
    : FASTSAM_S_XNNPACK_FP32_MODEL;
const FASTSAM_X_SEG_MODEL =
  Platform.OS === 'ios'
    ? FASTSAM_X_COREML_FP16_MODEL
    : FASTSAM_X_XNNPACK_FP32_MODEL;

/**
 * @category Models - Instance Segmentation
 */
export const FASTSAM_S = {
  modelName: 'fastsam-s',
  modelSource: FASTSAM_S_SEG_MODEL,
} as const;

/**
 * @category Models - Instance Segmentation
 */
export const FASTSAM_X = {
  modelName: 'fastsam-x',
  modelSource: FASTSAM_X_SEG_MODEL,
} as const;

/**
 * @category Models - Instance Segmentation
 */
const YOLO26N_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${PREVIOUS_VERSION_TAG}/n/xnnpack/yolo26_seg_n_xnnpack_fp32.pte`;
const YOLO26S_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${PREVIOUS_VERSION_TAG}/s/xnnpack/yolo26_seg_s_xnnpack_fp32.pte`;
const YOLO26M_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${PREVIOUS_VERSION_TAG}/m/xnnpack/yolo26_seg_m_xnnpack_fp32.pte`;
const YOLO26L_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${PREVIOUS_VERSION_TAG}/l/xnnpack/yolo26_seg_l_xnnpack_fp32.pte`;
const YOLO26X_SEG_MODEL = `${URL_PREFIX}-yolo26-seg/${PREVIOUS_VERSION_TAG}/x/xnnpack/yolo26_seg_x_xnnpack_fp32.pte`;
export const RF_DETR_NANO_SEG_XNNPACK_FP32_MODEL = `${URL_PREFIX}-rfdetr-nano-segmentation/${PREVIOUS_VERSION_TAG}/xnnpack/rfdetr_nano_xnnpack_fp32.pte`;
export const RF_DETR_NANO_SEG_COREML_INT8_MODEL = `${URL_PREFIX}-rfdetr-nano-segmentation/${PREVIOUS_VERSION_TAG}/coreml/rfdetr_nano_coreml_int8.pte`;
const RF_DETR_NANO_SEG_MODEL =
  Platform.OS === 'ios'
    ? RF_DETR_NANO_SEG_COREML_INT8_MODEL
    : RF_DETR_NANO_SEG_XNNPACK_FP32_MODEL;
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
const CLIP_VIT_BASE_PATCH32_IMAGE_MODEL = `${URL_PREFIX}-clip-vit-base-patch32/${PREVIOUS_VERSION_TAG}/xnnpack/clip_vit_base_patch32_image_xnnpack_fp32.pte`;
const CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED_MODEL = `${URL_PREFIX}-clip-vit-base-patch32/${PREVIOUS_VERSION_TAG}/xnnpack/clip_vit_base_patch32_image_xnnpack_int8.pte`;

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
const ALL_MINILM_L6_V2_MODEL = `${URL_PREFIX}-all-MiniLM-L6-v2/${PREVIOUS_VERSION_TAG}/xnnpack/all_minilm_l6_v2_xnnpack_fp32.pte`;
const ALL_MINILM_L6_V2_TOKENIZER = `${URL_PREFIX}-all-MiniLM-L6-v2/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const ALL_MPNET_BASE_V2_MODEL = `${URL_PREFIX}-all-mpnet-base-v2/${PREVIOUS_VERSION_TAG}/xnnpack/all_mpnet_base_v2_xnnpack_fp32.pte`;
const ALL_MPNET_BASE_V2_TOKENIZER = `${URL_PREFIX}-all-mpnet-base-v2/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const MULTI_QA_MINILM_L6_COS_V1_MODEL = `${URL_PREFIX}-multi-qa-MiniLM-L6-cos-v1/${PREVIOUS_VERSION_TAG}/xnnpack/multi_qa_minilm_l6_cos_v1_xnnpack_fp32.pte`;
const MULTI_QA_MINILM_L6_COS_V1_TOKENIZER = `${URL_PREFIX}-multi-qa-MiniLM-L6-cos-v1/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const MULTI_QA_MPNET_BASE_DOT_V1_MODEL = `${URL_PREFIX}-multi-qa-mpnet-base-dot-v1/${PREVIOUS_VERSION_TAG}/xnnpack/multi_qa_mpnet_base_dot_v1_xnnpack_fp32.pte`;
const MULTI_QA_MPNET_BASE_DOT_V1_TOKENIZER = `${URL_PREFIX}-multi-qa-mpnet-base-dot-v1/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
export const DISTILUSE_BASE_MULTILINGUAL_CASED_V2_8DA4W_MODEL = `${URL_PREFIX}-distiluse-base-multilingual-cased-v2/${PREVIOUS_VERSION_TAG}/xnnpack/distiluse_base_multilingual_cased_v2_xnnpack_8da4w.pte`;
export const DISTILUSE_BASE_MULTILINGUAL_CASED_V2_TOKENIZER = `${URL_PREFIX}-distiluse-base-multilingual-cased-v2/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_QUANTIZED_MODEL = `${URL_PREFIX}-paraphrase-multilingual-MiniLM-L12-v2/${PREVIOUS_VERSION_TAG}/xnnpack/paraphrase_multilingual_minilm_l12_v2_xnnpack_8da4w.pte`;
const PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_TOKENIZER = `${URL_PREFIX}-paraphrase-multilingual-MiniLM-L12-v2/${PREVIOUS_VERSION_TAG}/tokenizer.json`;
const CLIP_VIT_BASE_PATCH32_TEXT_MODEL = `${URL_PREFIX}-clip-vit-base-patch32/${PREVIOUS_VERSION_TAG}/xnnpack/clip_vit_base_patch32_text_xnnpack_fp32.pte`;
const CLIP_VIT_BASE_PATCH32_TEXT_TOKENIZER = `${URL_PREFIX}-clip-vit-base-patch32/${PREVIOUS_VERSION_TAG}/tokenizer.json`;

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
 * @deprecated Use `models.text_embedding.distiluse_base_multilingual_cased_v2()`.
 */
export const DISTILUSE_BASE_MULTILINGUAL_CASED_V2_8DA4W = {
  modelName: 'distiluse-base-multilingual-cased-v2-8da4w',
  modelSource: DISTILUSE_BASE_MULTILINGUAL_CASED_V2_8DA4W_MODEL,
  tokenizerSource: DISTILUSE_BASE_MULTILINGUAL_CASED_V2_TOKENIZER,
} as const;

/**
 * @category Models - Text Embeddings
 */
export const PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_QUANTIZED = {
  modelName: 'paraphrase-multilingual-minilm-l12-v2-quantized',
  modelSource: PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_QUANTIZED_MODEL,
  tokenizerSource: PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_TOKENIZER,
} as const;

/**
 * @category Models - Text Embeddings
 */
export const CLIP_VIT_BASE_PATCH32_TEXT = {
  modelName: 'clip-vit-base-patch32-text',
  modelSource: CLIP_VIT_BASE_PATCH32_TEXT_MODEL,
  tokenizerSource: CLIP_VIT_BASE_PATCH32_TEXT_TOKENIZER,
} as const;

// Privacy Filter (PII detection)
//
// Both supported variants share the same architecture (8-layer MoE,
// 128-token banded attention) and tokenizer (o200k, pad/eos id 199999).
// They differ only in the BIOES label space; the runner expects the
// matching `labelNames` array to be passed at load time.

/**
 * openai/privacy-filter — base PII detector with 8 entity types
 * (account_number, private_address, private_date, private_email,
 * private_person, private_phone, private_url, secret).
 * @category Models - Privacy Filter
 */
export const PRIVACY_FILTER_OPENAI = {
  modelName: 'privacy-filter-openai',
  modelSource: `${URL_PREFIX}-privacy-filter-openai/${PREVIOUS_VERSION_TAG}/xnnpack/privacy_filter_openai_xnnpack_8da4w.pte`,
  tokenizerSource: `${URL_PREFIX}-privacy-filter-openai/${PREVIOUS_VERSION_TAG}/tokenizer.json`,
  labelNames: PRIVACY_FILTER_OPENAI_LABELS,
} as const;

/**
 * OpenMed/privacy-filter-nemotron — extended PII detector with 55 entity
 * types (adds medical, financial, identity, technical, demographic, etc.).
 * Same base architecture as the OpenAI model, larger label space.
 * @category Models - Privacy Filter
 */
export const PRIVACY_FILTER_NEMOTRON = {
  modelName: 'privacy-filter-nemotron',
  modelSource: `${URL_PREFIX}-privacy-filter-nemotron/${PREVIOUS_VERSION_TAG}/xnnpack/privacy_filter_nemotron_xnnpack_8da4w.pte`,
  tokenizerSource: `${URL_PREFIX}-privacy-filter-nemotron/${PREVIOUS_VERSION_TAG}/tokenizer.json`,
  labelNames: PRIVACY_FILTER_NEMOTRON_LABELS,
} as const;

// Image generation

/**
 * @category Models - Image Generation
 */
export const BK_SDM_TINY_VPRED_512 = {
  modelName: 'bk-sdm-tiny-vpred-512',
  schedulerSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/scheduler/scheduler_config.json`,
  tokenizerSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/tokenizer/tokenizer.json`,
  encoderSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/xnnpack/bk_sdm_tiny_text_encoder_xnnpack_fp32.pte`,
  unetSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/xnnpack/bk_sdm_tiny_unet_xnnpack_fp32.pte`,
  decoderSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/xnnpack/bk_sdm_tiny_vae_xnnpack_fp32.pte`,
} as const;

/**
 * @category Models - Image Generation
 */
export const BK_SDM_TINY_VPRED_256 = {
  modelName: 'bk-sdm-tiny-vpred-256',
  schedulerSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/scheduler/scheduler_config.json`,
  tokenizerSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/tokenizer/tokenizer.json`,
  encoderSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/xnnpack/bk_sdm_tiny_text_encoder_xnnpack_fp32.pte`,
  unetSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/xnnpack/bk_sdm_tiny_unet_256_xnnpack_fp32.pte`,
  decoderSource: `${URL_PREFIX}-bk-sdm-tiny/${PREVIOUS_VERSION_TAG}/xnnpack/bk_sdm_tiny_vae_256_xnnpack_fp32.pte`,
} as const;

// Voice Activity Detection
const FSMN_VAD_MODEL = `${URL_PREFIX}-fsmn-vad/${PREVIOUS_VERSION_TAG}/xnnpack/fsmn_vad_xnnpack_fp32.pte`;

/**
 * @category Models - Voice Activity Detection
 */
export const FSMN_VAD = {
  modelName: 'fsmn-vad',
  modelSource: FSMN_VAD_MODEL,
} as const;

// Internal — populates the urlToModelName lookup below. Not exported: the
// typed grouping lives in `./modelRegistry` as `models`.
const _ALL_MODELS = [
  LLAMA3_2_3B,
  LLAMA3_2_3B_QLORA,
  LLAMA3_2_3B_SPINQUANT,
  LLAMA3_2_1B,
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_1B_SPINQUANT,
  QWEN3_0_6B,
  QWEN3_0_6B_QUANTIZED,
  QWEN3_1_7B,
  QWEN3_1_7B_QUANTIZED,
  QWEN3_4B,
  QWEN3_4B_QUANTIZED,
  QWEN3_5_0_8B_QUANTIZED,
  QWEN3_5_2B_QUANTIZED,
  HAMMER2_1_0_5B,
  HAMMER2_1_0_5B_QUANTIZED,
  HAMMER2_1_1_5B,
  HAMMER2_1_1_5B_QUANTIZED,
  HAMMER2_1_3B,
  HAMMER2_1_3B_QUANTIZED,
  SMOLLM2_1_135M,
  SMOLLM2_1_135M_QUANTIZED,
  SMOLLM2_1_360M,
  SMOLLM2_1_360M_QUANTIZED,
  SMOLLM2_1_1_7B,
  SMOLLM2_1_1_7B_QUANTIZED,
  QWEN2_5_0_5B,
  QWEN2_5_0_5B_QUANTIZED,
  QWEN2_5_1_5B,
  QWEN2_5_1_5B_QUANTIZED,
  QWEN2_5_3B,
  QWEN2_5_3B_QUANTIZED,
  PHI_4_MINI_4B,
  PHI_4_MINI_4B_QUANTIZED,
  LFM2_5_350M,
  LFM2_5_350M_QUANTIZED,
  LFM2_5_1_2B_INSTRUCT,
  LFM2_5_1_2B_INSTRUCT_QUANTIZED,
  LFM2_5_VL_1_6B_QUANTIZED,
  LFM2_5_VL_450M_QUANTIZED,
  BIELIK_V3_0_1_5B,
  BIELIK_V3_0_1_5B_QUANTIZED,
  EFFICIENTNET_V2_S,
  EFFICIENTNET_V2_S_QUANTIZED,
  SSDLITE_320_MOBILENET_V3_LARGE,
  RF_DETR_NANO,
  STYLE_TRANSFER_CANDY,
  STYLE_TRANSFER_CANDY_QUANTIZED,
  STYLE_TRANSFER_MOSAIC,
  STYLE_TRANSFER_MOSAIC_QUANTIZED,
  STYLE_TRANSFER_RAIN_PRINCESS,
  STYLE_TRANSFER_RAIN_PRINCESS_QUANTIZED,
  STYLE_TRANSFER_UDNIE,
  STYLE_TRANSFER_UDNIE_QUANTIZED,
  WHISPER_TINY_EN,
  WHISPER_BASE_EN,
  WHISPER_SMALL_EN,
  WHISPER_TINY,
  WHISPER_BASE,
  WHISPER_SMALL,
  DEEPLAB_V3_RESNET50,
  DEEPLAB_V3_RESNET101,
  DEEPLAB_V3_MOBILENET_V3_LARGE,
  LRASPP_MOBILENET_V3_LARGE,
  FCN_RESNET50,
  FCN_RESNET101,
  DEEPLAB_V3_RESNET50_QUANTIZED,
  DEEPLAB_V3_RESNET101_QUANTIZED,
  DEEPLAB_V3_MOBILENET_V3_LARGE_QUANTIZED,
  LRASPP_MOBILENET_V3_LARGE_QUANTIZED,
  FCN_RESNET50_QUANTIZED,
  FCN_RESNET101_QUANTIZED,
  SELFIE_SEGMENTATION,
  YOLO26N_SEG,
  YOLO26S_SEG,
  YOLO26M_SEG,
  YOLO26L_SEG,
  YOLO26X_SEG,
  RF_DETR_NANO_SEG,
  FASTSAM_S,
  FASTSAM_X,
  CLIP_VIT_BASE_PATCH32_IMAGE,
  CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED,
  ALL_MINILM_L6_V2,
  ALL_MPNET_BASE_V2,
  MULTI_QA_MINILM_L6_COS_V1,
  MULTI_QA_MPNET_BASE_DOT_V1,
  DISTILUSE_BASE_MULTILINGUAL_CASED_V2_8DA4W,
  PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_QUANTIZED,
  CLIP_VIT_BASE_PATCH32_TEXT,
  BK_SDM_TINY_VPRED_512,
  BK_SDM_TINY_VPRED_256,
  FSMN_VAD,
  PRIVACY_FILTER_OPENAI,
  PRIVACY_FILTER_NEMOTRON,
];

const urlToModelName = new Map<string, string>();
for (const config of _ALL_MODELS) {
  const modelName = config.modelName;
  for (const [key, value] of Object.entries(config)) {
    if (key !== 'modelName' && typeof value === 'string') {
      urlToModelName.set(value, modelName);
    }
  }
}

/**
 * Looks up the model name for a given source URL.
 * @param url - The source URL to look up.
 * @returns The model name if found, otherwise undefined.
 */
export function getModelNameForUrl(url: string): string | undefined {
  return urlToModelName.get(url);
}
