import { NEXT_VERSION_TAG, URL_PREFIX } from '../versions';

// Text to speech (tts) - Kokoro model(s)
const KOKORO_MODEL_ROOT = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/xnnpack`;

/**
 * A standard Kokoro instance which processes the text in batches of maximum 128 tokens.
 * @category Models - Text to Speech
 */
export const KOKORO = {
  modelName: 'kokoro' as const,
  durationPredictorSource: `${KOKORO_MODEL_ROOT}/duration_predictor.pte`,
  synthesizerSource: `${KOKORO_MODEL_ROOT}/synthesizer.pte`,
};
