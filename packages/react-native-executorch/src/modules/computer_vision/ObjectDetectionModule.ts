import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { LabelEnum, ResourceSource } from '../../types/common';
import {
  CocoLabel,
  Detection,
  ObjectDetectionConfig,
  ObjectDetectionModelName,
  ObjectDetectionModelSources,
} from '../../types/objectDetection';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';
import { IMAGENET_MEAN, IMAGENET_STD } from '../../constants/commonVision';

const ModelConfigs = {
  'ssdlite-320-mobilenet-v3-large': {
    labelMap: CocoLabel,
    preprocessorConfig: undefined,
  },
  'rf-detr-nano': {
    labelMap: CocoLabel,
    preprocessorConfig: { normMean: IMAGENET_MEAN, normStd: IMAGENET_STD },
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
export type ObjectDetectionLabels<M extends keyof ModelConfigsType> =
  ModelConfigsType[M]['labelMap'];

type ModelNameOf<C extends ObjectDetectionModelSources> = C['modelName'];

/**
 * @internal
 * Resolves the label type: if `T` is a {@link ObjectDetectionModelName}, looks up its labels
 * from the built-in config; otherwise uses `T` directly as a {@link LabelEnum}.
 */
type ResolveLabels<T extends ObjectDetectionModelName | LabelEnum> =
  T extends ObjectDetectionModelName ? ObjectDetectionLabels<T> : T;

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
> extends BaseModule {
  private labelMap: ResolveLabels<T>;
  private allLabelNames: string[];

  private constructor(labelMap: ResolveLabels<T>, nativeModule: unknown) {
    super();
    this.labelMap = labelMap;
    this.allLabelNames = [];
    for (const [name, value] of Object.entries(this.labelMap)) {
      if (typeof value === 'number') {
        this.allLabelNames[value] = name;
      }
    }
    for (let i = 0; i < this.allLabelNames.length; i++) {
      if (this.allLabelNames[i] == null) {
        this.allLabelNames[i] = '';
      }
    }
    this.nativeModule = nativeModule;
  }

  // TODO: figure it out so we can delete this (we need this because of basemodule inheritance)
  override async load() {}

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
    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (!paths?.[0]) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. Please retry.'
      );
    }
    const nativeModule = global.loadObjectDetection(
      paths[0],
      normMean,
      normStd
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
    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (!paths?.[0]) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. Please retry.'
      );
    }
    const nativeModule = global.loadObjectDetection(
      paths[0],
      normMean,
      normStd
    );
    return new ObjectDetectionModule<L>(
      config.labelMap as ResolveLabels<L>,
      nativeModule
    );
  }

  /**
   * Executes the model's forward pass to detect objects within the provided image.
   *
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or base64 string).
   * @param detectionThreshold - Minimum confidence score for a detection to be included. Default is 0.7.
   * @returns A Promise resolving to an array of {@link Detection} objects.
   * @throws {RnExecutorchError} If the model is not loaded.
   */
  async forward(
    imageSource: string,
    detectionThreshold: number = 0.7
  ): Promise<Detection<ResolveLabels<T>>[]> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded.'
      );
    }
    return await this.nativeModule.generate(
      imageSource,
      detectionThreshold,
      this.allLabelNames
    );
  }
}
