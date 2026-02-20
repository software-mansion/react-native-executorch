import { useState, useEffect } from 'react';
import {
  ObjectDetectionModule,
  ObjectDetectionLabels,
} from '../../modules/computer_vision/ObjectDetectionModule';
import {
  ObjectDetectionModelSources,
  ObjectDetectionProps,
  ObjectDetectionType,
} from '../../types/objectDetection';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

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
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [instance, setInstance] = useState<ObjectDetectionModule<
    C['modelName']
  > | null>(null);

  useEffect(() => {
    if (preventLoad) return;

    let currentInstance: ObjectDetectionModule<C['modelName']> | null = null;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      setIsReady(false);
      try {
        currentInstance = await ObjectDetectionModule.fromModelName(
          model,
          setDownloadProgress
        );
        setInstance(currentInstance);
        setIsReady(true);
      } catch (err) {
        setError(parseUnknownError(err));
      }
    })();

    return () => {
      currentInstance?.delete();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.modelName, model.modelSource, preventLoad]);

  const forward = async (imageSource: string, detectionThreshold?: number) => {
    if (!isReady || !instance) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    }
    if (isGenerating) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    }
    try {
      setIsGenerating(true);
      return (await instance.forward(
        imageSource,
        detectionThreshold
      )) as Awaited<
        ReturnType<
          ObjectDetectionType<ObjectDetectionLabels<C['modelName']>>['forward']
        >
      >;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forward,
  };
};
