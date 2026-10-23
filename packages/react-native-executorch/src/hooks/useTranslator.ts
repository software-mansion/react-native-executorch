import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createMarianTranslator,
  type MarianTranslatorModel,
} from '../extensions/nlp/tasks/marianTranslation';
import {
  createLLMTranslator,
  type LLMTranslatorModel,
} from '../extensions/llm/tasks/llmTranslation';
import type { Translator } from '../extensions/nlp/utils/translationUtils';

/**
 * Configuration of any translation pipeline.
 * @category NLP / Types
 */
export type TranslatorModel = MarianTranslatorModel | LLMTranslatorModel;

/**
 * React hook to load and run a translation pipeline: Marian (Opus-MT), one
 * model per language pair, or an LLM (EuroLLM) that translates between any two
 * of its languages.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model and tokenizer, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createMarianTranslator} and
 * {@link createLLMTranslator}.
 * @category Hooks
 * @param config The translation model configuration. See
 * {@link TranslatorModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link Translator} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link Translator}
 */
export function useTranslator<C extends TranslatorModel>(
  config: C,
  options?: ResourceOptions
): {
  /** Whether the pipeline is loaded and ready to translate. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | undefined;
  /** Download progress across every asset, in percent. */
  downloadProgress: number;
  /** The config with every remote URL resolved to a local path. */
  resource: C | undefined;
  /** Translates text. Undefined until the pipeline is ready. */
  translate: Translator['translate'] | undefined;
  /** Cancels an in-flight translation. Undefined until the pipeline is ready. */
  translateStop: Translator['translateStop'] | undefined;
} {
  // Each config names the pipeline it belongs to, so the factory is resolved
  // from that tag alone.
  const factory = (translatorConfig: TranslatorModel): Promise<Translator> => {
    switch (translatorConfig.name) {
      case 'marian':
        return createMarianTranslator(translatorConfig);
      case 'eurollm':
        return createLLMTranslator(translatorConfig);
    }
  };

  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(factory, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    translate: model?.translate,
    translateStop: model?.translateStop,
  };
}
