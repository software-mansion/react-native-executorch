import { Frame, PixelData, ResourceSource } from './common';
import { CocoKeypoint } from '../constants/poseEstimation';
import { RnExecutorchError } from '../errors/errorUtils';

export { CocoKeypoint };

/**
 * A keypoint enum maps keypoint names to their indices.
 * Similar to LabelEnum but specifically for pose keypoints.
 * @category Types
 */
export type KeypointEnum = Readonly<Record<string, number>>;

/**
 * A single keypoint with x, y coordinates
 * @category Types
 */
export interface Keypoint {
  x: number;
  y: number;
}

/**
 * Keypoints for a single detected person, keyed by name from the keypoint map.
 * @typeParam K - The {@link KeypointEnum} for this model.
 * @category Types
 * @example
 * ```ts
 * person.NOSE; // { x, y }
 * ```
 */
export type PersonKeypoints<K extends KeypointEnum = typeof CocoKeypoint> = {
  readonly [Name in keyof K]: Keypoint;
};

/**
 * Pose estimation result containing all detected people.
 * @category Types
 */
export type PoseDetections<K extends KeypointEnum = typeof CocoKeypoint> =
  PersonKeypoints<K>[];

/**
 * Configuration for pose estimation model behavior.
 * @category Types
 * @typeParam K - The keypoint enum type for this model.
 */
export type PoseEstimationConfig<K extends KeypointEnum> = {
  keypointMap: K;
  preprocessorConfig?: {
    normMean?: readonly [number, number, number];
    normStd?: readonly [number, number, number];
  };
  defaultDetectionThreshold?: number;
  defaultIouThreshold?: number;
} & (
  | {
      availableInputSizes: readonly number[];
      defaultInputSize: number;
    }
  | {
      availableInputSizes?: undefined;
      defaultInputSize?: undefined;
    }
);

/**
 * Per-model config for {@link PoseEstimationModule.fromModelName}.
 * Each model name maps to its required fields.
 * @category Types
 */
export type PoseEstimationModelSources =
  | { modelName: 'yolo11n-pose'; modelSource: ResourceSource }
  | { modelName: 'yolo26n-pose'; modelSource: ResourceSource };

/**
 * Union of all built-in pose estimation model names.
 * @category Types
 */
export type PoseEstimationModelName = PoseEstimationModelSources['modelName'];

/**
 * Props for usePoseEstimation hook.
 * @typeParam C - A {@link PoseEstimationModelSources} config specifying which built-in model to load.
 * @category Types
 */
export interface PoseEstimationProps<C extends PoseEstimationModelSources> {
  model: C;
  preventLoad?: boolean;
}

/**
 * Options for pose estimation inference
 * @category Types
 */
export interface PoseEstimationOptions {
  detectionThreshold?: number;
  iouThreshold?: number;
  /**
   * Input size for multi-method models.
   * For YOLO models, valid values are typically 384, 512, or 640.
   * Maps to forward_384, forward_512, forward_640 methods.
   */
  inputSize?: number;
}

/**
 * Return type of usePoseEstimation hook.
 * @typeParam K - The {@link KeypointEnum} representing the model's keypoint schema.
 * @category Types
 */
export interface PoseEstimationType<K extends KeypointEnum> {
  /**
   * Contains the error object if the model failed to load or encountered a runtime error.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the model is loaded and ready to process images.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently processing an image.
   */
  isGenerating: boolean;

  /**
   * Represents the download progress of the model binary as a value between 0 and 1.
   */
  downloadProgress: number;

  /**
   * Run pose estimation on an image.
   * @param input - Image path/URI or PixelData
   * @param options - Detection options
   * @returns Array of detected people, each with keypoints accessible via the keypoint enum
   */
  forward: (
    input: string | PixelData,
    options?: PoseEstimationOptions
  ) => Promise<PoseDetections<K>>;

  /**
   * Returns the available input sizes for multi-method models.
   * Returns undefined for single-method models.
   */
  getAvailableInputSizes: () => readonly number[] | undefined;

  /**
   * Synchronous worklet function for real-time VisionCamera frame processing.
   */
  runOnFrame:
    | ((
        frame: Frame,
        isFrontCamera: boolean,
        options?: PoseEstimationOptions
      ) => PoseDetections<K>)
    | null;
}
