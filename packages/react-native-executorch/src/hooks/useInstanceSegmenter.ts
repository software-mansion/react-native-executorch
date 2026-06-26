import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createInstanceSegmenter,
  type InstanceSegmenterModel,
} from '../extensions/cv/tasks/instanceSegmentation';
import type { BoxFormat } from '../extensions/cv/ops/boxes';

/**
 * React hook to load and run an instance segmentation model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes.
 * @category Hooks
 * @typeParam F The bounding box format.
 * @typeParam L The class labels type.
 * @param config The instance segmentation model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and segmentation functions.
 */
export function useInstanceSegmenter<F extends BoxFormat, L>(
  config: InstanceSegmenterModel<F, L>,
  options?: { preventLoad?: boolean }
) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );
  const { model, error } = useModel(
    createInstanceSegmenter<F, L>,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    segmentInstances: model?.segmentInstances,
    segmentInstancesWorklet: model?.segmentInstancesWorklet,
    labels: config.opts.labels,
  };
}
