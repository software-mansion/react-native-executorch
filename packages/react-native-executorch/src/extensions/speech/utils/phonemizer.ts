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
   * @returns Phonetic transcription string.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the phonemizer is
   * in use, or `RESOURCE_DISPOSED` if disposed.
   */
  phonemize(text: string): string;

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
