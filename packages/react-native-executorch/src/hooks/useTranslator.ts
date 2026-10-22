import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createMarianTranslator,
  type MarianTranslatorModel,
  type MarianTranslator,
} from '../extensions/nlp/tasks/marianTranslation';

/**
 * React hook to load and run a Marian (Opus-MT) translation pipeline.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model and tokenizer, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createMarianTranslator}.
 * @category Hooks
 * @param config The translation model configuration.
 * See {@link MarianTranslatorModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link MarianTranslator} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link MarianTranslator}
 */
export function useTranslator(
  config: MarianTranslatorModel,
  options?: ResourceOptions
): {
  /** Whether the pipeline is loaded and ready to translate. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | undefined;
  /** Download progress across every asset, in percent. */
  downloadProgress: number;
  /** The config with every remote URL resolved to a local path. */
  resource: MarianTranslatorModel | undefined;
  /** Translates text. Undefined until the pipeline is ready. */
  translate: MarianTranslator['translate'] | undefined;
  /** Cancels an in-flight translation. Undefined until the pipeline is ready. */
  translateStop: MarianTranslator['translateStop'] | undefined;
};

export function useTranslator(config: MarianTranslatorModel, options?: ResourceOptions) {
  // Each config names the pipeline it belongs to, so the factory is resolved
  // from that tag alone.
  const factory = (translatorConfig: MarianTranslatorModel): Promise<MarianTranslator> => {
    switch (translatorConfig.name) {
      case 'marian':
        return createMarianTranslator(translatorConfig);
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
