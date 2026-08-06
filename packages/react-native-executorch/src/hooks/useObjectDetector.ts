import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createObjectDetector,
  type ObjectDetectorModel,
  type BoxFormat,
} from '../extensions/cv/tasks/objectDetection';

/**
 * React hook to load and run an object detection model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes.
 * @category Hooks
 * @typeParam L The type representing the object class labels.
 * @typeParam F The bounding box format.
 * @param config The object detection model configuration.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, and object detection functions.
 */
export function useObjectDetector<F extends BoxFormat, L>(
  config: ObjectDetectorModel<F, L>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createObjectDetector<F, L>, resource ?? null);

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
