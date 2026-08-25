import { Platform } from 'react-native';
import { URL_PREFIX, PREVIOUS_VERSION_TAG, VERSION_TAG } from '../versions';

// Text to speech (tts) - Kokoro model(s)
const KOKORO_MODEL_ROOT = `${URL_PREFIX}-kokoro/${PREVIOUS_VERSION_TAG}/xnnpack`;
const KOKORO_COREML_MODEL_ROOT = `${URL_PREFIX}-kokoro/${VERSION_TAG}/coreml`;
const KOKORO_STANDARD_MODEL_ROOT = `${KOKORO_MODEL_ROOT}/standard`;
const KOKORO_COREML_STANDARD_MODEL_ROOT = `${KOKORO_COREML_MODEL_ROOT}/standard`;
const KOKORO_POLISH_MODEL_ROOT = `${KOKORO_MODEL_ROOT}/polish`;
const KOKORO_GERMAN_MODEL_ROOT = `${KOKORO_MODEL_ROOT}/german`;

/**
 * The standard Kokoro instance with the synthesizer running on Core ML. iOS only.
 *
 * The synthesizer is the expensive half of Kokoro. On an iPhone 16 this build
 * produces 7.4 s of audio in 627 ms, against 4741 ms for the XNNPACK one, at the
 * cost of a one-time compile on the first call that is cached across launches.
 * The duration predictor stays on XNNPACK, so this config mixes backends.
 *
 * Use {@link KOKORO_STANDARD} on Android.
 * @category Models - Text to Speech
 */
export const KOKORO_STANDARD_COREML = {
  modelName: 'kokoro' as const,
  durationPredictorSource: `${KOKORO_STANDARD_MODEL_ROOT}/duration_predictor_std.pte`,
  synthesizerSource: `${KOKORO_COREML_STANDARD_MODEL_ROOT}/synthesizer_coreml_fp32.pte`,
};

/**
 * A standard Kokoro instance which processes the text in batches of maximum 128 tokens.
 * Works well with built-in languages: english, spanish, french, italian, portuguese and hindi.
 * @category Models - Text to Speech
 */
export const KOKORO_STANDARD = {
  modelName: 'kokoro' as const,
  durationPredictorSource: `${KOKORO_STANDARD_MODEL_ROOT}/duration_predictor_std.pte`,
  synthesizerSource: `${KOKORO_STANDARD_MODEL_ROOT}/synthesizer_std.pte`,
};

/**
 * A fine-tuned Kokoro instance for Polish.
 * @category Models - Text to Speech
 */
export const KOKORO_POLISH = {
  modelName: 'kokoro' as const,
  durationPredictorSource: `${KOKORO_POLISH_MODEL_ROOT}/duration_predictor_pl.pte`,
  synthesizerSource: `${KOKORO_POLISH_MODEL_ROOT}/synthesizer_pl.pte`,
};

/**
 * A fine-tuned Kokoro instance for German.
 * @category Models - Text to Speech
 */
export const KOKORO_GERMAN = {
  modelName: 'kokoro' as const,
  durationPredictorSource: `${KOKORO_GERMAN_MODEL_ROOT}/duration_predictor_de.pte`,
  synthesizerSource: `${KOKORO_GERMAN_MODEL_ROOT}/synthesizer_de.pte`,
};

// Text to speech (tts) - Supertonic 3 model
const SUPERTONIC_MODEL_ROOT = `${URL_PREFIX}-supertonic/${VERSION_TAG}`;
const SUPERTONIC_XNNPACK_ROOT = `${SUPERTONIC_MODEL_ROOT}/xnnpack`;
const SUPERTONIC_MLX_ROOT = `${SUPERTONIC_MODEL_ROOT}/mlx`;

const SUPERTONIC_BACKEND_ROOT =
  Platform.OS === 'ios' ? SUPERTONIC_MLX_ROOT : SUPERTONIC_XNNPACK_ROOT;
const SUPERTONIC_BACKEND_PREFIX =
  Platform.OS === 'ios' ? 'mlx_fp32' : 'xnnpack_fp32';

/**
 * Supertonic 3 — a multilingual (31 languages + `na` fallback) flow-matching
 * @category Models - Text to Speech
 */
export const SUPERTONIC = {
  modelName: 'supertonic' as const,
  unicodeIndexerSource: `${SUPERTONIC_MODEL_ROOT}/unicode_indexer.json`,
  durationPredictorSource: `${SUPERTONIC_BACKEND_ROOT}/duration_predictor_${SUPERTONIC_BACKEND_PREFIX}.pte`,
  textEncoderSource: `${SUPERTONIC_BACKEND_ROOT}/text_encoder_${SUPERTONIC_BACKEND_PREFIX}.pte`,
  vectorEstimatorSource: `${SUPERTONIC_BACKEND_ROOT}/vector_estimator_${SUPERTONIC_BACKEND_PREFIX}.pte`,
  vocoderSource: `${SUPERTONIC_BACKEND_ROOT}/vocoder_${SUPERTONIC_BACKEND_PREFIX}.pte`,
};

/**
 * Supertonic 3 XNNPACK variant (Android default).
 * @category Models - Text to Speech
 */
export const SUPERTONIC_XNNPACK = {
  modelName: 'supertonic' as const,
  unicodeIndexerSource: `${SUPERTONIC_MODEL_ROOT}/unicode_indexer.json`,
  durationPredictorSource: `${SUPERTONIC_XNNPACK_ROOT}/duration_predictor_xnnpack_fp32.pte`,
  textEncoderSource: `${SUPERTONIC_XNNPACK_ROOT}/text_encoder_xnnpack_fp32.pte`,
  vectorEstimatorSource: `${SUPERTONIC_XNNPACK_ROOT}/vector_estimator_xnnpack_fp32.pte`,
  vocoderSource: `${SUPERTONIC_XNNPACK_ROOT}/vocoder_xnnpack_fp32.pte`,
};

/**
 * Supertonic 3 MLX variant (iOS default).
 * @category Models - Text to Speech
 */
export const SUPERTONIC_MLX = {
  modelName: 'supertonic' as const,
  unicodeIndexerSource: `${SUPERTONIC_MODEL_ROOT}/unicode_indexer.json`,
  durationPredictorSource: `${SUPERTONIC_MLX_ROOT}/duration_predictor_mlx_fp32.pte`,
  textEncoderSource: `${SUPERTONIC_MLX_ROOT}/text_encoder_mlx_fp32.pte`,
  vectorEstimatorSource: `${SUPERTONIC_MLX_ROOT}/vector_estimator_mlx_fp32.pte`,
  vocoderSource: `${SUPERTONIC_MLX_ROOT}/vocoder_mlx_fp32.pte`,
};
