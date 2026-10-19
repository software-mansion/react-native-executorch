import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createDepthEstimator,
  type DepthEstimatorModel,
} from '../extensions/cv/tasks/depthEstimation';

/**
 * React hook to load and run a depth estimation model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createDepthEstimator}.
 * @category Hooks
 * @param config The depth estimation model configuration.
 * See {@link DepthEstimatorModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link DepthEstimator} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link DepthEstimator}
 */
export function useDepthEstimator(config: DepthEstimatorModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createDepthEstimator, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    estimateDepth: model?.estimateDepth,
    estimateDepthWorklet: model?.estimateDepthWorklet,
  };
}
