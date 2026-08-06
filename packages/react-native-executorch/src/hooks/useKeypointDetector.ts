import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createKeypointDetector,
  type KeypointDetectorModel,
  type BoxFormat,
} from '../extensions/cv/tasks/keypointDetection';

/**
 * React hook to load and run a keypoint detection model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes.
 * @category Hooks
 * @typeParam F The bounding box format.
 * @typeParam L The landmark labels type.
 * @param config The keypoint detection model configuration.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, and keypoint detection functions.
 */
export function useKeypointDetector<F extends BoxFormat, L extends PropertyKey>(
  config: KeypointDetectorModel<F, L>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createKeypointDetector<F, L>, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    landmarks: config.modelOpts.landmarks,
    detectKeypoints: model?.detectKeypoints,
    detectKeypointsWorklet: model?.detectKeypointsWorklet,
  };
}
