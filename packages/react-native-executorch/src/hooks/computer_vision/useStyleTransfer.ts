import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';
import { PixelData } from '../../types/common';
import {
  StyleTransferProps,
  StyleTransferType,
} from '../../types/styleTransfer';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing a Style Transfer model instance.
 *
 * @category Hooks
 * @param props - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Style Transfer model.
 */
export const useStyleTransfer = ({
  model,
  preventLoad = false,
}: StyleTransferProps): StyleTransferType => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        StyleTransferModule.fromModelName(config, onProgress),
      config: model,
      deps: [model.modelName, model.modelSource],
      preventLoad,
    });

  const forward = (imageSource: string | PixelData) =>
    runForward((inst) => inst.forward(imageSource));

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forward,
  } as StyleTransferType;
};
