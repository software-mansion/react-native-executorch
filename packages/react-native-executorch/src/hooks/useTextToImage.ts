import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createSdxsTextToImage,
  type SdxsTextToImageModel,
} from '../extensions/cv/tasks/sdxsTextToImage';

/**
 * React hook to load and run an SDXS text-to-image synthesis model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets and tokenizer files, tracking download progress and load errors,
 * and releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createSdxsTextToImage}.
 * @category Hooks
 * @param config The SDXS model configuration. See {@link SdxsTextToImageModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link createSdxsTextToImage} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link createSdxsTextToImage}
 */
export function useTextToImage(config: SdxsTextToImageModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createSdxsTextToImage, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    generate: model?.generate,
    generateWorklet: model?.generateWorklet,
  };
}
