import {
  ObjectDetectionModule,
  ObjectDetectionLabels,
} from '../../modules/computer_vision/ObjectDetectionModule';
import {
  ObjectDetectionModelSources,
  ObjectDetectionProps,
  ObjectDetectionType,
  ObjectDetectionOptions,
} from '../../types/objectDetection';
import { PixelData } from '../../types/common';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing an Object Detection model instance.
 * @typeParam C - A {@link ObjectDetectionModelSources} config specifying which built-in model to load.
 * @category Hooks
 * @param props - Configuration object containing `model` config and optional `preventLoad` flag.
 * @returns An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and typed `forward` and `runOnFrame` functions.
 */
export const useObjectDetection = <C extends ObjectDetectionModelSources>({
  model,
  preventLoad = false,
}: ObjectDetectionProps<C>): ObjectDetectionType<
  ObjectDetectionLabels<C['modelName']>
> => {
  const {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    runForward,
    runOnFrame,
    instance,
  } = useModuleFactory({
    factory: (config, onProgress) =>
      ObjectDetectionModule.fromModelName(config, onProgress),
    config: model,
    deps: [model.modelName, model.modelSource],
    preventLoad,
  });

  const forward = (
    input: string | PixelData,
    options?: ObjectDetectionOptions<ObjectDetectionLabels<C['modelName']>>
  ) => runForward((inst) => inst.forward(input, options));

  const getAvailableInputSizes = () =>
    instance?.getAvailableInputSizes() ?? undefined;

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forward,
    runOnFrame,
    getAvailableInputSizes,
  };
};
