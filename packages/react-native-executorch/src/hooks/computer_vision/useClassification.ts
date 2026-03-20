import {
  ClassificationModule,
  ClassificationLabels,
} from '../../modules/computer_vision/ClassificationModule';
import {
  ClassificationModelSources,
  ClassificationProps,
  ClassificationType,
} from '../../types/classification';
import { PixelData } from '../../types/common';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing a Classification model instance.
 * @typeParam C - A {@link ClassificationModelSources} config specifying which built-in model to load.
 * @category Hooks
 * @param props - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Classification model.
 */
export const useClassification = <C extends ClassificationModelSources>({
  model,
  preventLoad = false,
}: ClassificationProps<C>): ClassificationType<
  ClassificationLabels<C['modelName']>
> => {
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

  const forward = (input: string | PixelData) =>
    runForward((inst) => inst.forward(input));

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forward,
    runOnFrame,
  };
};
