import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource, LabelEnum } from '../../types/common';
import {
  InstanceSegmentationModelSources,
  InstanceSegmentationConfig,
  InstanceSegmentationModelName,
  InstanceModelNameOf,
  SegmentedInstance,
  InstanceSegmentationOptions,
} from '../../types/instanceSegmentation';
import { CocoLabel } from '../../types/objectDetection';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';

/**
 * Configuration for YOLO instance segmentation models.
 * @category Configuration
 */
export const YOLO_SEG_CONFIG: InstanceSegmentationConfig<typeof CocoLabel> = {
  labelMap: CocoLabel,
  availableInputSizes: [384, 416, 512, 640, 1024] as const,
  defaultInputSize: 416,
  postprocessorConfig: {
    type: 'yolo',
    defaultConfidenceThreshold: 0.5,
    defaultIouThreshold: 0.5,
    applyNMS: false, // YOLO already applies NMS internally
  },
};

const ModelConfigs = {
  'yolo26n-seg': YOLO_SEG_CONFIG,
  'yolo26s-seg': YOLO_SEG_CONFIG,
  'yolo26m-seg': YOLO_SEG_CONFIG,
  'yolo26l-seg': YOLO_SEG_CONFIG,
  'yolo26x-seg': YOLO_SEG_CONFIG,
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
 * Use a model name (e.g. `'yolo26n-seg'`) as the generic parameter for pre-configured models,
 * or a custom label enum for custom configs.
 *
 * Supported models (download from HuggingFace):
 * - `yolo26n-seg`, `yolo26s-seg`, `yolo26m-seg`, `yolo26l-seg`, `yolo26x-seg` - YOLO models with COCO labels (80 classes)
 *
 * @typeParam T - Either a pre-configured model name from {@link InstanceSegmentationModelName}
 *   or a custom {@link LabelEnum} label map.
 *
 * @category Typescript API
 *
 * @example
 * ```ts
 * const segmentation = await InstanceSegmentationModule.fromModelName({
 *   modelName: 'yolo26n-seg',
 *   modelSource: 'https://huggingface.co/.../yolo26n-seg.pte',
 * });
 *
 * const results = await segmentation.forward('path/to/image.jpg', {
 *   confidenceThreshold: 0.5,
 *   iouThreshold: 0.45,
 *   maxInstances: 20,
 *   inputSize: 640,
 * });
 * ```
 */
export class InstanceSegmentationModule<
  T extends InstanceSegmentationModelName | LabelEnum,
> extends BaseModule {
  private labelMap: ResolveLabels<T>;
  private modelConfig: InstanceSegmentationConfig<LabelEnum>;

  private constructor(
    labelMap: ResolveLabels<T>,
    modelConfig: InstanceSegmentationConfig<LabelEnum>,
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
   * Creates an instance segmentation module for a pre-configured model.
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
   *   modelSource: 'https://huggingface.co/.../yolo26n-seg.pte',
   * });
   * ```
   */
  static async fromModelName<C extends InstanceSegmentationModelSources>(
    config: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<InstanceSegmentationModule<InstanceModelNameOf<C>>> {
    const { modelName, modelSource } = config;
    const modelConfig = ModelConfigs[modelName as keyof typeof ModelConfigs];

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

    // Pass config parameters to native module
    const nativeModule = global.loadInstanceSegmentation(
      paths[0],
      modelConfig.postprocessorConfig.type,
      modelConfig.preprocessorConfig?.normMean || [],
      modelConfig.preprocessorConfig?.normStd || [],
      modelConfig.postprocessorConfig.applyNMS ?? true
    );

    return new InstanceSegmentationModule<InstanceModelNameOf<C>>(
      modelConfig.labelMap as ResolveLabels<InstanceModelNameOf<C>>,
      modelConfig,
      nativeModule
    );
  }

  /**
   * Creates an instance segmentation module with a user-provided label map and custom config.
   * Use this when working with a custom-exported segmentation model that is not one of the pre-configured models.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param config - A {@link InstanceSegmentationConfig} object with the label map and optional preprocessing parameters.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `InstanceSegmentationModule` instance typed to the provided label map.
   *
   * @example
   * ```ts
   * const MyLabels = { PERSON: 0, CAR: 1 } as const;
   * const segmentation = await InstanceSegmentationModule.fromCustomConfig(
   *   'https://huggingface.co/.../custom_model.pte',
   *   {
   *     labelMap: MyLabels,
   *     availableInputSizes: [640],
   *     defaultInputSize: 640,
   *     postprocessorConfig: {
   *       type: 'yolo',
   *       defaultConfidenceThreshold: 0.5,
   *       defaultIouThreshold: 0.45,
   *       applyNMS: true,
   *     },
   *   },
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

    if (typeof global.loadInstanceSegmentation !== 'function') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        `global.loadInstanceSegmentation is not available`
      );
    }

    // Pass config parameters to native module
    const nativeModule = global.loadInstanceSegmentation(
      paths[0],
      config.postprocessorConfig.type,
      config.preprocessorConfig?.normMean || [],
      config.preprocessorConfig?.normStd || [],
      config.postprocessorConfig.applyNMS ?? true
    );

    return new InstanceSegmentationModule<L>(
      config.labelMap as ResolveLabels<L>,
      config,
      nativeModule
    );
  }

  /**
   * Executes the model's forward pass to perform instance segmentation on the provided image.
   *
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or Base64-encoded string).
   * @param options - Optional configuration for the segmentation process. Includes `confidenceThreshold`, `iouThreshold`, `maxInstances`, `classesOfInterest`, `returnMaskAtOriginalResolution`, and `inputSize`.
   * @returns A Promise resolving to an array of {@link SegmentedInstance} objects with `bbox`, `mask`, `maskWidth`, `maskHeight`, `label`, `score`, and `instanceId`.
   * @throws {RnExecutorchError} If the model is not loaded or if an invalid `inputSize` is provided.
   *
   * @example
   * ```ts
   * const results = await segmentation.forward('path/to/image.jpg', {
   *   confidenceThreshold: 0.6,
   *   iouThreshold: 0.5,
   *   maxInstances: 10,
   *   inputSize: 640,
   *   classesOfInterest: ['PERSON', 'CAR'],
   *   returnMaskAtOriginalResolution: true,
   * });
   *
   * results.forEach((inst) => {
   *   console.log(`${inst.label}: ${(inst.score * 100).toFixed(1)}%`);
   * });
   * ```
   */
  async forward(
    imageSource: string,
    options?: InstanceSegmentationOptions<ResolveLabels<T>>
  ): Promise<SegmentedInstance<ResolveLabels<T>>[]> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded.'
      );
    }

    // Extract options with defaults from config
    const confidenceThreshold =
      options?.confidenceThreshold ??
      this.modelConfig.postprocessorConfig.defaultConfidenceThreshold ??
      0.55;
    const iouThreshold =
      options?.iouThreshold ??
      this.modelConfig.postprocessorConfig.defaultIouThreshold ??
      0.55;
    const maxInstances = options?.maxInstances ?? 100;
    const returnMaskAtOriginalResolution =
      options?.returnMaskAtOriginalResolution ?? true;

    // Determine inputSize based on config
    let inputSize: number;

    if (
      this.modelConfig.availableInputSizes &&
      this.modelConfig.defaultInputSize
    ) {
      // Multi-method model: validate against available sizes
      inputSize = options?.inputSize ?? this.modelConfig.defaultInputSize;

      if (!this.modelConfig.availableInputSizes.includes(inputSize)) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.InvalidArgument,
          `Invalid inputSize: ${inputSize}. Available sizes: ${this.modelConfig.availableInputSizes.join(', ')}`
        );
      }
    } else {
      // Single-method model: use 0 to signal C++ to use 'forward' method
      inputSize = 0;

      if (options?.inputSize !== undefined) {
        console.warn(
          '[Instance Segmentation] inputSize parameter ignored - model config does not specify availableInputSizes'
        );
      }
    }

    // Convert classesOfInterest labels to indices
    const classIndices = options?.classesOfInterest
      ? options.classesOfInterest.map((label) => {
          const labelStr = String(label);
          const index = this.labelMap[labelStr as keyof ResolveLabels<T>];
          return typeof index === 'number' ? index : -1;
        })
      : [];

    // Measure inference time
    const startTime = performance.now();
    const nativeResult = await this.nativeModule.generate(
      imageSource,
      confidenceThreshold,
      iouThreshold,
      maxInstances,
      classIndices,
      returnMaskAtOriginalResolution,
      inputSize // Pass inputSize as number instead of methodName as string
    );
    const endTime = performance.now();
    const inferenceTime = endTime - startTime;

    const sizeStr = inputSize > 0 ? `${inputSize}x${inputSize}` : 'auto';
    console.log(
      `[Instance Segmentation] Inference completed in ${inferenceTime.toFixed(2)}ms | Input size: ${sizeStr} | Detected: ${nativeResult.length} instances`
    );

    // Convert label indices back to label names
    // YOLO outputs 0-indexed class IDs, but COCO labels are 1-indexed, so add 1
    const reverseLabelMap = Object.entries(
      this.labelMap as Record<string, number>
    ).reduce(
      (acc, [key, value]) => {
        acc[value as number] = key as keyof ResolveLabels<T>;
        return acc;
      },
      {} as Record<number, keyof ResolveLabels<T>>
    );

    return nativeResult.map((instance: any) => ({
      ...instance,
      label:
        reverseLabelMap[instance.label + 1] ||
        (`UNKNOWN_${instance.label}` as keyof ResolveLabels<T>),
    })) as SegmentedInstance<ResolveLabels<T>>[];
  }
}
