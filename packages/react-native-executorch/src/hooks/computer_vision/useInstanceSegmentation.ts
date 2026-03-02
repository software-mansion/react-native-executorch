import { useState, useEffect } from 'react';
import {
  InstanceSegmentationModule,
  InstanceSegmentationLabels,
} from '../../modules/computer_vision/InstanceSegmentationModule';
import {
  InstanceSegmentationProps,
  InstanceSegmentationType,
  InstanceModelNameOf,
  InstanceSegmentationModelSources,
  InstanceSegmentationOptions,
} from '../../types/instanceSegmentation';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing an Instance Segmentation model instance.
 *
 * Provides type-safe access to instance segmentation models with automatic label inference.
 * For YOLO models, labels are automatically typed as COCO dataset classes (80 categories).
 *
 * @typeParam C - A {@link InstanceSegmentationModelSources} config specifying which model to load.
 * @param props - Configuration object containing `model` config and optional `preventLoad` flag.
 * @returns An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and a typed `forward` function where result labels are type-safe.
 *
 * @example
 * Using a pre-configured model constant:
 * ```ts
 * import { useInstanceSegmentation, YOLO26N_SEG } from 'react-native-executorch';
 *
 * const { isReady, isGenerating, forward, error, downloadProgress } =
 *   useInstanceSegmentation({ model: YOLO26N_SEG });
 *
 * if (!isReady) {
 *   return <Text>Loading: {(downloadProgress * 100).toFixed(0)}%</Text>;
 * }
 *
 * const instances = await forward('path/to/image.jpg', {
 *   confidenceThreshold: 0.5,
 *   inputSize: 640,
 * });
 *
 * // instances[0].label is typed as COCO labels: "PERSON" | "CAR" | "DOG" | ...
 * console.log(instances[0].label); // TypeScript knows all possible values
 * ```
 *
 * @category Hooks
 */
export const useInstanceSegmentation = <
  C extends InstanceSegmentationModelSources,
>({
  model,
  preventLoad = false,
}: InstanceSegmentationProps<C>): InstanceSegmentationType<
  InstanceSegmentationLabels<InstanceModelNameOf<C>>
> => {
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [instance, setInstance] = useState<InstanceSegmentationModule<
    InstanceModelNameOf<C>
  > | null>(null);

  useEffect(() => {
    if (preventLoad) return;

    let isMounted = true;
    let currentInstance: InstanceSegmentationModule<
      InstanceModelNameOf<C>
    > | null = null;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      setIsReady(false);
      try {
        currentInstance = await InstanceSegmentationModule.fromModelName(
          model,
          (progress) => {
            if (isMounted) setDownloadProgress(progress);
          }
        );
        if (isMounted) {
          setInstance(currentInstance);
          setIsReady(true);
        }
      } catch (err) {
        if (isMounted) setError(parseUnknownError(err));
      }
    })();

    return () => {
      isMounted = false;
      currentInstance?.delete();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.modelName, model.modelSource, preventLoad]);

  const forward = async (
    imageSource: string,
    options?: InstanceSegmentationOptions<
      InstanceSegmentationLabels<InstanceModelNameOf<C>>
    >
  ) => {
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
      const result = await instance.forward(imageSource, options);
      return result as any;
    } catch (err) {
      setError(parseUnknownError(err));
      throw err;
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
