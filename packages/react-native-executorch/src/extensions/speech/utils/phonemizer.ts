/**
 * Grapheme-to-phoneme (G2P) conversion using native Phonemis bindings.
 */

import { rnexecutorchJsi } from '../../../native/bridge';
import { RnExecuTorchError } from '../../../core/error';

declare const phonemizerBrand: unique symbol;

/**
 * Union of all supported language codes in the G2P pipeline.
 * @category Speech / Types
 */
export type PhonemizerLanguage = 'en-us' | 'en-gb' | 'fr' | 'es' | 'it' | 'pt' | 'de' | 'pl' | 'hi';

/**
 * Configuration options and asset paths for initializing a {@link Phonemizer}.
 * @category Speech / Types
 */
export type PhonemizerConfig = {
  /** Target language code to configure the G2P rules for. */
  readonly lang: PhonemizerLanguage;
  /** Optional local file path to the part-of-speech tagger model data. */
  readonly taggerSource?: string;
  /** Optional local file path to the pronunciation lexicon dictionary. */
  readonly lexiconSource?: string;
  /** Optional local file path to the neural G2P model data. */
  readonly neuralModelSource?: string;
};

/**
 * Native Grapheme-to-Phoneme (G2P) conversion interface.
 * @category Speech / Types
 */
export type Phonemizer = {
  /**
   * Converts input text into phonetic IPA transcription.
   * @param text Input text string to be phonemized.
   * @param preprocess Whether to normalize the text first (see {@link Phonemizer.preprocess}).
   * Defaults to `true`; pass `false` for text that has already been normalized.
   * @returns Phonetic transcription string.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the phonemizer is
   * in use, or `RESOURCE_DISPOSED` if disposed.
   */
  phonemize(text: string, preprocess?: boolean): string;

  /**
   * Normalizes text the way {@link Phonemizer.phonemize} does before phonemizing
   * it: collapses whitespace and spells out numbers, dates and currencies.
   * @param text Input text string to be normalized.
   * @returns Normalized text.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the phonemizer is
   * in use, or `RESOURCE_DISPOSED` if disposed.
   */
  preprocess(text: string): string;

  /**
   * Releases the allocated native phonemizer resources. The instance must not
   * be used afterwards.
   */
  dispose(): void;

  /**
   * Prevents plain JS objects from being cast as Phonemizers.
   * @internal
   */
  readonly [phonemizerBrand]: never;
};

/**
 * Creates a grapheme-to-phoneme (G2P) pipeline for the configured language.
 * @category Speech / Functions
 * @param config Phonemizer configuration and asset paths.
 * See {@link PhonemizerConfig}.
 * @returns The native {@link Phonemizer} instance.
 * @throws {RnExecuTorchError} With code `INVALID_STATE` if the native build
 * lacks phonemizer support, or `LOAD_FAILED` if phonemizer assets fail to load.
 */
export function createPhonemizer(config: PhonemizerConfig): Phonemizer {
  'worklet';
  if (!rnexecutorchJsi.speech.createPhonemizer) {
    throw RnExecuTorchError(
      'INVALID_STATE',
      "createPhonemizer: The native build has no phonemizer. Add the 'textToSpeech' feature (or " +
        "the 'phonemis' lib) to the app's react-native-executorch config and rebuild."
    );
  }
  return rnexecutorchJsi.speech.createPhonemizer(config) as Phonemizer;
}

/**
 * A word of the input text, located in its phonemization.
 * @category Speech / Types
 */
export type PhonemizedWord = {
  /** The word as it appears in the input text. */
  readonly text: string;
  /** UTF-16 offset of the word in the input text. */
  readonly offset: number;
  /** UTF-16 offset of the word's phonemes in {@link PhonemizedText.phonemes}. */
  readonly phonemeOffset: number;
  /** UTF-16 length of the word's phonemes. */
  readonly phonemeLength: number;
};

/**
 * Phonemization of a text, together with the position of each of its words.
 * @category Speech / Types
 */
export type PhonemizedText = {
  /** IPA transcription of the whole text, the same as {@link Phonemizer.phonemize} returns. */
  readonly phonemes: string;
  /**
   * The whitespace-separated words of the input text, in order. Empty if the
   * words could not be matched with the phonemes.
   */
  readonly words: readonly PhonemizedWord[];
};

// The native phonemizer only treats ASCII whitespace and digits as such.
const WORD_PATTERN = /[^ \t\n\v\f\r]+/g;
const WHITESPACE_PATTERN = /[ \t\n\v\f\r]+/;
const DIGIT_PATTERN = /[0-9]/;

/**
 * Phonemizes a text and locates each of its words in the resulting phonemes.
 * @category Speech / Functions
 * @param phonemizer The phonemizer to use.
 * @param text Input text string to be phonemized.
 * @returns The phonemes and the words located in them. See {@link PhonemizedText}.
 * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the phonemizer is
 * in use, or `RESOURCE_DISPOSED` if disposed.
 */
export function phonemizeWords(phonemizer: Phonemizer, text: string): PhonemizedText {
  'worklet';
  const countWords = (normalized: string) =>
    normalized.split(WHITESPACE_PATTERN).filter((word) => word.length > 0).length;

  // Normalizing leaves each word intact, except for numbers, which it can spell
  // out as several words. Phonemizing then turns each normalized word into one
  // space-separated group of phonemes.
  const normalized = phonemizer.preprocess(text);
  const phonemes = phonemizer.phonemize(normalized, false);
  const groups = phonemes.split(' ');

  const words: PhonemizedWord[] = [];
  let group = 0;
  let phonemeOffset = 0;
  for (const match of text.matchAll(WORD_PATTERN)) {
    const word = match[0];
    const count = DIGIT_PATTERN.test(word) ? countWords(phonemizer.preprocess(word)) : 1;

    let phonemeLength = Math.max(0, count - 1); // separating spaces
    for (let i = group; i < group + count && i < groups.length; i++) {
      phonemeLength += groups[i]!.length;
    }

    words.push({ text: word, offset: match.index, phonemeOffset, phonemeLength });
    if (count > 0) phonemeOffset += phonemeLength + 1;
    group += count;
  }

  // A number spelled out differently on its own than in context would shift
  // every word after it, so a mismatch drops the words rather than misplace them.
  if (group !== countWords(normalized) || group !== groups.length) {
    return { phonemes, words: [] };
  }

  return { phonemes, words };
}
