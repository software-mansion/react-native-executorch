import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
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
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and object detection functions.
 */
export function useObjectDetector<F extends BoxFormat, L>(
  config: ObjectDetectorModel<F, L>,
  options?: { preventLoad?: boolean }
) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );
  const { model, error } = useModel(
    createObjectDetector<F, L>,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    labels: config.opts.labels,
    detectObjects: model?.detectObjects,
    detectObjectsWorklet: model?.detectObjectsWorklet,
  };
}
