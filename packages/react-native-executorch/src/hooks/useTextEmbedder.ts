import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { createTextEmbedder, type TextEmbedderModel } from '../extensions/nlp/tasks/textEmbedding';

/**
 * React hook to load and run a text embedding model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets and tokenizer files, tracking download progress and load errors,
 * and releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createTextEmbedder}.
 * @category Hooks
 * @param config The text embedder model configuration.
 * See {@link TextEmbedderModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link createTextEmbedder} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link createTextEmbedder}
 */
export function useTextEmbedder(config: TextEmbedderModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createTextEmbedder, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    embed: model?.embed,
    embedWorklet: model?.embedWorklet,
  };
}
