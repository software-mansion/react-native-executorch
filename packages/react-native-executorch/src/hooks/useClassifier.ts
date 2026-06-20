import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createClassifier, type ClassifierModel } from '../extensions/cv/tasks/classification';

/**
 * React hook to load and run an image classification model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes.
 * @category Hooks
 * @typeParam L The type representing the classification labels.
 * @param config The image classification model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and classification functions.
 */
export function useClassifier<L>(config: ClassifierModel<L>, options?: { preventLoad?: boolean }) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );
  const { model, error } = useModel(
    createClassifier<L>,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    labels: config.classifierOpts.labels,
    classify: model?.classify,
    classifyWorklet: model?.classifyWorklet,
  };
}
