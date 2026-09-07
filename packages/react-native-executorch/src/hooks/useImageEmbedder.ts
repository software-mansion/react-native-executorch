import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createImageEmbedder,
  type ImageEmbedderModel,
} from '../extensions/cv/tasks/imageEmbedding';

/**
 * React hook to load and run an image embedding model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createImageEmbedder}.
 * @category Hooks
 * @param config The image embedder model configuration.
 * See {@link ImageEmbedderModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link ImageEmbedder} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link ImageEmbedder}
 */
export function useImageEmbedder(config: ImageEmbedderModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createImageEmbedder, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    embed: model?.embed,
    embedWorklet: model?.embedWorklet,
  };
}
