import { TextToSpeechModelConfig } from '../../types/tts';
import { PREVIOUS_VERSION_TAG, URL_PREFIX } from '../versions';
import { KOKORO_STANDARD, KOKORO_POLISH, KOKORO_GERMAN } from './models';

// Common prefixes - voices & phonemization data
const KOKORO_VOICE_PREFIX = `${URL_PREFIX}-kokoro/${PREVIOUS_VERSION_TAG}/voices`;
const KOKORO_PHONEMIZER_PREFIX = `${URL_PREFIX}-kokoro/${PREVIOUS_VERSION_TAG}/phonemizer`;

const KOKORO_PHONEMIZER_EN_US_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/en-us`;
const KOKORO_PHONEMIZER_EN_US_TAGGER = `${KOKORO_PHONEMIZER_EN_US_PREFIX}/tags.json`;
const KOKORO_PHONEMIZER_EN_US_LEXICON = `${KOKORO_PHONEMIZER_EN_US_PREFIX}/lexicon.json`;
const KOKORO_PHONEMIZER_EN_US_MODEL = `${KOKORO_PHONEMIZER_EN_US_PREFIX}/phonemizer_en_us.pte`;

const KOKORO_PHONEMIZER_EN_GB_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/en-gb`;
const KOKORO_PHONEMIZER_EN_GB_TAGGER = `${KOKORO_PHONEMIZER_EN_GB_PREFIX}/tags.json`;
const KOKORO_PHONEMIZER_EN_GB_LEXICON = `${KOKORO_PHONEMIZER_EN_GB_PREFIX}/lexicon.json`;
const KOKORO_PHONEMIZER_EN_GB_MODEL = `${KOKORO_PHONEMIZER_EN_GB_PREFIX}/phonemizer_en_gb.pte`;

// French
const KOKORO_PHONEMIZER_FR_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/fr`;
const KOKORO_PHONEMIZER_FR_MODEL = `${KOKORO_PHONEMIZER_FR_PREFIX}/phonemizer_fr.pte`;

// Spanish
const KOKORO_PHONEMIZER_ES_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/es`;
const KOKORO_PHONEMIZER_ES_MODEL = `${KOKORO_PHONEMIZER_ES_PREFIX}/phonemizer_es.pte`;

// Italian
const KOKORO_PHONEMIZER_IT_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/it`;
const KOKORO_PHONEMIZER_IT_MODEL = `${KOKORO_PHONEMIZER_IT_PREFIX}/phonemizer_it.pte`;

// Portuguese
const KOKORO_PHONEMIZER_PT_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/pt`;
const KOKORO_PHONEMIZER_PT_MODEL = `${KOKORO_PHONEMIZER_PT_PREFIX}/phonemizer_pt.pte`;

// Hindi
const KOKORO_PHONEMIZER_HI_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/hi`;
const KOKORO_PHONEMIZER_HI_MODEL = `${KOKORO_PHONEMIZER_HI_PREFIX}/phonemizer_hi.pte`;

// German
const KOKORO_PHONEMIZER_DE_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/de`;
const KOKORO_PHONEMIZER_DE_MODEL = `${KOKORO_PHONEMIZER_DE_PREFIX}/phonemizer_de.pte`;

// Polish
const KOKORO_PHONEMIZER_PL_PREFIX = `${KOKORO_PHONEMIZER_PREFIX}/pl`;
const KOKORO_PHONEMIZER_PL_MODEL = `${KOKORO_PHONEMIZER_PL_PREFIX}/phonemizer_pl.pte`;

// Kokoro voices
/**
 * @category TTS Supported Voices
 */
export const KOKORO_AMERICAN_ENGLISH_FEMALE_HEART = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/af_heart.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_AMERICAN_ENGLISH_FEMALE_RIVER = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/af_river.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_AMERICAN_ENGLISH_FEMALE_SARAH = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/af_sarah.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_AMERICAN_ENGLISH_MALE_ADAM = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/am_adam.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_AMERICAN_ENGLISH_MALE_MICHAEL = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/am_michael.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_AMERICAN_ENGLISH_MALE_SANTA = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/am_santa.bin`,
  phonemizerConfig: {
    lang: 'en-us' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_US_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_US_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_US_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_BRITISH_ENGLISH_FEMALE_EMMA = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/bf_emma.bin`,
  phonemizerConfig: {
    lang: 'en-gb' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_GB_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_GB_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_GB_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_BRITISH_ENGLISH_MALE_DANIEL = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/bm_daniel.bin`,
  phonemizerConfig: {
    lang: 'en-gb' as const,
    taggerSource: KOKORO_PHONEMIZER_EN_GB_TAGGER,
    lexiconSource: KOKORO_PHONEMIZER_EN_GB_LEXICON,
    neuralModelSource: KOKORO_PHONEMIZER_EN_GB_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_FRENCH_FEMALE_SIWIS = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/ff_siwis.bin`,
  phonemizerConfig: {
    lang: 'fr' as const,
    neuralModelSource: KOKORO_PHONEMIZER_FR_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_SPANISH_FEMALE_DORA = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/ef_dora.bin`,
  phonemizerConfig: {
    lang: 'es' as const,
    neuralModelSource: KOKORO_PHONEMIZER_ES_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_SPANISH_MALE_ALEX = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/em_alex.bin`,
  phonemizerConfig: {
    lang: 'es' as const,
    neuralModelSource: KOKORO_PHONEMIZER_ES_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_ITALIAN_FEMALE_SARA = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/if_sara.bin`,
  phonemizerConfig: {
    lang: 'it' as const,
    neuralModelSource: KOKORO_PHONEMIZER_IT_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_ITALIAN_MALE_NICOLA = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/im_nicola.bin`,
  phonemizerConfig: {
    lang: 'it' as const,
    neuralModelSource: KOKORO_PHONEMIZER_IT_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_PORTUGUESE_FEMALE_DORA = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/pf_dora.bin`,
  phonemizerConfig: {
    lang: 'pt' as const,
    neuralModelSource: KOKORO_PHONEMIZER_PT_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_PORTUGUESE_MALE_SANTA = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/pm_santa.bin`,
  phonemizerConfig: {
    lang: 'pt' as const,
    neuralModelSource: KOKORO_PHONEMIZER_PT_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_HINDI_FEMALE_ALPHA = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/hf_alpha.bin`,
  phonemizerConfig: {
    lang: 'hi' as const,
    neuralModelSource: KOKORO_PHONEMIZER_HI_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_HINDI_MALE_OMEGA = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/hm_omega.bin`,
  phonemizerConfig: {
    lang: 'hi' as const,
    neuralModelSource: KOKORO_PHONEMIZER_HI_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_HINDI_MALE_PSI = {
  model: KOKORO_STANDARD,
  voiceSource: `${KOKORO_VOICE_PREFIX}/hm_psi.bin`,
  phonemizerConfig: {
    lang: 'hi' as const,
    neuralModelSource: KOKORO_PHONEMIZER_HI_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_POLISH_MALE_MATEUSZ = {
  model: KOKORO_POLISH,
  voiceSource: `${KOKORO_VOICE_PREFIX}/pm_mateusz.bin`,
  phonemizerConfig: {
    lang: 'pl' as const,
    neuralModelSource: KOKORO_PHONEMIZER_PL_MODEL,
  },
} as TextToSpeechModelConfig;

/**
 * @category TTS Supported Voices
 */
export const KOKORO_GERMAN_FEMALE_ANNA = {
  model: KOKORO_GERMAN,
  voiceSource: `${KOKORO_VOICE_PREFIX}/df_anna.bin`,
  phonemizerConfig: {
    lang: 'de' as const,
    neuralModelSource: KOKORO_PHONEMIZER_DE_MODEL,
  },
} as TextToSpeechModelConfig;
