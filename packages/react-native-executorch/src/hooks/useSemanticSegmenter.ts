import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createSemanticSegmenter,
  type SemanticSegmenterModel,
} from '../extensions/cv/tasks/semanticSegmentation';

/**
 * React hook to load and run a semantic segmentation model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createSemanticSegmenter}.
 * @category Hooks
 * @typeParam L The type representing the segmentation labels.
 * @param config The semantic segmentation model configuration.
 * See {@link SemanticSegmenterModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, labels, and semantic segmentation functions.
 * @see {@link createSemanticSegmenter}
 */
export function useSemanticSegmenter<L extends PropertyKey = string>(
  config: SemanticSegmenterModel<L>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createSemanticSegmenter<L>, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    segment: model?.segment,
    segmentWorklet: model?.segmentWorklet,
    labels: config.modelOpts.labels,
  };
}
