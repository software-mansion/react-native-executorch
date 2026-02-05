import { URL_PREFIX, VERSION_TAG } from '../versions';

// Text to speech (tts) - Kokoro model(s)
const KOKORO_EN_MODELS_ROOT = `${URL_PREFIX}-kokoro/${VERSION_TAG}/xnnpack`;
const KOKORO_EN_SMALL_MODELS_ROOT = `${KOKORO_EN_MODELS_ROOT}/small`;
const KOKORO_EN_MEDIUM_MODELS_ROOT = `${KOKORO_EN_MODELS_ROOT}/medium`;

/**
 * A Kokoro model instance which processes the text in batches of maximum 64 tokens.
 * Uses significant less memory than the medium model, but could produce
 * a lower quality speech due to forced, aggressive text splitting.
 */
export const KOKORO_SMALL = {
  type: 'kokoro' as const,
  durationPredictorSource: `${KOKORO_EN_SMALL_MODELS_ROOT}/duration_predictor.pte`,
  synthesizerSource: `${KOKORO_EN_SMALL_MODELS_ROOT}/synthesizer.pte`,
};

/**
 * A standard Kokoro instance which processes the text in batches of maximum 128 tokens.
 */
export const KOKORO_MEDIUM = {
  type: 'kokoro' as const,
  durationPredictorSource: `${KOKORO_EN_MEDIUM_MODELS_ROOT}/duration_predictor.pte`,
  synthesizerSource: `${KOKORO_EN_MEDIUM_MODELS_ROOT}/synthesizer.pte`,
};
