import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { createInpainter, type InpainterModel } from '../extensions/cv/tasks/inpainting';

/**
 * React hook to load and run an image inpainting model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createInpainter}.
 * @category Hooks
 * @param config The inpainting model configuration.
 * See {@link InpainterModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link Inpainter} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link Inpainter}
 */
export function useInpainter(config: InpainterModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createInpainter, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    inpaint: model?.inpaint,
    inpaintWorklet: model?.inpaintWorklet,
  };
}
