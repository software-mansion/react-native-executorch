import {
  ObjectDetectionModule,
  ObjectDetectionLabels,
} from '../../modules/computer_vision/ObjectDetectionModule';
import {
  ObjectDetectionModelSources,
  ObjectDetectionProps,
  ObjectDetectionType,
} from '../../types/objectDetection';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing an Object Detection model instance.
 *
 * @typeParam C - A {@link ObjectDetectionModelSources} config specifying which built-in model to load.
 * @category Hooks
 * @param props - Configuration object containing `model` config and optional `preventLoad` flag.
 * @returns An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and a typed `forward` function.
 */
export const useObjectDetection = <C extends ObjectDetectionModelSources>({
  model,
  preventLoad = false,
}: ObjectDetectionProps<C>): ObjectDetectionType<
  ObjectDetectionLabels<C['modelName']>
> => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        ObjectDetectionModule.fromModelName(config, onProgress),
      config: model,
      preventLoad,
    });

  const forward = (imageSource: string, detectionThreshold?: number) =>
    runForward((inst) => inst.forward(imageSource, detectionThreshold));

  return { error, isReady, isGenerating, downloadProgress, forward };
};
