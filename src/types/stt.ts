export interface ModelConfig {
  sources: {
    encoder: string;
    decoder: string;
  };
  tokenizer: {
    source: string;
    bos: number;
    eos: number;
  };
  isMultilingual: boolean;
}

// Those languages are supported just by whisper multilingual
export enum SpeechToTextLanguage {
  Afrikaans = 'af',
  Albanian = 'sq',
  Arabic = 'ar',
  Armenian = 'hy',
  Azerbaijani = 'az',
  Basque = 'eu',
  Belarusian = 'be',
  Bengali = 'bn',
  Bosnian = 'bs',
  Bulgarian = 'bg',
  Burmese = 'my',
  Catalan = 'ca',
  Chinese = 'zh',
  Croatian = 'hr',
  Czech = 'cs',
  Danish = 'da',
  Dutch = 'nl',
  Estonian = 'et',
  English = 'en',
  Finnish = 'fi',
  French = 'fr',
  Galician = 'gl',
  Georgian = 'ka',
  German = 'de',
  Greek = 'el',
  Gujarati = 'gu',
  HaitianCreole = 'ht',
  Hebrew = 'he',
  Hindi = 'hi',
  Hungarian = 'hu',
  Icelandic = 'is',
  Indonesian = 'id',
  Italian = 'it',
  Japanese = 'ja',
  Kannada = 'kn',
  Kazakh = 'kk',
  Khmer = 'km',
  Korean = 'ko',
  Lao = 'lo',
  Latvian = 'lv',
  Lithuanian = 'lt',
  Macedonian = 'mk',
  Malagasy = 'mg',
  Malay = 'ms',
  Malayalam = 'ml',
  Maltese = 'mt',
  Marathi = 'mr',
  Nepali = 'ne',
  Norwegian = 'no',
  Persian = 'fa',
  Polish = 'pl',
  Portuguese = 'pt',
  Punjabi = 'pa',
  Romanian = 'ro',
  Russian = 'ru',
  Serbian = 'sr',
  Sinhala = 'si',
  Slovak = 'sk',
  Slovenian = 'sl',
  Spanish = 'es',
  Sundanese = 'su',
  Swahili = 'sw',
  Swedish = 'sv',
  Tagalog = 'tl',
  Tajik = 'tg',
  Tamil = 'ta',
  Telugu = 'te',
  Thai = 'th',
  Turkish = 'tr',
  Ukrainian = 'uk',
  Urdu = 'ur',
  Uzbek = 'uz',
  Vietnamese = 'vi',
  Welsh = 'cy',
  Yiddish = 'yi',
}

export type AvailableModels = 'whisper' | 'moonshine' | 'whisperMultilingual';
