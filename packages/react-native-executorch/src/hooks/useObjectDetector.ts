import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createObjectDetector,
  type ObjectDetectorModel,
} from '../extensions/cv/tasks/objectDetection';
import type { BoxFormat } from '../extensions/cv/ops/box';

/**
 * React hook to load and run an object detection model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createObjectDetector}.
 * @category Hooks
 * @typeParam F The bounding box format.
 * @typeParam L The type representing the object class labels.
 * @param config The object detection model configuration.
 * See {@link ObjectDetectorModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link createObjectDetector} (without `dispose`),
 * combined with loading state, download progress, and labels.
 * @see {@link createObjectDetector}
 */
export function useObjectDetector<F extends BoxFormat, L>(
  config: ObjectDetectorModel<F, L>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createObjectDetector<F, L>, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    labels: config.modelOpts.labels,
    detectObjects: model?.detectObjects,
    detectObjectsWorklet: model?.detectObjectsWorklet,
  };
}
