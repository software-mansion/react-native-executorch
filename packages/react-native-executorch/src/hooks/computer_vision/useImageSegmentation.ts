import { useState, useEffect } from 'react';
import {
  ImageSegmentation,
  SegmentationLabels,
} from '../../modules/computer_vision/ImageSegmentationModule';
import {
  ImageSegmentationProps,
  ModelNameOf,
  ModelSources,
} from '../../types/imageSegmentation';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing an Image Segmentation model instance.
 *
 * @typeParam C - A {@link ModelSources} config specifying which built-in model to load.
 * @param props - Configuration object containing `model` config and optional `preventLoad` flag.
 * @returns An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and a typed `forward` function.
 *
 * @example
 * ```ts
 * const { isReady, forward } = useImageSegmentation({
 *   model: { modelName: 'deeplab-v3', modelSource: DEEPLAB_V3_RESNET50 },
 * });
 * ```
 *
 * @category Hooks
 */
export const useImageSegmentation = <C extends ModelSources>({
  model,
  preventLoad = false,
}: ImageSegmentationProps<C>) => {
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [instance, setInstance] = useState<ImageSegmentation<
    ModelNameOf<C>
  > | null>(null);

  useEffect(() => {
    if (preventLoad) return;

    let currentInstance: ImageSegmentation<ModelNameOf<C>> | null = null;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      setIsReady(false);
      try {
        currentInstance = await ImageSegmentation.fromModelName(
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

  const forward = async <
    K extends keyof SegmentationLabels<ModelNameOf<C>> | 'ARGMAX' = 'ARGMAX',
  >(
    imageSource: string,
    classesOfInterest: K[] = ['ARGMAX' as K],
    resizeToInput: boolean = true
  ): Promise<Record<K, number[]>> => {
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
      return await instance.forward(
        imageSource,
        classesOfInterest,
        resizeToInput
      );
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
