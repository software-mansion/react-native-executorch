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
import { useModuleFactory } from '../useModuleFactory';

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
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        SemanticSegmentationModule.fromModelName(config, onProgress),
      config: model,
      preventLoad,
    });

  const forward = <K extends keyof SegmentationLabels<ModelNameOf<C>>>(
    imageSource: string,
    classesOfInterest: K[] = [],
    resizeToInput: boolean = true
  ) =>
    runForward((inst) =>
      inst.forward(imageSource, classesOfInterest, resizeToInput)
    );

  return { error, isReady, isGenerating, downloadProgress, forward };
};
