import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
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
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, and classification functions.
 */
export function useClassifier<L>(config: ClassifierModel<L>, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createClassifier<L>, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    labels: config.modelOpts.labels,
    classify: model?.classify,
    classifyWorklet: model?.classifyWorklet,
  };
}
