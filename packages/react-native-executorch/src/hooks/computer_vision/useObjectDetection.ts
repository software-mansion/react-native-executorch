import {
  ObjectDetectionModule,
  ObjectDetectionLabels,
} from '../../modules/computer_vision/ObjectDetectionModule';
import {
  ObjectDetectionModelSources,
  ObjectDetectionProps,
  ObjectDetectionType,
} from '../../types/objectDetection';
import { useMemo } from 'react';
import { PixelData } from '../../types/common';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing an Object Detection model instance.
 *
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
    instance,
  } = useModuleFactory({
    factory: (config, onProgress) =>
      ObjectDetectionModule.fromModelName(config, onProgress),
    config: model,
    preventLoad,
  });

  const forward = (input: string | PixelData, detectionThreshold?: number) =>
    runForward((inst) => inst.forward(input, detectionThreshold));

  const runOnFrame = useMemo(() => instance?.runOnFrame ?? null, [instance]);

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forward,
    runOnFrame,
  };
};
