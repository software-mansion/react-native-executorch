import { URL_PREFIX, NEXT_VERSION_TAG } from '../versions';

// Text to speech (tts) - Kokoro model(s)
const KOKORO_EN_DURATION_PREDICTOR = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/xnnpack/duration_predictor.pte`;
const KOKORO_EN_F0N_PREDICTOR = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/xnnpack/f0n_predictor.pte`;
const KOKORO_EN_TEXT_ENCODER = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/xnnpack/text_encoder.pte`;
const KOKORO_EN_TEXT_DECODER = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/xnnpack/text_decoder.pte`;

export const KOKORO_EN = {
  type: 'kokoro' as const,
  durationPredictorSource: KOKORO_EN_DURATION_PREDICTOR,
  f0nPredictorSource: KOKORO_EN_F0N_PREDICTOR,
  textEncoderSource: KOKORO_EN_TEXT_ENCODER,
  textDecoderSource: KOKORO_EN_TEXT_DECODER,
};
