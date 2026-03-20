import { LabelEnum, PixelData, ResourceSource } from '../../types/common';
import {
  Detection,
  ObjectDetectionConfig,
  ObjectDetectionModelName,
  ObjectDetectionModelSources,
  ObjectDetectionOptions,
} from '../../types/objectDetection';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import {
  CocoLabel,
  CocoLabelYolo,
  IMAGENET1K_MEAN,
  IMAGENET1K_STD,
} from '../../constants/commonVision';
import {
  fetchModelPath,
  ResolveLabels as ResolveLabelsFor,
  VisionLabeledModule,
} from './VisionLabeledModule';

const YOLO_DETECTION_CONFIG = {
  labelMap: CocoLabelYolo,
  preprocessorConfig: undefined,
  availableInputSizes: [384, 512, 640] as const,
  defaultInputSize: 384,
  defaultDetectionThreshold: 0.5,
  defaultIouThreshold: 0.5,
} satisfies ObjectDetectionConfig<typeof CocoLabelYolo>;

const ModelConfigs = {
  'ssdlite-320-mobilenet-v3-large': {
    labelMap: CocoLabel,
    preprocessorConfig: undefined,
    availableInputSizes: undefined,
    defaultInputSize: undefined,
    defaultDetectionThreshold: 0.7,
    defaultIouThreshold: 0.55,
  },
  'rf-detr-nano': {
    labelMap: CocoLabel,
    preprocessorConfig: { normMean: IMAGENET1K_MEAN, normStd: IMAGENET1K_STD },
    availableInputSizes: undefined,
    defaultInputSize: undefined,
    defaultDetectionThreshold: 0.7,
    defaultIouThreshold: 0.55,
  },
  'yolo26n': YOLO_DETECTION_CONFIG,
  'yolo26s': YOLO_DETECTION_CONFIG,
  'yolo26m': YOLO_DETECTION_CONFIG,
  'yolo26l': YOLO_DETECTION_CONFIG,
  'yolo26x': YOLO_DETECTION_CONFIG,
} as const satisfies Record<
  ObjectDetectionModelName,
  ObjectDetectionConfig<LabelEnum>
>;

type ModelConfigsType = typeof ModelConfigs;

/**
 * Resolves the {@link LabelEnum} for a given built-in object detection model name.
 * @typeParam M - A built-in model name from {@link ObjectDetectionModelName}.
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
 * @typeParam T - Either a built-in model name (e.g. `'ssdlite-320-mobilenet-v3-large'`)
 *   or a custom {@link LabelEnum} label map.
 * @category Typescript API
 */
export class ObjectDetectionModule<
  T extends ObjectDetectionModelName | LabelEnum,
> extends VisionLabeledModule<Detection<ResolveLabels<T>>[], ResolveLabels<T>> {
  private modelConfig: ObjectDetectionConfig<LabelEnum>;

  private constructor(
    labelMap: ResolveLabels<T>,
    modelConfig: ObjectDetectionConfig<LabelEnum>,
    nativeModule: unknown
  ) {
    super(labelMap, nativeModule);
    this.modelConfig = modelConfig;
  }

  /**
   * Creates an object detection instance for a built-in model.
   * @param namedSources - A {@link ObjectDetectionModelSources} object specifying which model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ObjectDetectionModule` instance typed to the chosen model's label map.
   */
  static async fromModelName<C extends ObjectDetectionModelSources>(
    namedSources: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ObjectDetectionModule<ModelNameOf<C>>> {
    const { modelSource } = namedSources;
    const modelConfig = ModelConfigs[
      namedSources.modelName
    ] as ObjectDetectionConfig<LabelEnum>;
    const { labelMap, preprocessorConfig } = modelConfig;
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
    const nativeModule = await global.loadObjectDetection(
      modelPath,
      normMean,
      normStd,
      allLabelNames
    );
    return new ObjectDetectionModule<ModelNameOf<C>>(
      labelMap as ResolveLabels<ModelNameOf<C>>,
      modelConfig,
      nativeModule
    );
  }

  /**
   * Returns the available input sizes for this model, or undefined if the model accepts any size.
   *
   * @returns An array of available input sizes, or undefined if not constrained.
   *
   * @example
   * ```typescript
   * const sizes = model.getAvailableInputSizes(); // [384, 512, 640] for YOLO models, or undefined for RF-DETR
   * ```
   */
  getAvailableInputSizes(): readonly number[] | undefined {
    return this.modelConfig.availableInputSizes;
  }

  /**
   * Override runOnFrame to provide an options-based API for VisionCamera integration.
   */
  override get runOnFrame():
    | ((
        frame: any,
        options?: ObjectDetectionOptions<ResolveLabels<T>>
      ) => Detection<ResolveLabels<T>>[])
    | null {
    const baseRunOnFrame = super.runOnFrame;
    if (!baseRunOnFrame) return null;

    // Create reverse map (label → enum value) for classesOfInterest lookup
    const labelMap: Record<string, number> = {};
    for (const [name, value] of Object.entries(this.labelMap)) {
      if (typeof value === 'number') {
        labelMap[name] = value;
      }
    }

    const defaultDetectionThreshold =
      this.modelConfig.defaultDetectionThreshold ?? 0.7;
    const defaultIouThreshold = this.modelConfig.defaultIouThreshold ?? 0.55;
    const defaultInputSize = this.modelConfig.defaultInputSize;

    return (
      frame: any,
      options?: ObjectDetectionOptions<ResolveLabels<T>>
    ): Detection<ResolveLabels<T>>[] => {
      'worklet';

      const detectionThreshold =
        options?.detectionThreshold ?? defaultDetectionThreshold;
      const iouThreshold = options?.iouThreshold ?? defaultIouThreshold;
      const inputSize = options?.inputSize ?? defaultInputSize;
      const methodName =
        inputSize !== undefined ? `forward_${inputSize}` : 'forward';

      const classIndices = options?.classesOfInterest
        ? options.classesOfInterest.map((label) => {
            const labelStr = String(label);
            const enumValue = labelMap[labelStr];
            return typeof enumValue === 'number' ? enumValue : -1;
          })
        : [];

      return baseRunOnFrame(
        frame,
        detectionThreshold,
        iouThreshold,
        classIndices,
        methodName
      );
    };
  }

  /**
   * Executes the model's forward pass to detect objects within the provided image.
   *
   * Supports two input types:
   * 1. **String path/URI**: File path, URL, or Base64-encoded string
   * 2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)
   *
   * @param input - A string image source (file path, URI, or Base64) or a {@link PixelData} object.
   * @param options - Optional configuration for detection inference. Includes `detectionThreshold`, `inputSize`, and `classesOfInterest`.
   * @returns A Promise resolving to an array of {@link Detection} objects.
   * @throws {RnExecutorchError} If the model is not loaded or if an invalid `inputSize` is provided.
   *
   * @example
   * ```typescript
   * const detections = await model.forward('path/to/image.jpg', {
   *   detectionThreshold: 0.7,
   *   inputSize: 640,  // For YOLO models
   *   classesOfInterest: ['PERSON', 'CAR'],
   * });
   * ```
   */
  override async forward(
    input: string | PixelData,
    options?: ObjectDetectionOptions<ResolveLabels<T>>
  ): Promise<Detection<ResolveLabels<T>>[]> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    }

    // Extract parameters with defaults from config
    const detectionThreshold =
      options?.detectionThreshold ??
      this.modelConfig.defaultDetectionThreshold ??
      0.7;
    const iouThreshold =
      options?.iouThreshold ?? this.modelConfig.defaultIouThreshold ?? 0.55;
    const inputSize = options?.inputSize ?? this.modelConfig.defaultInputSize;

    // Validate inputSize against availableInputSizes
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

    // Construct method name: forward_384, forward_512, forward_640, or forward
    const methodName =
      inputSize !== undefined ? `forward_${inputSize}` : 'forward';

    // Convert classesOfInterest to indices
    const classIndices = options?.classesOfInterest
      ? options.classesOfInterest.map((label) => {
          const labelStr = String(label);
          const enumValue = this.labelMap[labelStr as keyof ResolveLabels<T>];
          return typeof enumValue === 'number' ? enumValue : -1;
        })
      : [];

    // Call native with all parameters
    return typeof input === 'string'
      ? await this.nativeModule.generateFromString(
          input,
          detectionThreshold,
          iouThreshold,
          classIndices,
          methodName
        )
      : await this.nativeModule.generateFromPixels(
          input,
          detectionThreshold,
          iouThreshold,
          classIndices,
          methodName
        );
  }

  /**
   * Creates an object detection instance with a user-provided model binary and label map.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   * Internally uses `'custom'` as the model name for telemetry unless overridden.
   *
   * ## Required model contract
   *
   * The `.pte` model binary must expose a single `forward` method with the following interface:
   *
   * **Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in
   * `[0, 1]` after optional per-channel normalization `(pixel − mean) / std`.
   * H and W are read from the model's declared input shape at load time.
   *
   * **Outputs:** exactly three `float32` tensors, in this order:
   * 1. Bounding boxes — flat `[4·N]` array of `(x1, y1, x2, y2)` coordinates in model-input
   *    pixel space, repeated for N detections.
   * 2. Confidence scores — flat `[N]` array of values in `[0, 1]`.
   * 3. Class indices — flat `[N]` array of `float32`-encoded integer class indices
   *    (0-based, matching the order of entries in your `labelMap`).
   *
   * Preprocessing (resize → normalize) and postprocessing (coordinate rescaling, threshold
   * filtering, NMS) are handled by the native runtime — your model only needs to produce
   * the raw detections above.
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param config - A {@link ObjectDetectionConfig} object with the label map and optional preprocessing parameters.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ObjectDetectionModule` instance typed to the provided label map.
   */
  static async fromCustomModel<L extends LabelEnum>(
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
    const nativeModule = await global.loadObjectDetection(
      modelPath,
      normMean,
      normStd,
      allLabelNames
    );
    return new ObjectDetectionModule<L>(
      config.labelMap as ResolveLabels<L>,
      config,
      nativeModule
    );
  }
}
