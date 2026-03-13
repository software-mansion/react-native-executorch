import { ClassificationModule } from '../../modules/computer_vision/ClassificationModule';
import {
  ClassificationProps,
  ClassificationType,
} from '../../types/classification';
import { PixelData } from '../../types/common';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing a Classification model instance.
 *
 * @category Hooks
 * @param ClassificationProps - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Classification model.
 */
export const useClassification = ({
  model,
  preventLoad = false,
}: ClassificationProps): ClassificationType => {
  const {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    runForward,
    runOnFrame,
  } = useModuleFactory({
    factory: (config, onProgress) =>
      ClassificationModule.fromModelName(config, onProgress),
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
    runOnFrame,
  };
};
