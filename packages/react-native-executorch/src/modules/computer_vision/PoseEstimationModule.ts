import { Frame, PixelData, ResourceSource } from '../../types/common';
import {
  Keypoint,
  PersonKeypoints,
  PoseDetections,
  PoseEstimationOptions,
  PoseEstimationModelSources,
  PoseEstimationModelName,
  PoseEstimationConfig,
  KeypointEnum,
} from '../../types/poseEstimation';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import { VisionModule } from './VisionModule';
import { fetchModelPath } from './VisionLabeledModule';
import { CocoKeypoint } from '../../constants/poseEstimation';
import { ResolveConfigOrType } from '../../types/computerVision';

const YOLO_POSE_CONFIG = {
  keypointMap: CocoKeypoint,
  preprocessorConfig: undefined,
  availableInputSizes: [384, 512, 640] as const,
  defaultInputSize: 384,
  defaultDetectionThreshold: 0.5,
  defaultKeypointThreshold: 0.5,
} satisfies PoseEstimationConfig<typeof CocoKeypoint>;

const ModelConfigs = {
  'yolo26n-pose': YOLO_POSE_CONFIG,
} as const satisfies Record<
  PoseEstimationModelName,
  PoseEstimationConfig<KeypointEnum>
>;

type ModelConfigsType = typeof ModelConfigs;

/**
 * Resolves the {@link KeypointEnum} for a given built-in pose estimation model name.
 * @typeParam M - A built-in model name from {@link PoseEstimationModelName}.
 * @category Types
 */
export type PoseEstimationKeypoints<M extends PoseEstimationModelName> =
  (typeof ModelConfigs)[M]['keypointMap'];

type ModelNameOf<C extends PoseEstimationModelSources> = C['modelName'];

/** @internal */
type ResolveKeypoints<T extends PoseEstimationModelName | KeypointEnum> =
  ResolveConfigOrType<T, ModelConfigsType, 'keypointMap'>;

function mapPersonKeypoints<K extends KeypointEnum>(
  raw: Keypoint[][],
  entries: [string, number][],
  maxIndex: number
): PersonKeypoints<K>[] {
  'worklet';
  if (raw.length > 0 && raw[0]!.length <= maxIndex) {
    throw new Error(
      `Keypoint map references index ${maxIndex} but model returned ${raw[0]!.length} keypoints per person — keypointMap is incompatible with this model.`
    );
  }
  const out: PersonKeypoints<K>[] = [];
  for (const person of raw) {
    const named: Record<string, Keypoint> = {};
    for (const [name, idx] of entries) named[name] = person[idx]!;
    out.push(named as PersonKeypoints<K>);
  }
  return out;
}

/**
 * Pose estimation module for detecting human body keypoints.
 * @typeParam T - Either a built-in model name (e.g. `'yolo26n-pose'`)
 *   or a custom {@link KeypointEnum} keypoint map.
 * @category Typescript API
 */
export class PoseEstimationModule<
  T extends PoseEstimationModelName | KeypointEnum,
> extends VisionModule<PoseDetections<ResolveKeypoints<T>>> {
  private readonly keypointMap: ResolveKeypoints<T>;
  private readonly modelConfig: PoseEstimationConfig<KeypointEnum>;
  private readonly maxKeypointIndex: number;

  private constructor(
    keypointMap: ResolveKeypoints<T>,
    modelConfig: PoseEstimationConfig<KeypointEnum>,
    nativeModule: unknown
  ) {
    super();
    this.keypointMap = keypointMap;
    this.modelConfig = modelConfig;
    this.nativeModule = nativeModule;
    this.maxKeypointIndex = Math.max(...Object.values(keypointMap));
  }

  /**
   * Creates a pose estimation instance for a built-in model.
   * @param namedSources - A {@link PoseEstimationModelSources} object specifying which model to load.
   * @param onDownloadProgress - Optional callback to monitor download progress (0-1).
   * @returns A Promise resolving to a `PoseEstimationModule` instance typed to the model's keypoint map.
   */
  static async fromModelName<C extends PoseEstimationModelSources>(
    namedSources: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<PoseEstimationModule<ModelNameOf<C>>> {
    const { modelSource } = namedSources;
    const modelConfig = ModelConfigs[
      namedSources.modelName
    ] as PoseEstimationConfig<KeypointEnum>;
    const { keypointMap, preprocessorConfig } = modelConfig;
    const normMean = preprocessorConfig?.normMean ?? [];
    const normStd = preprocessorConfig?.normStd ?? [];

    const modelPath = await fetchModelPath(modelSource, onDownloadProgress);
    const nativeModule = await global.loadPoseEstimation(
      modelPath,
      normMean,
      normStd
    );

    return new PoseEstimationModule<ModelNameOf<C>>(
      keypointMap as ResolveKeypoints<ModelNameOf<C>>,
      modelConfig,
      nativeModule
    );
  }

  /**
   * Creates a pose estimation instance with a user-provided model binary and keypoint map.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param config - A {@link PoseEstimationConfig} object with the keypoint map and optional preprocessing parameters.
   * @param onDownloadProgress - Optional callback to monitor download progress (0-1).
   * @returns A Promise resolving to a `PoseEstimationModule` instance typed to the provided keypoint map.
   */
  static async fromCustomModel<K extends KeypointEnum>(
    modelSource: ResourceSource,
    config: PoseEstimationConfig<K>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<PoseEstimationModule<K>> {
    const { keypointMap, preprocessorConfig } = config;
    const normMean = preprocessorConfig?.normMean ?? [];
    const normStd = preprocessorConfig?.normStd ?? [];

    const modelPath = await fetchModelPath(modelSource, onDownloadProgress);
    const nativeModule = await global.loadPoseEstimation(
      modelPath,
      normMean,
      normStd
    );

    return new PoseEstimationModule<K>(
      keypointMap as ResolveKeypoints<K>,
      config,
      nativeModule
    );
  }

  /**
   * Get the keypoint map for this model.
   * @returns Map of keypoint names to indices, e.g. `{ NOSE: 0, LEFT_EYE: 1, ... }`.
   */
  getKeypointMap(): ResolveKeypoints<T> {
    return this.keypointMap;
  }

  /**
   * Returns the available input sizes for this model, or undefined if the model accepts any size.
   * @returns a readonly number[] specifying what input sizes the model supports.
   */
  getAvailableInputSizes(): readonly number[] | undefined {
    return this.modelConfig.availableInputSizes;
  }

  /**
   * Override runOnFrame to provide an options-based API for VisionCamera integration.
   * @returns A worklet function for frame processing.
   */
  override get runOnFrame(): (
    frame: Frame,
    isFrontCamera: boolean,
    options?: PoseEstimationOptions
  ) => PoseDetections<ResolveKeypoints<T>> {
    if (!this.nativeModule) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'Model is not loaded. Ensure the model has been loaded before using runOnFrame.'
      );
    }

    const nativeGenerateFromFrame = this.nativeModule.generateFromFrame;
    const defaultDetectionThreshold =
      this.modelConfig.defaultDetectionThreshold ?? 0.5;
    const defaultKeypointThreshold =
      this.modelConfig.defaultKeypointThreshold ?? 0.5;
    const defaultInputSize = this.modelConfig.defaultInputSize;
    const availableInputSizes = this.modelConfig.availableInputSizes;
    const keypointEntries = Object.entries(this.keypointMap);
    const maxKeypointIndex = this.maxKeypointIndex;
    return (
      frame: Frame,
      isFrontCamera: boolean,
      options?: PoseEstimationOptions
    ): PoseDetections<ResolveKeypoints<T>> => {
      'worklet';

      const detectionThreshold =
        options?.detectionThreshold ?? defaultDetectionThreshold;
      const keypointThreshold =
        options?.keypointThreshold ?? defaultKeypointThreshold;
      const inputSize = options?.inputSize ?? defaultInputSize;

      // Validate inputSize
      if (
        availableInputSizes &&
        inputSize !== undefined &&
        !availableInputSizes.includes(inputSize)
      ) {
        throw new Error(
          `Invalid inputSize: ${inputSize}. Available sizes: ${availableInputSizes.join(', ')}`
        );
      }

      const methodName =
        inputSize !== undefined ? `forward_${inputSize}` : 'forward';

      let nativeBuffer: { pointer: bigint; release(): void } | null = null;
      try {
        nativeBuffer = frame.getNativeBuffer();
        const frameData = {
          nativeBuffer: nativeBuffer.pointer,
          orientation: frame.orientation,
          isMirrored: isFrontCamera,
        };
        const raw: Keypoint[][] = nativeGenerateFromFrame(
          frameData,
          detectionThreshold,
          keypointThreshold,
          methodName
        );
        return mapPersonKeypoints<ResolveKeypoints<T>>(
          raw,
          keypointEntries,
          maxKeypointIndex
        );
      } finally {
        if (nativeBuffer?.release) {
          nativeBuffer.release();
        }
      }
    };
  }

  /**
   * Run pose estimation on an image.
   * @param input - Image path/URI or PixelData
   * @param options - Detection options including inputSize for multi-method models
   * @returns Array of detected people, each with keypoints accessible via the keypoint enum
   */
  override async forward(
    input: string | PixelData,
    options?: PoseEstimationOptions
  ): Promise<PoseDetections<ResolveKeypoints<T>>> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'Model not loaded. Please load the model before calling forward().'
      );
    }

    const detectionThreshold =
      options?.detectionThreshold ??
      this.modelConfig.defaultDetectionThreshold ??
      0.5;
    const keypointThreshold =
      options?.keypointThreshold ??
      this.modelConfig.defaultKeypointThreshold ??
      0.5;
    const inputSize = options?.inputSize ?? this.modelConfig.defaultInputSize;

    // Validate inputSize against availableInputSizes
    if (
      this.modelConfig.availableInputSizes &&
      inputSize !== undefined &&
      !this.modelConfig.availableInputSizes.includes(inputSize)
    ) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidArgument,
        `Invalid inputSize: ${inputSize}. Available sizes: ${this.modelConfig.availableInputSizes.join(', ')}`
      );
    }

    const methodName =
      inputSize !== undefined ? `forward_${inputSize}` : 'forward';

    const raw: Keypoint[][] =
      typeof input === 'string'
        ? await this.nativeModule.generateFromString(
            input,
            detectionThreshold,
            keypointThreshold,
            methodName
          )
        : await this.nativeModule.generateFromPixels(
            input,
            detectionThreshold,
            keypointThreshold,
            methodName
          );

    const entries = Object.entries(this.keypointMap);
    return mapPersonKeypoints<ResolveKeypoints<T>>(
      raw,
      entries,
      this.maxKeypointIndex
    );
  }
}
