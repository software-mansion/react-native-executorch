import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createKeypointDetector,
  type KeypointDetectorModel,
} from '../extensions/cv/tasks/keypointDetection';
import type { BoxFormat } from '../extensions/cv/ops/box';

/**
 * React hook to load and run a keypoint detection model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createKeypointDetector}.
 * @category Hooks
 * @typeParam F The bounding box format.
 * @typeParam L The landmark labels type.
 * @param config The keypoint detection model configuration.
 * See {@link KeypointDetectorModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link KeypointDetector} (without `dispose`),
 * combined with loading state, download progress, and landmarks.
 * @see {@link KeypointDetector}
 */
export function useKeypointDetector<F extends BoxFormat, L extends PropertyKey>(
  config: KeypointDetectorModel<F, L>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createKeypointDetector<F, L>, resource);

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
