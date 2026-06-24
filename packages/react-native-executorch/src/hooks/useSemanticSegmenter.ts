import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createSemanticSegmenter,
  type SemanticSegmentationModel,
} from '../extensions/cv/tasks/semanticSegmentation';

/**
 * React hook to load and run a semantic segmentation model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes.
 * @category Hooks
 * @typeParam L The type representing the segmentation labels.
 * @param config The semantic segmentation model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and segmentation functions.
 */
export function useSemanticSegmenter<L extends PropertyKey = string>(
  config: SemanticSegmentationModel<L>,
  options?: { preventLoad?: boolean }
) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );
  const { model, error } = useModel(
    createSemanticSegmenter<L>,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    segment: model?.segment,
    segmentWorklet: model?.segmentWorklet,
    labels: config.opts.labels,
  };
}
