import { rnexecutorchJsi } from '../../../native/bridge';
import { RnExecuTorchError } from '../../../core/error';

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
   * Prevents plain JS objects from being cast as Phonemizers.
   * @internal
   */
  readonly [phonemizerBrand]: never;
};

/**
 * Creates a grapheme-to-phoneme pipeline for the configured language.
 * @category Typescript API
 * @param config The phonemizer configuration and asset paths.
 * @returns The native {@link Phonemizer} instance.
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
  return rnexecutorchJsi.speech.createPhonemizer(
    config.lang,
    config.taggerSource ?? '',
    config.lexiconSource ?? '',
    config.neuralModelSource ?? ''
  ) as Phonemizer;
}
