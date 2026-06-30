import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createImageEmbeddings,
  type ImageEmbeddingsModel,
} from '../extensions/cv/tasks/imageEmbeddings';

/**
 * React hook to load and run an image embeddings model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes.
 * @category Hooks
 * @param config The image embeddings model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and embedding functions.
 */
export function useImageEmbeddings(
  config: ImageEmbeddingsModel,
  options?: { preventLoad?: boolean }
) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );
  const { model, error } = useModel(
    createImageEmbeddings,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    forward: model?.forward,
    forwardWorklet: model?.forwardWorklet,
  };
}
