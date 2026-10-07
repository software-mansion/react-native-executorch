import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createColbertEmbedder,
  type ColbertEmbedderModel,
} from '../extensions/nlp/tasks/colbertEmbedding';

/**
 * React hook to load and run a late-interaction (ColBERT) embedding model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets and tokenizer files, tracking download progress and load errors,
 * and releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createColbertEmbedder}.
 * @category Hooks
 * @param config The ColBERT embedder model configuration.
 * See {@link ColbertEmbedderModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link ColbertEmbedder} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link ColbertEmbedder}
 */
export function useColbertEmbedder(config: ColbertEmbedderModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createColbertEmbedder, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    embed: model?.embed,
    embedWorklet: model?.embedWorklet,
  };
}
