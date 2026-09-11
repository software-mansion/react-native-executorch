import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createFaceLandmarker,
  type FaceLandmarkerModel,
} from '../extensions/cv/tasks/faceLandmarks';

/**
 * React hook to load and run a dense face landmark ("face mesh") model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * The model regresses the mesh of one already-cropped face; it does not search
 * an image for faces. See {@link FaceLandmarker}.
 *
 * For imperative usage, see {@link createFaceLandmarker}.
 * @category Hooks
 * @param config The face landmark model configuration.
 * See {@link FaceLandmarkerModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link FaceLandmarker} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link FaceLandmarker}
 */
export function useFaceLandmarker(config: FaceLandmarkerModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createFaceLandmarker, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    detectFaceLandmarks: model?.detectFaceLandmarks,
    detectFaceLandmarksWorklet: model?.detectFaceLandmarksWorklet,
  };
}
