import { TextToSpeechLanguage } from '../../types/tts';
import { URL_PREFIX, NEXT_VERSION_TAG } from '../modelUrls';

// Kokoro voices - phonemizers
const KOKORO_PHONEMIZER_PREFIX = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/phonemizer`;
const KOKORO_PHONEMIZER_TAGGER_DATA = `${KOKORO_PHONEMIZER_PREFIX}/tags.json`;
const KOKORO_PHONEMIZER_LEXICON_EN_US_DATA = `${KOKORO_PHONEMIZER_PREFIX}/us_merged.json`;
const KOKORO_PHONEMIZER_LEXICON_EN_GB_DATA = `${KOKORO_PHONEMIZER_PREFIX}/gb_merged.json`;

// Kokoro voices
const KOKORO_VOICE_PREFIX = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/voices`;
export const KOKORO_VOICE_AF_HEART = {
  language: 'en_us' as TextToSpeechLanguage,
  data: `${KOKORO_VOICE_PREFIX}/af_heart.bin`,
  extra: {
    tagger: KOKORO_PHONEMIZER_TAGGER_DATA,
    lexicon: KOKORO_PHONEMIZER_LEXICON_EN_US_DATA,
  },
};
export const KOKORO_VOICE_AF_RIVER = {
  language: 'en_us' as TextToSpeechLanguage,
  data: `${KOKORO_VOICE_PREFIX}/af_river.bin`,
  extra: {
    tagger: KOKORO_PHONEMIZER_TAGGER_DATA,
    lexicon: KOKORO_PHONEMIZER_LEXICON_EN_US_DATA,
  },
};
export const KOKORO_VOICE_AF_SARAH = {
  language: 'en_us' as TextToSpeechLanguage,
  data: `${KOKORO_VOICE_PREFIX}/af_sarah.bin`,
  extra: {
    tagger: KOKORO_PHONEMIZER_TAGGER_DATA,
    lexicon: KOKORO_PHONEMIZER_LEXICON_EN_US_DATA,
  },
};
export const KOKORO_VOICE_AM_ADAM = {
  language: 'en_us' as TextToSpeechLanguage,
  data: `${KOKORO_VOICE_PREFIX}/am_adam.bin`,
  extra: {
    tagger: KOKORO_PHONEMIZER_TAGGER_DATA,
    lexicon: KOKORO_PHONEMIZER_LEXICON_EN_US_DATA,
  },
};
export const KOKORO_VOICE_AM_MICHAEL = {
  language: 'en_us' as TextToSpeechLanguage,
  data: `${KOKORO_VOICE_PREFIX}/am_michael.bin`,
  extra: {
    tagger: KOKORO_PHONEMIZER_TAGGER_DATA,
    lexicon: KOKORO_PHONEMIZER_LEXICON_EN_US_DATA,
  },
};
export const KOKORO_VOICE_AM_SANTA = {
  language: 'en_us' as TextToSpeechLanguage,
  data: `${KOKORO_VOICE_PREFIX}/am_santa.bin`,
  extra: {
    tagger: KOKORO_PHONEMIZER_TAGGER_DATA,
    lexicon: KOKORO_PHONEMIZER_LEXICON_EN_US_DATA,
  },
};
export const KOKORO_VOICE_BF_EMMA = {
  language: 'en_gb' as TextToSpeechLanguage,
  data: `${KOKORO_VOICE_PREFIX}/bf_emma.bin`,
  extra: {
    tagger: KOKORO_PHONEMIZER_TAGGER_DATA,
    lexicon: KOKORO_PHONEMIZER_LEXICON_EN_GB_DATA,
  },
};
export const KOKORO_VOICE_BM_DANIEL = {
  language: 'en_gb' as TextToSpeechLanguage,
  data: `${KOKORO_VOICE_PREFIX}/bm_daniel.bin`,
  extra: {
    tagger: KOKORO_PHONEMIZER_TAGGER_DATA,
    lexicon: KOKORO_PHONEMIZER_LEXICON_EN_GB_DATA,
  },
};
