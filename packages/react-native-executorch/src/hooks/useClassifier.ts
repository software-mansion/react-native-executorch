import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { createClassifier, type ClassifierModel } from '../extensions/cv/tasks/classification';

/**
 * React hook to load and run an image classification model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createClassifier}.
 * @category Hooks
 * @typeParam L The type representing the classification labels.
 * @param config The image classification model configuration.
 * See {@link ClassifierModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link Classifier} (without `dispose`),
 * combined with loading state, download progress, and labels.
 * @see {@link Classifier}
 */
export function useClassifier<L>(config: ClassifierModel<L>, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createClassifier<L>, resource);

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
