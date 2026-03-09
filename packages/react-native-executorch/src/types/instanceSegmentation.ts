import { RnExecutorchError } from '../errors/errorUtils';
import { LabelEnum, ResourceSource } from './common';
import { Bbox } from './objectDetection';

/**
 * Represents a single detected instance in instance segmentation output.
 *
 * @typeParam L - The label map type for the model, must conform to {@link LabelEnum}.
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
 * Options for instance segmentation forward pass.
 *
 * @typeParam L - The label map type for the model, must conform to {@link LabelEnum}.
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
   * Defaults to model's defaultIouThreshold (typically 0.5).
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
   * Input size for the model (e.g., 384, 512, 640).
   * Must be one of the model's availableInputSizes.
   * Defaults to model's defaultInputSize.
   */
  inputSize?: number;
}

/**
 * Configuration for an instance segmentation model.
 *
 * @typeParam T - The label map type for the model, must conform to {@link LabelEnum}.
 * @category Types
 */
export type InstanceSegmentationConfig<T extends LabelEnum> = {
  labelMap: T;
  preprocessorConfig?: {
    normMean?: [number, number, number];
    normStd?: [number, number, number];
  };
  postprocessorConfig?: { applyNMS?: boolean };
  defaultConfidenceThreshold?: number;
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
 * @typeParam L - The label map type for the model, must conform to {@link LabelEnum}.
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
   * @returns A Promise resolving to an array of {@link SegmentedInstance} objects.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (
    imageSource: string,
    options?: InstanceSegmentationOptions<L>
  ) => Promise<SegmentedInstance<L>[]>;
}
