import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createImageEmbedder,
  type ImageEmbedderModel,
} from '../extensions/cv/tasks/imageEmbedding';

/**
 * React hook to load and run an image embedder model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes.
 * @category Hooks
 * @param config The image embedder model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and embedding functions.
 */
export function useImageEmbedder(config: ImageEmbedderModel, options?: { preventLoad?: boolean }) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(
    config,
    options?.preventLoad
  );
  const { model, error } = useModel(createImageEmbedder, resource ?? null, [resource]);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    embed: model?.embed,
    embedWorklet: model?.embedWorklet,
  };
}
