import { RnExecutorchError } from '../errors/errorUtils';
import { LabelEnum, ResourceSource } from './common';
import { Bbox } from './objectDetection';

/**
 * Represents a single detected instance in instance segmentation output.
 *
 * @typeParam L - The {@link LabelEnum} type for the model.
 * @category Types
 * @property {Bbox} bbox - The bounding box of the instance.
 * @property {Uint8Array} mask - Binary mask (0 or 1) representing the instance.
 * @property {number} maskWidth - Width of the mask array.
 * @property {number} maskHeight - Height of the mask array.
 * @property {keyof L} label - The class label of the instance.
 * @property {number} score - Confidence score [0, 1].
 * @property {number} instanceId - Unique identifier for this instance.
 */
export interface SegmentedInstance<L extends LabelEnum> {
  bbox: Bbox;
  mask: Uint8Array;
  maskWidth: number;
  maskHeight: number;
  label: keyof L;
  score: number;
  instanceId: number;
}

/**
 * Preprocessor configuration for instance segmentation models.
 *
 * @category Types
 */
export interface PreprocessorConfig {
  /**
   * Mean values for normalization [R, G, B]. Applied as: (pixel / 255.0 - mean) / std
   */
  normMean?: [number, number, number];
  /**
   * Standard deviation values for normalization [R, G, B].
   */
  normStd?: [number, number, number];
}

/**
 * Postprocessor configuration for instance segmentation models.
 * Configuration is declarative - specify only what you need.
 *
 * @category Types
 */
export interface PostprocessorConfig {
  /**
   * Default confidence threshold for this model.
   */
  defaultConfidenceThreshold?: number;
  /**
   * Default IoU threshold for NMS for this model.
   */
  defaultIouThreshold?: number;
  /**
   * Whether to apply Non-Maximum Suppression (NMS). Default: true
   * If true, NMS will be applied using the specified or default IoU threshold.
   */
  applyNMS?: boolean;
}

/**
 * Options for instance segmentation forward pass.
 *
 * @typeParam L - The {@link LabelEnum} type for the model.
 * @category Types
 */
export interface InstanceSegmentationOptions<L extends LabelEnum> {
  /**
   * Minimum confidence threshold for including instances.
   * Defaults to model's defaultConfidenceThreshold (typically 0.5).
   */
  confidenceThreshold?: number;
  /**
   * IoU threshold for non-maximum suppression.
   * Defaults to model's defaultIouThreshold (typically 0.45).
   */
  iouThreshold?: number;
  /**
   * Maximum number of instances to return. Default: 100
   */
  maxInstances?: number;
  /**
   * Filter to include only specific classes.
   */
  classesOfInterest?: (keyof L)[];
  /**
   * Whether to return masks at original image resolution. Default: true
   */
  returnMaskAtOriginalResolution?: boolean;
  /**
   * Input size for the model (e.g., 384, 416, 512, 640, 1024).
   * Must be one of the model's availableInputSizes.
   * Defaults to model's defaultInputSize.
   */
  inputSize?: number;
}

/**
 * Configuration for custom instance segmentation model.
 *
 * @typeParam T - The {@link LabelEnum} type for the model.
 * @property labelMap - The enum-like object mapping class names to indices
 * @property availableInputSizes - (Optional) Array of supported input sizes for multi-method models (e.g., [384, 416, 512, 640, 1024])
 * @property defaultInputSize - (Optional) Default input size to use if not specified. Required if availableInputSizes is provided
 * @property preprocessorConfig - Optional preprocessing configuration (normalization, etc.)
 * @property postprocessorConfig - Postprocessing configuration (type, thresholds, etc.)
 *
 * @remarks
 * **Multi-Method Models (e.g., YOLO):**
 * - Provide both `availableInputSizes` and `defaultInputSize`
 * - Model must have separate methods like `forward_384`, `forward_512`, `forward_640`
 * - Input size can be specified in {@link InstanceSegmentationOptions.inputSize}
 * - Input size will be validated against availableInputSizes
 *
 * @example
 * ```typescript
 * // Multi-method model config (YOLO)
 * const yoloConfig = {
 *   labelMap: CocoLabel,
 *   availableInputSizes: [384, 416, 512, 640, 1024],
 *   defaultInputSize: 640,
 *   postprocessorConfig: {
 *     defaultConfidenceThreshold: 0.5,
 *     defaultIouThreshold: 0.45,
 *     applyNMS: false  // YOLO already applies NMS internally
 *   }
 * };
 * ```
 *
 * **Single-Method Models (e.g., RFDetr):**
 * - Omit both `availableInputSizes` and `defaultInputSize`
 * - Model must have a single `forward` method
 * - Input shape is auto-detected from model metadata
 * - {@link InstanceSegmentationOptions.inputSize} parameter is ignored (with warning)
 *
 * @example
 * ```typescript
 * // Single-method model config (RFDetr)
 * const rfdetrConfig = {
 *   labelMap: CocoLabel,
 *   postprocessorConfig: {
 *     defaultConfidenceThreshold: 0.5,
 *     applyNMS: true  // RFDetr needs NMS to be applied
 *   }
 * };
 * ```
 *
 * @category Types
 */
export type InstanceSegmentationConfig<T extends LabelEnum> = {
  labelMap: T;
  availableInputSizes?: readonly number[];
  defaultInputSize?: number;
  preprocessorConfig?: PreprocessorConfig;
  postprocessorConfig: PostprocessorConfig;
};

/// We would bind it here - but we need a deafult conf for yolo to be applied instead of
/**
 * Per-model config for {@link InstanceSegmentationModule.fromModelName}.
 * Each model name maps to its required fields.
 *
 * @category Types
 */
export type InstanceSegmentationModelSources =
  | { modelName: 'yolo26n-seg'; modelSource: ResourceSource }
  | { modelName: 'yolo26s-seg'; modelSource: ResourceSource }
  | { modelName: 'yolo26m-seg'; modelSource: ResourceSource }
  | { modelName: 'yolo26l-seg'; modelSource: ResourceSource }
  | { modelName: 'yolo26x-seg'; modelSource: ResourceSource };

/**
 * Union of all built-in instance segmentation model names.
 *
 * @category Types
 */
export type InstanceSegmentationModelName =
  InstanceSegmentationModelSources['modelName'];

/**
 * Extracts the instance segmentation model name from a {@link InstanceSegmentationModelSources} config object.
 *
 * @category Types
 */
export type InstanceModelNameOf<C extends InstanceSegmentationModelSources> =
  C['modelName'];

/**
 * Props for the `useInstanceSegmentation` hook.
 *
 * @typeParam C - A {@link InstanceSegmentationModelSources} config specifying which built-in model to load.
 * @property model - The model config containing `modelName` and `modelSource`.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 *
 * @category Types
 */
export interface InstanceSegmentationProps<
  C extends InstanceSegmentationModelSources,
> {
  model: C;
  preventLoad?: boolean;
}

/**
 * Return type for the `useInstanceSegmentation` hook.
 * Manages the state and operations for instance segmentation models.
 *
 * @typeParam L - The {@link LabelEnum} representing the model's class labels.
 *
 * @category Types
 */
export interface InstanceSegmentationType<L extends LabelEnum> {
  /**
   * Contains the error object if the model failed to load, download, or encountered a runtime error during segmentation.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the instance segmentation model is loaded and ready to process images.
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
   * Executes the model's forward pass to perform instance segmentation on the provided image.
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.
   * @param options - Optional configuration for the segmentation process.
   * @returns A Promise resolving to an array of instance masks.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (
    imageSource: string,
    options?: InstanceSegmentationOptions<L>
  ) => Promise<SegmentedInstance<L>[]>;
}
