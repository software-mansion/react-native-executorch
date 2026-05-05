import {
  PoseEstimationModule,
  PoseEstimationKeypoints,
} from '../../modules/computer_vision/PoseEstimationModule';
import {
  PoseEstimationModelSources,
  PoseEstimationProps,
  PoseEstimationType,
  PoseEstimationOptions,
} from '../../types/poseEstimation';
import { PixelData } from '../../types/common';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing a Pose Estimation model instance.
 * @typeParam C - A {@link PoseEstimationModelSources} config specifying which built-in model to load.
 * @category Hooks
 * @param props - Configuration object containing `model` config and optional `preventLoad` flag.
 * @returns An object with model state (`error`, `isReady`, `isGenerating`, `downloadProgress`) and typed `forward` and `runOnFrame` functions.
 */
export const usePoseEstimation = <C extends PoseEstimationModelSources>({
  model,
  preventLoad = false,
}: PoseEstimationProps<C>): PoseEstimationType<
  PoseEstimationKeypoints<C['modelName']>
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
      PoseEstimationModule.fromModelName(config, onProgress),
    config: model,
    deps: [model.modelName, model.modelSource],
    preventLoad,
  });

  const forward = (
    input: string | PixelData,
    options?: PoseEstimationOptions
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
