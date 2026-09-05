import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { createStyleTransfer, type StyleTransferModel } from '../extensions/cv/tasks/styleTransfer';

/**
 * React hook to load and run an image style transfer model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createStyleTransfer}.
 * @category Hooks
 * @param config The style transfer model configuration.
 * See {@link StyleTransferModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link StyleTransfer} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link StyleTransfer}
 */
export function useStyleTransfer(config: StyleTransferModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createStyleTransfer, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    transferStyle: model?.transferStyle,
    transferStyleWorklet: model?.transferStyleWorklet,
  };
}
