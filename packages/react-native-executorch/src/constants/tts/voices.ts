import { KokoroVoiceExtras, VoiceConfig } from '../../types/tts';
import { URL_PREFIX, VERSION_TAG } from '../versions';

// Kokoro voices - phonemizers
const KOKORO_PHONEMIZER_PREFIX = `${URL_PREFIX}-kokoro/${VERSION_TAG}/phonemizer`;
const KOKORO_PHONEMIZER_TAGGER_DATA = `${KOKORO_PHONEMIZER_PREFIX}/tags.json`;
const KOKORO_PHONEMIZER_LEXICON_EN_US_DATA = `${KOKORO_PHONEMIZER_PREFIX}/us_merged.json`;
const KOKORO_PHONEMIZER_LEXICON_EN_GB_DATA = `${KOKORO_PHONEMIZER_PREFIX}/gb_merged.json`;

const EN_US_RESOURCES = {
  taggerSource: KOKORO_PHONEMIZER_TAGGER_DATA,
  lexiconSource: KOKORO_PHONEMIZER_LEXICON_EN_US_DATA,
} as KokoroVoiceExtras;
const EN_GB_RESOURCES = {
  taggerSource: KOKORO_PHONEMIZER_TAGGER_DATA,
  lexiconSource: KOKORO_PHONEMIZER_LEXICON_EN_GB_DATA,
} as KokoroVoiceExtras;

// Kokoro voices
const KOKORO_VOICE_PREFIX = `${URL_PREFIX}-kokoro/${VERSION_TAG}/voices`;
export const KOKORO_VOICE_AF_HEART = {
  lang: 'en-us' as const,
  voiceSource: `${KOKORO_VOICE_PREFIX}/af_heart.bin`,
  extra: EN_US_RESOURCES,
} as VoiceConfig;
export const KOKORO_VOICE_AF_RIVER = {
  lang: 'en-us' as const,
  voiceSource: `${KOKORO_VOICE_PREFIX}/af_river.bin`,
  extra: EN_US_RESOURCES,
} as VoiceConfig;
export const KOKORO_VOICE_AF_SARAH = {
  lang: 'en-us' as const,
  voiceSource: `${KOKORO_VOICE_PREFIX}/af_sarah.bin`,
  extra: EN_US_RESOURCES,
} as VoiceConfig;
export const KOKORO_VOICE_AM_ADAM = {
  lang: 'en-us' as const,
  voiceSource: `${KOKORO_VOICE_PREFIX}/am_adam.bin`,
  extra: EN_US_RESOURCES,
} as VoiceConfig;
export const KOKORO_VOICE_AM_MICHAEL = {
  lang: 'en-us' as const,
  voiceSource: `${KOKORO_VOICE_PREFIX}/am_michael.bin`,
  extra: EN_US_RESOURCES,
} as VoiceConfig;
export const KOKORO_VOICE_AM_SANTA = {
  lang: 'en-us' as const,
  voiceSource: `${KOKORO_VOICE_PREFIX}/am_santa.bin`,
  extra: EN_US_RESOURCES,
} as VoiceConfig;
export const KOKORO_VOICE_BF_EMMA = {
  lang: 'en-gb' as const,
  voiceSource: `${KOKORO_VOICE_PREFIX}/bf_emma.bin`,
  extra: EN_GB_RESOURCES,
} as VoiceConfig;
export const KOKORO_VOICE_BM_DANIEL = {
  lang: 'en-gb' as const,
  voiceSource: `${KOKORO_VOICE_PREFIX}/bm_daniel.bin`,
  extra: EN_GB_RESOURCES,
} as VoiceConfig;
