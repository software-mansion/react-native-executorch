import { LabelEnum, ResourceSource, PixelData, Frame } from '../../types/common';
import {
  Detection,
  ObjectDetectionConfig,
  ObjectDetectionModelName,
  ObjectDetectionModelSources,
} from '../../types/objectDetection';
import {
  CocoLabel,
  IMAGENET1K_MEAN,
  IMAGENET1K_STD,
} from '../../constants/commonVision';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import {
  BaseLabeledModule,
  fetchModelPath,
  ResolveLabels as ResolveLabelsFor,
} from '../BaseLabeledModule';

const ModelConfigs = {
  'ssdlite-320-mobilenet-v3-large': {
    labelMap: CocoLabel,
    preprocessorConfig: undefined,
  },
  'rf-detr-nano': {
    labelMap: CocoLabel,
    preprocessorConfig: { normMean: IMAGENET1K_MEAN, normStd: IMAGENET1K_STD },
  },
} as const satisfies Record<
  ObjectDetectionModelName,
  ObjectDetectionConfig<LabelEnum>
>;

type ModelConfigsType = typeof ModelConfigs;

/**
 * Resolves the {@link LabelEnum} for a given built-in object detection model name.
 *
 * @typeParam M - A built-in model name from {@link ObjectDetectionModelName}.
 *
 * @category Types
 */
export type ObjectDetectionLabels<M extends ObjectDetectionModelName> =
  ResolveLabelsFor<M, ModelConfigsType>;

type ModelNameOf<C extends ObjectDetectionModelSources> = C['modelName'];

/** @internal */
type ResolveLabels<T extends ObjectDetectionModelName | LabelEnum> =
  ResolveLabelsFor<T, ModelConfigsType>;

/**
 * Generic object detection module with type-safe label maps.
 *
 * @typeParam T - Either a built-in model name (e.g. `'ssdlite-320-mobilenet-v3-large'`)
 *   or a custom {@link LabelEnum} label map.
 *
 * @category Typescript API
 */
export class ObjectDetectionModule<
  T extends ObjectDetectionModelName | LabelEnum,
> extends BaseLabeledModule<ResolveLabels<T>> {
  private constructor(labelMap: ResolveLabels<T>, nativeModule: unknown) {
    super(labelMap, nativeModule);
  }

  /**
   * Creates an object detection instance for a built-in model.
   *
   * @param config - A {@link ObjectDetectionModelSources} object specifying which model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ObjectDetectionModule` instance typed to the chosen model's label map.
   */
  static async fromModelName<C extends ObjectDetectionModelSources>(
    config: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ObjectDetectionModule<ModelNameOf<C>>> {
    const { modelSource } = config;
    const { labelMap, preprocessorConfig } = ModelConfigs[
      config.modelName
    ] as ObjectDetectionConfig<LabelEnum>;
    const normMean = preprocessorConfig?.normMean ?? [];
    const normStd = preprocessorConfig?.normStd ?? [];
    const allLabelNames: string[] = [];
    for (const [name, value] of Object.entries(labelMap)) {
      if (typeof value === 'number') allLabelNames[value] = name;
    }
    for (let i = 0; i < allLabelNames.length; i++) {
      if (allLabelNames[i] == null) allLabelNames[i] = '';
    }
    const modelPath = await fetchModelPath(modelSource, onDownloadProgress);
    const nativeModule = global.loadObjectDetection(
      modelPath,
      normMean,
      normStd,
      allLabelNames
    );
    return new ObjectDetectionModule<ModelNameOf<C>>(
      labelMap as ResolveLabels<ModelNameOf<C>>,
      nativeModule
    );
  }

  /**
   * Creates an object detection instance with a user-provided label map and custom config.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param config - A {@link ObjectDetectionConfig} object with the label map.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ObjectDetectionModule` instance typed to the provided label map.
   */
  static async fromCustomConfig<L extends LabelEnum>(
    modelSource: ResourceSource,
    config: ObjectDetectionConfig<L>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ObjectDetectionModule<L>> {
    const normMean = config.preprocessorConfig?.normMean ?? [];
    const normStd = config.preprocessorConfig?.normStd ?? [];
    const allLabelNames: string[] = [];
    for (const [name, value] of Object.entries(config.labelMap)) {
      if (typeof value === 'number') allLabelNames[value] = name;
    }
    for (let i = 0; i < allLabelNames.length; i++) {
      if (allLabelNames[i] == null) allLabelNames[i] = '';
    }
    const modelPath = await fetchModelPath(modelSource, onDownloadProgress);
    const nativeModule = global.loadObjectDetection(
      modelPath,
      normMean,
      normStd,
      allLabelNames
    );
    return new ObjectDetectionModule<L>(
      config.labelMap as ResolveLabels<L>,
      nativeModule
    );
  }

  /**
   * Executes the model's forward pass to detect objects within the provided image.
   *
   * @param input - A string image source (file path, URI, or Base64) or a {@link PixelData} object.
   * @param detectionThreshold - Minimum confidence score for a detection to be included. Default is 0.7.
   * @returns A Promise resolving to an array of {@link Detection} objects.
   * @throws {RnExecutorchError} If the model is not loaded.
   */
  async forward(
    input: string | PixelData,
    detectionThreshold: number = 0.7
  ): Promise<Detection<ResolveLabels<T>>[]> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded.'
      );
    }
    if (typeof input === 'string') {
      return await this.nativeModule.generateFromString(
        input,
        detectionThreshold
      );
    }
    return await this.nativeModule.generateFromPixels(
      input,
      detectionThreshold
    );
  }

  /**
   * Synchronous worklet function for real-time VisionCamera frame processing.
   * The label names are captured from the module instance — no need to pass them per frame.
   *
   * **Use this for VisionCamera frame processing in worklets.**
   * For async processing, use `forward()` instead.
   */
  get runOnFrame():
    | ((frame: Frame, detectionThreshold: number) => Detection<ResolveLabels<T>>[])
    | null {
    if (!this.nativeModule?.generateFromFrame) {
      return null;
    }

    const nativeGenerateFromFrame = this.nativeModule.generateFromFrame;

    return (
      frame: Frame,
      detectionThreshold: number
    ): Detection<ResolveLabels<T>>[] => {
      'worklet';

      let nativeBuffer: ReturnType<Frame['getNativeBuffer']> | null = null;
      try {
        nativeBuffer = frame.getNativeBuffer();
        const frameData = { nativeBuffer: nativeBuffer.pointer };
        return nativeGenerateFromFrame(frameData, detectionThreshold);
      } finally {
        if (nativeBuffer?.release) {
          nativeBuffer.release();
        }
      }
    };
  }
}
