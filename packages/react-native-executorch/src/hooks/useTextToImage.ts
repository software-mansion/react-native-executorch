import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createSdxsTextToImage,
  type SdxsTextToImageModel,
} from '../extensions/cv/tasks/sdxsTextToImage';

/**
 * React hook to load and run the SDXS text-to-image pipeline.
 *
 * It manages downloading (if the sources are remote URLs) and loading the
 * combined `.pte` program and the CLIP tokenizer, tracks download progress and
 * errors, and cleans up native memory when the component unmounts or the
 * configuration changes.
 * @category Hooks
 * @param config The SDXS model configuration.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, and generation functions.
 */
export function useTextToImage(config: SdxsTextToImageModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createSdxsTextToImage, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    generate: model?.generate,
    generateWorklet: model?.generateWorklet,
  };
}
