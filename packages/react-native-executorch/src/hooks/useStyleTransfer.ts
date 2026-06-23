import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createStyleTransfer, type StyleTransferModel } from '../extensions/cv/tasks/styleTransfer';

/**
 * React hook to load and run an image style transfer model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes.
 * @category Hooks
 * @param config The style transfer model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and style transfer functions.
 */
export function useStyleTransfer(config: StyleTransferModel, options?: { preventLoad?: boolean }) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );
  const { model, error } = useModel(
    createStyleTransfer,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    transferStyle: model?.transferStyle,
    transferStyleWorklet: model?.transferStyleWorklet,
  };
}
