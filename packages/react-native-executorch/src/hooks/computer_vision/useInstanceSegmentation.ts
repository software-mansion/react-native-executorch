import {
  InstanceSegmentationModule,
  InstanceSegmentationLabels,
} from '../../modules/computer_vision/InstanceSegmentationModule';
import {
  InstanceSegmentationProps,
  InstanceSegmentationType,
  InstanceModelNameOf,
  InstanceSegmentationModelSources,
} from '../../types/instanceSegmentation';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing an Instance Segmentation model instance.
 *
 * @typeParam C - A {@link InstanceSegmentationModelSources} config specifying which model to load.
 * @param props - Configuration object containing `model` config and optional `preventLoad` flag.
 * @returns An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and a typed `forward` function.
 *
 * @example
 * ```ts
 * const { isReady, isGenerating, forward, error, downloadProgress } =
 *   useInstanceSegmentation({
 *     model: {
 *       modelName: 'yolo26n-seg',
 *       modelSource: 'https://huggingface.co/.../yolo26n-seg.pte',
 *     },
 *   });
 *
 * if (!isReady) {
 *   return <Text>Loading: {(downloadProgress * 100).toFixed(0)}%</Text>;
 * }
 *
 * const results = await forward('path/to/image.jpg', {
 *   confidenceThreshold: 0.5,
 *   inputSize: 640,
 * });
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
  InstanceSegmentationLabels<C['modelName']>
> => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory<InstanceSegmentationModule<InstanceModelNameOf<C>>, C>({
      factory: InstanceSegmentationModule.fromModelName,
      config: model,
      preventLoad,
    });

  const forward: InstanceSegmentationType<
    InstanceSegmentationLabels<C['modelName']>
  >['forward'] = (imageSource, options) =>
    runForward((instance) => instance.forward(imageSource, options) as any);

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forward,
  };
};
