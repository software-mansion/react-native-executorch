import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
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
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the model.
 * @returns An object containing the model's loading state, error, download
 * progress, and generation functions.
 */
export function useTextToImage(config: SdxsTextToImageModel, options?: { preventLoad?: boolean }) {
  const modelResource = useResourceDownload(config.modelPath, options?.preventLoad);
  const tokenizerResource = useResourceDownload(config.tokenizerPath, options?.preventLoad);

  const localModelPath = modelResource.localPath;
  const localTokenizerPath = tokenizerResource.localPath;
  const isResourcesReady = !!(localModelPath && localTokenizerPath);

  const { model, error } = useModel(
    createSdxsTextToImage,
    isResourcesReady
      ? { ...config, modelPath: localModelPath!, tokenizerPath: localTokenizerPath! }
      : null,
    [localModelPath, localTokenizerPath]
  );

  return {
    isReady: !!model,
    error: modelResource.downloadError || tokenizerResource.downloadError || error,
    downloadProgress: (modelResource.downloadProgress + tokenizerResource.downloadProgress) / 2,
    generate: model?.generate,
    generateWorklet: model?.generateWorklet,
  };
}
