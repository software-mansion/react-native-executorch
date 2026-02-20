import {
  ImageSegmentationModule,
  SegmentationLabels,
} from '../../modules/computer_vision/ImageSegmentationModule';
import {
  ImageSegmentationProps,
  ImageSegmentationType,
  ModelNameOf,
  ModelSources,
} from '../../types/imageSegmentation';
import { useModuleFactory } from '../useModuleFactory';

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
}: ImageSegmentationProps<C>): ImageSegmentationType<
  SegmentationLabels<ModelNameOf<C>>
> => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        ImageSegmentationModule.fromModelName(config, onProgress),
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
