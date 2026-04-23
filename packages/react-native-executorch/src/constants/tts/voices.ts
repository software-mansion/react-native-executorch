import { TextToSpeechVoiceConfig } from '../../types/tts';
import { NEXT_VERSION_TAG, URL_PREFIX } from '../versions';

// Common prefixes - voices & phonemization data
const KOKORO_VOICE_PREFIX = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/voices`;
const KOKORO_PHONEMIZER_PREFIX = `${URL_PREFIX}-kokoro/${NEXT_VERSION_TAG}/phonemizer`;

const KOKORO_PHONEMIZER_EN_US_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/en-us`;
const KOKORO_PHONEMIZER_EN_US_TAGGER = `${KOKORO_PHONEMIZER_EN_US_PREFIX}/tags.json`;
const KOKORO_PHONEMIZER_EN_US_LEXICON = `${KOKORO_PHONEMIZER_EN_US_PREFIX}/lexicon.json`;
const KOKORO_PHONEMIZER_EN_US_MODEL = `${KOKORO_PHONEMIZER_EN_US_PREFIX}/phonemizer_en_us.pte`;

const KOKORO_PHONEMIZER_EN_GB_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/en-gb`;
const KOKORO_PHONEMIZER_EN_GB_TAGGER = `${KOKORO_PHONEMIZER_EN_GB_PREFIX}/tags.json`;
const KOKORO_PHONEMIZER_EN_GB_LEXICON = `${KOKORO_PHONEMIZER_EN_GB_PREFIX}/lexicon.json`;
// const KOKORO_PHONEMIZER_EN_GB_MODEL = `${KOKORO_PHONEMIZER_EN_GB_PREFIX}/phonemizer_en_gb.pte`

// French
const KOKORO_PHONEMIZER_FR_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/fr`;
const KOKORO_PHONEMIZER_FR_MODEL = `${KOKORO_PHONEMIZER_FR_PREFIX}/phonemizer_fr.pte`;

// Spanish
const KOKORO_PHONEMIZER_ES_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/es`;
const KOKORO_PHONEMIZER_ES_MODEL = `${KOKORO_PHONEMIZER_ES_PREFIX}/phonemizer_es.pte`;

// Italian
const KOKORO_PHONEMIZER_IT_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/it`;
const KOKORO_PHONEMIZER_IT_MODEL = `${KOKORO_PHONEMIZER_IT_PREFIX}/phonemizer_it.pte`;

// Kokoro voices
/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_HEART = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/af_heart.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_RIVER = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/af_river.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_SARAH = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/af_sarah.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_AMERICAN_ENGLISH_MALE_ADAM = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/am_adam.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_AMERICAN_ENGLISH_MALE_MICHAEL = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/am_michael.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_AMERICAN_ENGLISH_MALE_SANTA = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/am_santa.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_BRITISH_ENGLISH_FEMALE_EMMA = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/bf_emma.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_GB_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_GB_LEXICON,
    // neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_BRITISH_ENGLISH_MALE_DANIEL = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/bm_daniel.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_GB_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_GB_LEXICON,
    // neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_FRENCH_FEMALE_SIWIS = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/ff_siwis.bin`,
  phonemizerConfig: {
    lang: 'fr' as const,
    neuralModelSource: KOKORO_PHONEMIZER_FR_MODEL,
  },
};

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_SPANISH_FEMALE_DORA = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/ef_dora.bin`,
  phonemizerConfig: {
    lang: 'es' as const,
    neuralModelSource: KOKORO_PHONEMIZER_ES_MODEL,
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_SPANISH_MALE_ALEX = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/em_alex.bin`,
  phonemizerConfig: {
    lang: 'es' as const,
    neuralModelSource: KOKORO_PHONEMIZER_ES_MODEL,
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_ITALIAN_FEMALE_SARA = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/if_sara.bin`,
  phonemizerConfig: {
    lang: 'it' as const,
    neuralModelSource: KOKORO_PHONEMIZER_IT_MODEL,
  },
} as TextToSpeechVoiceConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_VOICE_ITALIAN_MALE_NICOLA = {
  voiceSource: `${KOKORO_VOICE_PREFIX}/im_nicola.bin`,
  phonemizerConfig: {
    lang: 'it' as const,
    neuralModelSource: KOKORO_PHONEMIZER_IT_MODEL,
  },
} as TextToSpeechVoiceConfig;
