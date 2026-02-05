import { alphabets, symbols } from './symbols';

import { URL_PREFIX, VERSION_TAG } from '../versions';

const DETECTOR_CRAFT_MODEL = `${URL_PREFIX}-detector-craft/${VERSION_TAG}/xnnpack_quantized/xnnpack_craft_quantized.pte`;

const createHFRecognizerDownloadUrl = (alphabet: keyof typeof alphabets) =>
  `${URL_PREFIX}-recognizer-crnn.en/${VERSION_TAG}/xnnpack/${alphabet}/xnnpack_crnn_${alphabet}.pte`;

const RECOGNIZER_ENGLISH_CRNN = createHFRecognizerDownloadUrl('english');
const RECOGNIZER_LATIN_CRNN = createHFRecognizerDownloadUrl('latin');
const RECOGNIZER_JAPANESE_CRNN = createHFRecognizerDownloadUrl('japanese');
const RECOGNIZER_KANNADA_CRNN = createHFRecognizerDownloadUrl('kannada');
const RECOGNIZER_KOREAN_CRNN = createHFRecognizerDownloadUrl('korean');
const RECOGNIZER_TELUGU_CRNN = createHFRecognizerDownloadUrl('telugu');
const RECOGNIZER_ZH_SIM_CRNN = createHFRecognizerDownloadUrl('zh_sim');
const RECOGNIZER_CYRILLIC_CRNN = createHFRecognizerDownloadUrl('cyrillic');

const createOCRObject = (
  recognizerSource: string,
  language: keyof typeof symbols
) => {
  return {
    detectorSource: DETECTOR_CRAFT_MODEL,
    recognizerSource,
    language,
  };
};

/**
 * @category OCR Supported Alphabets
 */
export const OCR_ABAZA = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'abq');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_ADYGHE = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'ady');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_AFRIKAANS = createOCRObject(RECOGNIZER_LATIN_CRNN, 'af');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_AVAR = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'ava');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_AZERBAIJANI = createOCRObject(RECOGNIZER_LATIN_CRNN, 'az');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_BELARUSIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'be');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_BULGARIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'bg');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_BOSNIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'bs');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_SIMPLIFIED_CHINESE = createOCRObject(
  RECOGNIZER_ZH_SIM_CRNN,
  'chSim'
);

/**
 * @category OCR Supported Alphabets
 */
export const OCR_CHECHEN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'che');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_CZECH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'cs');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_WELSH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'cy');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_DANISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'da');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_DARGWA = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'dar');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_GERMAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'de');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_ENGLISH = createOCRObject(RECOGNIZER_ENGLISH_CRNN, 'en');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_SPANISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'es');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_ESTONIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'et');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_FRENCH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'fr');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_IRISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ga');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_CROATIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'hr');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_HUNGARIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'hu');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_INDONESIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'id');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_INGUSH = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'inh');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_ICELANDIC = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ic');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_ITALIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'it');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_JAPANESE = createOCRObject(RECOGNIZER_JAPANESE_CRNN, 'ja');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_KARBADIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'kbd');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_KANNADA = createOCRObject(RECOGNIZER_KANNADA_CRNN, 'kn');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_KOREAN = createOCRObject(RECOGNIZER_KOREAN_CRNN, 'ko');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_KURDISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ku');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_LATIN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'la');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_LAK = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'lbe');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_LEZGHIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'lez');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_LITHUANIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'lt');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_LATVIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'lv');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_MAORI = createOCRObject(RECOGNIZER_LATIN_CRNN, 'mi');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_MONGOLIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'mn');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_MALAY = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ms');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_MALTESE = createOCRObject(RECOGNIZER_LATIN_CRNN, 'mt');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_DUTCH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'nl');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_NORWEGIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'no');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_OCCITAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'oc');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_PALI = createOCRObject(RECOGNIZER_LATIN_CRNN, 'pi');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_POLISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'pl');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_PORTUGUESE = createOCRObject(RECOGNIZER_LATIN_CRNN, 'pt');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_ROMANIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ro');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_RUSSIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'ru');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_SERBIAN_CYRILLIC = createOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'rsCyrillic'
);

/**
 * @category OCR Supported Alphabets
 */
export const OCR_SERBIAN_LATIN = createOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'rsLatin'
);

/**
 * @category OCR Supported Alphabets
 */
export const OCR_SLOVAK = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sk');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_SLOVENIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sl');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_ALBANIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sq');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_SWEDISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sv');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_SWAHILI = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sw');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_TABASSARAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'tab');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_TELUGU = createOCRObject(RECOGNIZER_TELUGU_CRNN, 'te');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_TAJIK = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'tjk');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_TAGALOG = createOCRObject(RECOGNIZER_LATIN_CRNN, 'tl');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_TURKISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'tr');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_UKRAINIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'uk');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_UZBEK = createOCRObject(RECOGNIZER_LATIN_CRNN, 'uz');

/**
 * @category OCR Supported Alphabets
 */
export const OCR_VIETNAMESE = createOCRObject(RECOGNIZER_LATIN_CRNN, 'vi');
