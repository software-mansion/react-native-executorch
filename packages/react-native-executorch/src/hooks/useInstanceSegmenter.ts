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
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createInstanceSegmenter}.
 * @category Hooks
 * @typeParam F The bounding box format.
 * @typeParam L The class labels type.
 * @param config The instance segmentation model configuration.
 * See {@link InstanceSegmenterModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, labels, and instance segmentation functions.
 * @see {@link createInstanceSegmenter}
 */
export function useInstanceSegmenter<F extends BoxFormat, L>(
  config: InstanceSegmenterModel<F, L>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createInstanceSegmenter<F, L>, resource);

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
