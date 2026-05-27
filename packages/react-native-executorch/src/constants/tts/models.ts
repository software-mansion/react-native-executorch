import { URL_PREFIX, VERSION_TAG } from '../versions';

// Text to speech (tts) - Kokoro model(s)
const KOKORO_MODEL_ROOT = `${URL_PREFIX}-kokoro/${VERSION_TAG}/xnnpack`;
const KOKORO_STANDARD_MODEL_ROOT = `${KOKORO_MODEL_ROOT}/standard`;
const KOKORO_POLISH_MODEL_ROOT = `${KOKORO_MODEL_ROOT}/polish`;
const KOKORO_GERMAN_MODEL_ROOT = `${KOKORO_MODEL_ROOT}/german`;

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
