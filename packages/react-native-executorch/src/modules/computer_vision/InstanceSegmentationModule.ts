import { ResourceSource, LabelEnum } from '../../types/common';
import {
  InstanceSegmentationModelSources,
  InstanceSegmentationConfig,
  InstanceSegmentationModelName,
  InstanceModelNameOf,
  NativeSegmentedInstance,
  SegmentedInstance,
  InstanceSegmentationOptions,
} from '../../types/instanceSegmentation';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import {
  BaseLabeledModule,
  fetchModelPath,
  ResolveLabels as ResolveLabelsFor,
} from '../BaseLabeledModule';
import {
  CocoLabel,
  CocoLabelYolo,
  IMAGENET1K_MEAN,
  IMAGENET1K_STD,
} from '../../constants/commonVision';

const YOLO_SEG_CONFIG = {
  preprocessorConfig: undefined,
  labelMap: CocoLabelYolo,
  availableInputSizes: [384, 512, 640] as const,
  defaultInputSize: 384,
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.5,
  postprocessorConfig: {
    applyNMS: false,
  },
} satisfies InstanceSegmentationConfig<typeof CocoLabelYolo>;

const RF_DETR_SEG_CONFIG = {
  preprocessorConfig: { normMean: IMAGENET1K_MEAN, normStd: IMAGENET1K_STD },
  labelMap: CocoLabel,
  availableInputSizes: undefined,
  defaultInputSize: undefined, //RFDetr exposes only one method named forward
  defaultConfidenceThreshold: 0.5,
  defaultIouThreshold: 0.5,
  postprocessorConfig: {
    applyNMS: true,
  },
} satisfies InstanceSegmentationConfig<typeof CocoLabel>;

/**
 * Builds a reverse map from 0-based model class index to label key name, and
 * computes the minimum enum value (offset) so TS enum values can be converted
 * to 0-based model indices.
 */
function buildClassIndexMap(labelMap: LabelEnum): {
  indexToLabel: Map<number, string>;
  minValue: number;
} {
  const entries: [string, number][] = [];
  for (const [name, value] of Object.entries(labelMap)) {
    if (typeof value === 'number') entries.push([name, value]);
  }
  const minValue = Math.min(...entries.map(([, v]) => v));
  const indexToLabel = new Map<number, string>();
  for (const [name, value] of entries) {
    indexToLabel.set(value - minValue, name);
  }
  return { indexToLabel, minValue };
}

const ModelConfigs = {
  'yolo26n-seg': YOLO_SEG_CONFIG,
  'yolo26s-seg': YOLO_SEG_CONFIG,
  'yolo26m-seg': YOLO_SEG_CONFIG,
  'yolo26l-seg': YOLO_SEG_CONFIG,
  'yolo26x-seg': YOLO_SEG_CONFIG,
  'rfdetr-seg': RF_DETR_SEG_CONFIG,
} as const;

/** @internal */
type ModelConfigsType = typeof ModelConfigs;

/**
 * Resolves the label map type for a given built-in model name.
 *
 * @typeParam M - A built-in model name from {@link InstanceSegmentationModelName}.
 *
 * @category Types
 */
export type InstanceSegmentationLabels<
  M extends InstanceSegmentationModelName,
> = ResolveLabels<M>;

/**
 * @internal
 * Resolves the label type: if `T` is a {@link InstanceSegmentationModelName}, looks up its labels
 * from the built-in config; otherwise uses `T` directly as a {@link LabelEnum}.
 */
type ResolveLabels<T extends InstanceSegmentationModelName | LabelEnum> =
  ResolveLabelsFor<T, ModelConfigsType>;

/**
 * Generic instance segmentation module with type-safe label maps.
 * Use a model name (e.g. `'yolo26n-seg'`) as the generic parameter for pre-configured models,
 * or a custom label enum for custom configs.
 *
 * Supported models (download from HuggingFace):
 * - `yolo26n-seg`, `yolo26s-seg`, `yolo26m-seg`, `yolo26l-seg`, `yolo26x-seg` - YOLO models with COCO labels (80 classes)
 *
 * @typeParam T - Either a pre-configured model name from {@link InstanceSegmentationModelName}
 *   or a custom label map conforming to {@link LabelEnum}.
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
> extends BaseLabeledModule<ResolveLabels<T>> {
  private modelConfig: InstanceSegmentationConfig<LabelEnum>;
  private classIndexToLabel: Map<number, string>;
  private labelEnumOffset: number;

  private constructor(
    labelMap: ResolveLabels<T>,
    modelConfig: InstanceSegmentationConfig<LabelEnum>,
    nativeModule: unknown,
    classIndexToLabel: Map<number, string>,
    labelEnumOffset: number
  ) {
    super(labelMap, nativeModule);
    this.modelConfig = modelConfig;
    this.classIndexToLabel = classIndexToLabel;
    this.labelEnumOffset = labelEnumOffset;
  }

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

    const path = await fetchModelPath(modelSource, onDownloadProgress);

    if (typeof global.loadInstanceSegmentation !== 'function') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        `global.loadInstanceSegmentation is not available`
      );
    }

    const { indexToLabel, minValue } = buildClassIndexMap(modelConfig.labelMap);

    const nativeModule = await global.loadInstanceSegmentation(
      path,
      modelConfig.preprocessorConfig?.normMean || [],
      modelConfig.preprocessorConfig?.normStd || [],
      modelConfig.postprocessorConfig?.applyNMS ?? true
    );

    return new InstanceSegmentationModule<InstanceModelNameOf<C>>(
      modelConfig.labelMap as ResolveLabels<InstanceModelNameOf<C>>,
      modelConfig,
      nativeModule,
      indexToLabel,
      minValue
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
   *     defaultConfidenceThreshold: 0.5,
   *     defaultIouThreshold: 0.45,
   *     postprocessorConfig: { applyNMS: true },
   *   },
   * );
   * ```
   */
  static async fromCustomConfig<L extends LabelEnum>(
    modelSource: ResourceSource,
    config: InstanceSegmentationConfig<L>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<InstanceSegmentationModule<L>> {
    const path = await fetchModelPath(modelSource, onDownloadProgress);

    if (typeof global.loadInstanceSegmentation !== 'function') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        `global.loadInstanceSegmentation is not available`
      );
    }

    const { indexToLabel, minValue } = buildClassIndexMap(config.labelMap);

    const nativeModule = await global.loadInstanceSegmentation(
      path,
      config.preprocessorConfig?.normMean || [],
      config.preprocessorConfig?.normStd || [],
      config.postprocessorConfig?.applyNMS ?? true
    );

    return new InstanceSegmentationModule<L>(
      config.labelMap as ResolveLabels<L>,
      config,
      nativeModule,
      indexToLabel,
      minValue
    );
  }

  /**
   * Returns the available input sizes for this model, or undefined if the model accepts any size.
   *
   * @returns An array of available input sizes, or undefined if not constrained.
   *
   * @example
   * ```ts
   * const sizes = segmentation.getAvailableInputSizes();
   * console.log(sizes); // [384, 512, 640] for YOLO models, or undefined for RF-DETR
   * ```
   */
  getAvailableInputSizes(): readonly number[] | undefined {
    return this.modelConfig.availableInputSizes;
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

    const confidenceThreshold =
      options?.confidenceThreshold ??
      this.modelConfig.defaultConfidenceThreshold ??
      0.5;
    const iouThreshold =
      options?.iouThreshold ?? this.modelConfig.defaultIouThreshold ?? 0.5;
    const maxInstances = options?.maxInstances ?? 100;
    const returnMaskAtOriginalResolution =
      options?.returnMaskAtOriginalResolution ?? true;

    const inputSize = options?.inputSize ?? this.modelConfig.defaultInputSize;

    if (
      this.modelConfig.availableInputSizes &&
      inputSize !== undefined &&
      !this.modelConfig.availableInputSizes.includes(
        inputSize as (typeof this.modelConfig.availableInputSizes)[number]
      )
    ) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidArgument,
        `Invalid inputSize: ${inputSize}. Available sizes: ${this.modelConfig.availableInputSizes.join(', ')}`
      );
    }

    const methodName =
      inputSize !== undefined ? `forward_${inputSize}` : 'forward';

    const classIndices = options?.classesOfInterest
      ? options.classesOfInterest.map((label) => {
          const labelStr = String(label);
          const enumValue = this.labelMap[labelStr as keyof ResolveLabels<T>];
          return typeof enumValue === 'number'
            ? enumValue - this.labelEnumOffset
            : -1;
        })
      : [];

    const nativeResult: NativeSegmentedInstance[] =
      await this.nativeModule.generate(
        imageSource,
        confidenceThreshold,
        iouThreshold,
        maxInstances,
        classIndices,
        returnMaskAtOriginalResolution,
        methodName
      );

    return nativeResult.map((inst) => ({
      bbox: inst.bbox,
      mask: inst.mask,
      maskWidth: inst.maskWidth,
      maskHeight: inst.maskHeight,
      label: (this.classIndexToLabel.get(
        inst.classIndex - this.labelEnumOffset
      ) ?? String(inst.classIndex)) as keyof ResolveLabels<T>,
      score: inst.score,
      instanceId: inst.instanceId,
    }));
  }
}
