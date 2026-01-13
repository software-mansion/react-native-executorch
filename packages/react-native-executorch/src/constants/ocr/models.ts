import { alphabets, symbols } from './symbols';

import { VERSION_TAG, URL_PREFIX } from '../modelUrls';

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
  recognizer: string,
  language: keyof typeof symbols
) => {
  return {
    detectorSource: DETECTOR_CRAFT_MODEL,
    recognizer,
    language,
  };
};

const createVerticalOCRObject = (
  recognizer: string,
  language: keyof typeof symbols
) => {
  return {
    detectorSource: DETECTOR_CRAFT_MODEL,
    recognizer,
    language,
  };
};

export const OCR_ABAZA = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'abq');
export const VERTICAL_OCR_ABAZA = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'abq'
);

export const OCR_ADYGHE = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'ady');
export const VERTICAL_OCR_ADYGHE = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'ady'
);

export const OCR_AFRIKAANS = createOCRObject(RECOGNIZER_LATIN_CRNN, 'af');
export const VERTICAL_OCR_AFRIKAANS = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'af'
);

export const OCR_AVAR = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'ava');
export const VERTICAL_OCR_AVAR = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'ava'
);

export const OCR_AZERBAIJANI = createOCRObject(RECOGNIZER_LATIN_CRNN, 'az');
export const VERTICAL_OCR_AZERBAIJANI = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'az'
);

export const OCR_BELARUSIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'be');
export const VERTICAL_OCR_BELARUSIAN = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'be'
);

export const OCR_BULGARIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'bg');
export const VERTICAL_OCR_BULGARIAN = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'bg'
);

export const OCR_BOSNIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'bs');
export const VERTICAL_OCR_BOSNIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'bs'
);

export const OCR_SIMPLIFIED_CHINESE = createOCRObject(
  RECOGNIZER_ZH_SIM_CRNN,
  'chSim'
);
export const VERTICAL_OCR_SIMPLIFIED_CHINESE = createVerticalOCRObject(
  RECOGNIZER_ZH_SIM_CRNN,
  'chSim'
);

export const OCR_CHECHEN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'che');
export const VERTICAL_OCR_CHECHEN = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'che'
);

export const OCR_CZECH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'cs');
export const VERTICAL_OCR_CZECH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'cs'
);

export const OCR_WELSH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'cy');
export const VERTICAL_OCR_WELSH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'cy'
);

export const OCR_DANISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'da');
export const VERTICAL_OCR_DANISH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'da'
);

export const OCR_DARGWA = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'dar');
export const VERTICAL_OCR_DARGWA = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'dar'
);

export const OCR_GERMAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'de');
export const VERTICAL_OCR_GERMAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'de'
);

export const OCR_ENGLISH = createOCRObject(RECOGNIZER_ENGLISH_CRNN, 'en');
export const VERTICAL_OCR_ENGLISH = createVerticalOCRObject(
  RECOGNIZER_ENGLISH_CRNN,
  'en'
);

export const OCR_SPANISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'es');
export const VERTICAL_OCR_SPANISH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'es'
);

export const OCR_ESTONIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'et');
export const VERTICAL_OCR_ESTONIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'et'
);

export const OCR_FRENCH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'fr');
export const VERTICAL_OCR_FRENCH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'fr'
);

export const OCR_IRISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ga');
export const VERTICAL_OCR_IRISH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'ga'
);

export const OCR_CROATIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'hr');
export const VERTICAL_OCR_CROATIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'hr'
);

export const OCR_HUNGARIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'hu');
export const VERTICAL_OCR_HUNGARIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'hu'
);

export const OCR_INDONESIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'id');
export const VERTICAL_OCR_INDONESIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'id'
);

export const OCR_INGUSH = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'inh');
export const VERTICAL_OCR_INGUSH = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'inh'
);

export const OCR_ICELANDIC = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ic');
export const VERTICAL_OCR_ICELANDIC = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'ic'
);

export const OCR_ITALIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'it');
export const VERTICAL_OCR_ITALIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'it'
);

export const OCR_JAPANESE = createOCRObject(RECOGNIZER_JAPANESE_CRNN, 'ja');
export const VERTICAL_OCR_JAPANESE = createVerticalOCRObject(
  RECOGNIZER_JAPANESE_CRNN,
  'ja'
);

export const OCR_KARBADIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'kbd');
export const VERTICAL_OCR_KARBADIAN = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'kbd'
);

export const OCR_KANNADA = createOCRObject(RECOGNIZER_KANNADA_CRNN, 'kn');
export const VERTICAL_OCR_KANNADA = createVerticalOCRObject(
  RECOGNIZER_KANNADA_CRNN,
  'kn'
);

export const OCR_KOREAN = createOCRObject(RECOGNIZER_KOREAN_CRNN, 'ko');
export const VERTICAL_OCR_KOREAN = createVerticalOCRObject(
  RECOGNIZER_KOREAN_CRNN,
  'ko'
);

export const OCR_KURDISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ku');
export const VERTICAL_OCR_KURDISH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'ku'
);

export const OCR_LATIN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'la');
export const VERTICAL_OCR_LATIN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'la'
);

export const OCR_LAK = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'lbe');
export const VERTICAL_OCR_LAK = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'lbe'
);

export const OCR_LEZGHIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'lez');
export const VERTICAL_OCR_LEZGHIAN = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'lez'
);

export const OCR_LITHUANIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'lt');
export const VERTICAL_OCR_LITHUANIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'lt'
);

export const OCR_LATVIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'lv');
export const VERTICAL_OCR_LATVIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'lv'
);

export const OCR_MAORI = createOCRObject(RECOGNIZER_LATIN_CRNN, 'mi');
export const VERTICAL_OCR_MAORI = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'mi'
);

export const OCR_MONGOLIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'mn');
export const VERTICAL_OCR_MONGOLIAN = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'mn'
);

export const OCR_MALAY = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ms');
export const VERTICAL_OCR_MALAY = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'ms'
);

export const OCR_MALTESE = createOCRObject(RECOGNIZER_LATIN_CRNN, 'mt');
export const VERTICAL_OCR_MALTESE = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'mt'
);

export const OCR_DUTCH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'nl');
export const VERTICAL_OCR_DUTCH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'nl'
);

export const OCR_NORWEGIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'no');
export const VERTICAL_OCR_NORWEGIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'no'
);

export const OCR_OCCITAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'oc');
export const VERTICAL_OCR_OCCITAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'oc'
);

export const OCR_PALI = createOCRObject(RECOGNIZER_LATIN_CRNN, 'pi');
export const VERTICAL_OCR_PALI = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'pi'
);

export const OCR_POLISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'pl');
export const VERTICAL_OCR_POLISH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'pl'
);

export const OCR_PORTUGUESE = createOCRObject(RECOGNIZER_LATIN_CRNN, 'pt');
export const VERTICAL_OCR_PORTUGUESE = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'pt'
);

export const OCR_ROMANIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'ro');
export const VERTICAL_OCR_ROMANIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'ro'
);

export const OCR_RUSSIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'ru');
export const VERTICAL_OCR_RUSSIAN = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'ru'
);

export const OCR_SERBIAN_CYRILLIC = createOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'rsCyrillic'
);
export const VERTICAL_OCR_SERBIAN_CYRILLIC = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'rsCyrillic'
);

export const OCR_SERBIAN_LATIN = createOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'rsLatin'
);
export const VERTICAL_OCR_SERBIAN_LATIN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'rsLatin'
);

export const OCR_SLOVAK = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sk');
export const VERTICAL_OCR_SLOVAK = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'sk'
);

export const OCR_SLOVENIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sl');
export const VERTICAL_OCR_SLOVENIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'sl'
);

export const OCR_ALBANIAN = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sq');
export const VERTICAL_OCR_ALBANIAN = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'sq'
);

export const OCR_SWEDISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sv');
export const VERTICAL_OCR_SWEDISH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'sv'
);

export const OCR_SWAHILI = createOCRObject(RECOGNIZER_LATIN_CRNN, 'sw');
export const VERTICAL_OCR_SWAHILI = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'sw'
);

export const OCR_TABASSARAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'tab');
export const VERTICAL_OCR_TABASSARAN = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'tab'
);

export const OCR_TELUGU = createOCRObject(RECOGNIZER_TELUGU_CRNN, 'te');
export const VERTICAL_OCR_TELUGU = createVerticalOCRObject(
  RECOGNIZER_TELUGU_CRNN,
  'te'
);

export const OCR_TAJIK = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'tjk');
export const VERTICAL_OCR_TAJIK = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'tjk'
);

export const OCR_TAGALOG = createOCRObject(RECOGNIZER_LATIN_CRNN, 'tl');
export const VERTICAL_OCR_TAGALOG = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'tl'
);

export const OCR_TURKISH = createOCRObject(RECOGNIZER_LATIN_CRNN, 'tr');
export const VERTICAL_OCR_TURKISH = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'tr'
);

export const OCR_UKRAINIAN = createOCRObject(RECOGNIZER_CYRILLIC_CRNN, 'uk');
export const VERTICAL_OCR_UKRAINIAN = createVerticalOCRObject(
  RECOGNIZER_CYRILLIC_CRNN,
  'uk'
);

export const OCR_UZBEK = createOCRObject(RECOGNIZER_LATIN_CRNN, 'uz');
export const VERTICAL_OCR_UZBEK = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'uz'
);

export const OCR_VIETNAMESE = createOCRObject(RECOGNIZER_LATIN_CRNN, 'vi');
export const VERTICAL_OCR_VIETNAMESE = createVerticalOCRObject(
  RECOGNIZER_LATIN_CRNN,
  'vi'
);
