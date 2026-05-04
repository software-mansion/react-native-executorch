import { NEXT_VERSION_TAG, URL_PREFIX } from '../versions';

// Text to speech (tts) - Kokoro model(s)
const KOKORO_MODEL_ROOT = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/xnnpack`;
const KOKORO_STANDARD_MODEL_ROOT = `${KOKORO_MODEL_ROOT}/standard`;
const KOKORO_POLISH_MODEL_ROOT = `${KOKORO_MODEL_ROOT}/polish`;

/**
 * A standard Kokoro instance which processes the text in batches of maximum 128 tokens.
 * Works well with built-in languages: english, spanish, french, italian, portugese and hindi.
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
