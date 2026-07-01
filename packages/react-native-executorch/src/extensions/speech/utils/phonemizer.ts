import { rnexecutorchJsi } from '../../../native/bridge';

declare const phonemizerBrand: unique symbol;

/**
 * List of all (currently) supported languages.
 */
export type Language = 'en-us' | 'en-gb' | 'fr' | 'es' | 'it' | 'pt' | 'de' | 'pl' | 'hi';

/**
 * A configuration type compatible with the underlying
 * Phonemis library interface.
 */
export type PhonemizerConfig = {
  lang: Language;
  taggerSource?: string;
  lexiconSource?: string;
  neuralModelSource?: string;
};

export type Phonemizer = {
  /**
   * A standard G2P (grapheme to phoneme) utility.
   * @param text Input text to be phonemized.
   */
  phonemize(text: string): string;

  dispose(): void;

  /**
   * @internal
   * Prevents plain JS objects from being cast as Phonemizers
   */
  readonly [phonemizerBrand]: never;
};

export function createPhonemizer(config: PhonemizerConfig): Phonemizer {
  'worklet';
  return rnexecutorchJsi.speech.createPhonemizer(
    config.lang,
    config.taggerSource ?? '',
    config.lexiconSource ?? '',
    config.neuralModelSource ?? ''
  ) as Phonemizer;
}
