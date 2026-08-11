import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createInstanceSegmenter,
  type InstanceSegmenterModel,
  type BoxFormat,
} from '../extensions/cv/tasks/instanceSegmentation';

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
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, and segmentation functions.
 */
export function useInstanceSegmenter<F extends BoxFormat, L>(
  config: InstanceSegmenterModel<F, L>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createInstanceSegmenter<F, L>, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    segmentInstances: model?.segmentInstances,
    segmentInstancesWorklet: model?.segmentInstancesWorklet,
    labels: config.modelOpts.labels,
  };
}
