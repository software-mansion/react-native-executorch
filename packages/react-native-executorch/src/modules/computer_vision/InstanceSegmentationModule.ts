import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource, LabelEnum } from '../../types/common';
import {
  InstanceSegmentationModelSources,
  InstanceSegmentationConfig,
  InstanceSegmentationModelName,
  InstanceModelNameOf,
  GenericInstanceMask,
  InstanceSegmentationOptions,
} from '../../types/instanceSegmentation';
import { CocoLabel } from '../../types/objectDetection';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';

const ModelConfigs = {
  'yolo26n-seg': {
    labelMap: CocoLabel,
    availableInputSizes: [384, 416, 512, 640, 1024] as const,
    defaultInputSize: 416,
    postprocessorConfig: {
      type: 'yolo' as const,
      defaultConfidenceThreshold: 0.5,
      defaultIouThreshold: 0.45,
    },
  },
  'yolo26s-seg': {
    labelMap: CocoLabel,
    availableInputSizes: [384, 416, 512, 640, 1024] as const,
    defaultInputSize: 416,
    postprocessorConfig: {
      type: 'yolo' as const,
      defaultConfidenceThreshold: 0.5,
      defaultIouThreshold: 0.45,
    },
  },
  'yolo26m-seg': {
    labelMap: CocoLabel,
    availableInputSizes: [384, 416, 512, 640, 1024] as const,
    defaultInputSize: 416,
    postprocessorConfig: {
      type: 'yolo' as const,
      defaultConfidenceThreshold: 0.5,
      defaultIouThreshold: 0.45,
    },
  },
  'yolo26l-seg': {
    labelMap: CocoLabel,
    availableInputSizes: [384, 416, 512, 640, 1024] as const,
    defaultInputSize: 416,
    postprocessorConfig: {
      type: 'yolo' as const,
      defaultConfidenceThreshold: 0.5,
      defaultIouThreshold: 0.45,
    },
  },
  'yolo26x-seg': {
    labelMap: CocoLabel,
    availableInputSizes: [384, 416, 512, 640, 1024] as const,
    defaultInputSize: 416,
    postprocessorConfig: {
      type: 'yolo' as const,
      defaultConfidenceThreshold: 0.5,
      defaultIouThreshold: 0.45,
    },
  },
  'rfdetr_seg': {
    labelMap: CocoLabel,
    availableInputSizes: [640, 1024] as const,
    defaultInputSize: 640,
    preprocessorConfig: {
      normMean: [0.485, 0.456, 0.406] as [number, number, number],
      normStd: [0.229, 0.224, 0.225] as [number, number, number],
    },
    postprocessorConfig: {
      type: 'rfdetr' as const,
      defaultConfidenceThreshold: 0.7,
      defaultIouThreshold: 0.5,
    },
  },
} as const satisfies Record<
  InstanceSegmentationModelName,
  InstanceSegmentationConfig<LabelEnum>
>;

/** @internal */
type ModelConfigsType = typeof ModelConfigs;

/**
 * Resolves the {@link LabelEnum} for a given built-in model name.
 *
 * @typeParam M - A built-in model name from {@link InstanceSegmentationModelName}.
 *
 * @category Types
 */
export type InstanceSegmentationLabels<
  M extends InstanceSegmentationModelName,
> = ModelConfigsType[M]['labelMap'];

/**
 * @internal
 * Resolves the label type: if `T` is a {@link InstanceSegmentationModelName}, looks up its labels
 * from the built-in config; otherwise uses `T` directly as a {@link LabelEnum}.
 */
type ResolveLabels<T extends InstanceSegmentationModelName | LabelEnum> =
  T extends InstanceSegmentationModelName ? InstanceSegmentationLabels<T> : T;

/**
 * Generic instance segmentation module with type-safe label maps.
 * Use a model name (e.g. `'yolo26n-seg'`) as the generic parameter for built-in models,
 * or a custom label enum for custom configs.
 *
 * @typeParam T - Either a built-in model name or a custom {@link LabelEnum} label map.
 *
 * @category Typescript API
 */
export class InstanceSegmentationModule<
  T extends InstanceSegmentationModelName | LabelEnum,
> extends BaseModule {
  private labelMap: ResolveLabels<T>;
  private modelConfig: InstanceSegmentationConfig<ResolveLabels<T>>;

  private constructor(
    labelMap: ResolveLabels<T>,
    modelConfig: InstanceSegmentationConfig<ResolveLabels<T>>,
    nativeModule: unknown
  ) {
    super();
    this.labelMap = labelMap;
    this.modelConfig = modelConfig;
    this.nativeModule = nativeModule;
  }

  // TODO: figure it out so we can delete this (we need this because of basemodule inheritance)
  override async load() {}

  /**
   * Creates an instance segmentation module for a built-in model.
   * The config object is discriminated by `modelName` — each model can require different fields.
   *
   * @param config - A {@link InstanceSegmentationModelSources} object specifying which model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `InstanceSegmentationModule` instance typed to the chosen model's label map.
   *
   * @example
   * ```ts
   * const segmentation = await InstanceSegmentationModule.fromModelName({
   *   modelName: 'yolo26n-seg',
   *   modelSource: 'https://example.com/yolo26n-seg.pte',
   * });
   * ```
   */
  static async fromModelName<C extends InstanceSegmentationModelSources>(
    config: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<InstanceSegmentationModule<InstanceModelNameOf<C>>> {
    const { modelName, modelSource } = config;
    const { labelMap } = ModelConfigs[modelName];

    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (!paths?.[0]) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
      );
    }

    if (typeof global.loadInstanceSegmentation !== 'function') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        `global.loadInstanceSegmentation is not available`
      );
    }

    const nativeModule = global.loadInstanceSegmentation(paths[0]);

    return new InstanceSegmentationModule<InstanceModelNameOf<C>>(
      labelMap as ResolveLabels<InstanceModelNameOf<C>>,
      nativeModule
    );
  }

  /**
   * Creates an instance segmentation module with a user-provided label map and custom config.
   * Use this when working with a custom-exported segmentation model that is not one of the built-in models.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param config - A {@link InstanceSegmentationConfig} object with the label map.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `InstanceSegmentationModule` instance typed to the provided label map.
   *
   * @example
   * ```ts
   * const MyLabels = { PERSON: 0, CAR: 1 } as const;
   * const segmentation = await InstanceSegmentationModule.fromCustomConfig(
   *   'https://example.com/custom_model.pte',
   *   { labelMap: MyLabels },
   * );
   * ```
   */
  static async fromCustomConfig<L extends LabelEnum>(
    modelSource: ResourceSource,
    config: InstanceSegmentationConfig<L>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<InstanceSegmentationModule<L>> {
    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (!paths?.[0]) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. Please retry.'
      );
    }

    const nativeModule = global.loadInstanceSegmentation(paths[0]);

    return new InstanceSegmentationModule<L>(
      config.labelMap as ResolveLabels<L>,
      nativeModule
    );
  }

  /**
   * Executes the model's forward pass to perform instance segmentation on the provided image.
   *
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or Base64-encoded string).
   * @param options - Optional configuration for the segmentation process.
   * @returns A Promise resolving to an array of instance masks.
   * @throws {RnExecutorchError} If the model is not loaded.
   */
  async forward(
    imageSource: string,
    options?: InstanceSegmentationOptions<ResolveLabels<T>>
  ): Promise<GenericInstanceMask<ResolveLabels<T>>[]> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded.'
      );
    }

    // Extract options with defaults
    const confidenceThreshold = options?.confidenceThreshold ?? 0.5;
    const iouThreshold = options?.iouThreshold ?? 0.45;
    const maxInstances = options?.maxInstances ?? 100;
    const returnMaskAtOriginalResolution =
      options?.returnMaskAtOriginalResolution ?? true;
    const methodName = options?.methodName ?? 'forward_512';

    // Convert classesOfInterest labels to indices
    const classIndices = options?.classesOfInterest
      ? options.classesOfInterest.map((label) => {
          const labelStr = String(label);
          const index = this.labelMap[labelStr as keyof ResolveLabels<T>];
          return typeof index === 'number' ? index : -1;
        })
      : [];

    const nativeResult = await this.nativeModule.generate(
      imageSource,
      confidenceThreshold,
      iouThreshold,
      maxInstances,
      classIndices,
      returnMaskAtOriginalResolution,
      methodName
    );

    // Convert label indices back to label names
    const reverseLabelMap = Object.entries(this.labelMap).reduce(
      (acc, [key, value]) => {
        acc[value as number] = key;
        return acc;
      },
      {} as Record<number, string>
    );

    return nativeResult.map((instance: any) => ({
      ...instance,
      label: reverseLabelMap[instance.label] || `UNKNOWN_${instance.label}`,
    })) as GenericInstanceMask<ResolveLabels<T>>[];
  }
}
