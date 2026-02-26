import { useState, useEffect } from 'react';
import {
  SemanticSegmentationModule,
  SegmentationLabels,
} from '../../modules/computer_vision/SemanticSegmentationModule';
import {
  SemanticSegmentationProps,
  SemanticSegmentationType,
  ModelNameOf,
  SemanticSegmentationModelSources,
} from '../../types/semanticSegmentation';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing a Semantic Segmentation model instance.
 *
 * @typeParam C - A {@link SemanticSegmentationModelSources} config specifying which built-in model to load.
 * @param props - Configuration object containing `model` config and optional `preventLoad` flag.
 * @returns An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and a typed `forward` function.
 *
 * @example
 * ```ts
 * const { isReady, forward } = useSemanticSegmentation({
 *   model: { modelName: 'deeplab-v3', modelSource: DEEPLAB_V3_RESNET50 },
 * });
 * ```
 *
 * @category Hooks
 */
export const useSemanticSegmentation = <
  C extends SemanticSegmentationModelSources,
>({
  model,
  preventLoad = false,
}: SemanticSegmentationProps<C>): SemanticSegmentationType<
  SegmentationLabels<ModelNameOf<C>>
> => {
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [instance, setInstance] = useState<SemanticSegmentationModule<
    ModelNameOf<C>
  > | null>(null);

  useEffect(() => {
    if (preventLoad) return;

    let isMounted = true;
    let currentInstance: SemanticSegmentationModule<ModelNameOf<C>> | null =
      null;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      setIsReady(false);
      try {
        currentInstance = await SemanticSegmentationModule.fromModelName(
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

  const forward = async <K extends keyof SegmentationLabels<ModelNameOf<C>>>(
    imageSource: string,
    classesOfInterest: K[] = [],
    resizeToInput: boolean = true
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
