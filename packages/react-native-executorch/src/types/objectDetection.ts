import { RnExecutorchError } from '../errors/errorUtils';
import { LabelEnum, Triple, ResourceSource, PixelData, Frame } from './common';
import { CocoLabel } from '../constants/commonVision';
export { CocoLabel };

/**
 * Represents a bounding box for a detected object in an image.
 * @category Types
 * @property {number} x1 - The x-coordinate of the bottom-left corner of the bounding box.
 * @property {number} y1 - The y-coordinate of the bottom-left corner of the bounding box.
 * @property {number} x2 - The x-coordinate of the top-right corner of the bounding box.
 * @property {number} y2 - The y-coordinate of the top-right corner of the bounding box.
 */
export interface Bbox {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

/**
 * Represents a detected object within an image, including its bounding box, label, and confidence score.
 * @category Types
 * @typeParam L - The label enum type for the detected object. Defaults to {@link CocoLabel}.
 * @property {Bbox} bbox - The bounding box of the detected object, defined by its top-left (x1, y1) and bottom-right (x2, y2) coordinates.
 * @property {keyof L} label - The class label of the detected object.
 * @property {number} score - The confidence score of the detection, typically ranging from 0 to 1.
 */
export interface Detection<L extends LabelEnum = typeof CocoLabel> {
  bbox: Bbox;
  label: keyof L;
  score: number;
}

/**
 * Options for configuring object detection inference.
 * @category Types
 * @typeParam L - The label enum type for filtering classes of interest.
 * @property {number} [detectionThreshold] - Minimum confidence score for detections (0-1). Defaults to model-specific value.
 * @property {number} [iouThreshold] - IoU threshold for non-maximum suppression (0-1). Defaults to model-specific value.
 * @property {number} [inputSize] - Input size for multi-method models (e.g., 384, 512, 640 for YOLO). Required for YOLO models if not using default.
 * @property {(keyof L)[]} [classesOfInterest] - Optional array of class labels to filter detections. Only detections matching these classes will be returned.
 */
export interface ObjectDetectionOptions<L extends LabelEnum> {
  detectionThreshold?: number;
  iouThreshold?: number;
  inputSize?: number;
  classesOfInterest?: (keyof L)[];
}

/**
 * Per-model config for {@link ObjectDetectionModule.fromModelName}.
 * Each model name maps to its required fields.
 * @category Types
 */
export type ObjectDetectionModelSources =
  | { modelName: 'ssdlite-320-mobilenet-v3-large'; modelSource: ResourceSource }
  | { modelName: 'rf-detr-nano'; modelSource: ResourceSource }
  | { modelName: 'yolo26n'; modelSource: ResourceSource }
  | { modelName: 'yolo26s'; modelSource: ResourceSource }
  | { modelName: 'yolo26m'; modelSource: ResourceSource }
  | { modelName: 'yolo26l'; modelSource: ResourceSource }
  | { modelName: 'yolo26x'; modelSource: ResourceSource };

/**
 * Union of all built-in object detection model names.
 * @category Types
 */
export type ObjectDetectionModelName = ObjectDetectionModelSources['modelName'];

/**
 * Configuration for a custom object detection model.
 * @category Types
 * @typeParam T - The label enum type for the model.
 * @property {T} labelMap - The label mapping for the model.
 * @property {object} [preprocessorConfig] - Optional preprocessing configuration with normalization parameters.
 * @property {number} [defaultDetectionThreshold] - Default detection confidence threshold (0-1).
 * @property {number} [defaultIouThreshold] - Default IoU threshold for non-maximum suppression (0-1).
 * @property {readonly number[]} [availableInputSizes] - For multi-method models, the available input sizes (e.g., [384, 512, 640]).
 * @property {number} [defaultInputSize] - For multi-method models, the default input size to use.
 */
export type ObjectDetectionConfig<T extends LabelEnum> = {
  labelMap: T;
  preprocessorConfig?: { normMean?: Triple<number>; normStd?: Triple<number> };
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
 * Props for the `useObjectDetection` hook.
 * @typeParam C - A {@link ObjectDetectionModelSources} config specifying which built-in model to load.
 * @category Types
 * @property model - The model config containing `modelName` and `modelSource`.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface ObjectDetectionProps<C extends ObjectDetectionModelSources> {
  model: C;
  preventLoad?: boolean;
}

/**
 * Return type for the `useObjectDetection` hook.
 * Manages the state and operations for Computer Vision object detection tasks.
 * @typeParam L - The {@link LabelEnum} representing the model's class labels.
 * @category Types
 */
export interface ObjectDetectionType<L extends LabelEnum> {
  /**
   * Contains the error object if the model failed to load, download, or encountered a runtime error during detection.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the object detection model is loaded and ready to process images.
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
   * Executes the model's forward pass with automatic input type detection.
   * @param input - Image source (string path/URI or PixelData object)
   * @param options - Optional configuration for detection inference
   * @returns A Promise that resolves to an array of `Detection` objects.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   * @example
   * ```typescript
   * // String path with options
   * const detections1 = await model.forward('file:///path/to/image.jpg', {
   *   detectionThreshold: 0.7,
   *   inputSize: 640,  // For YOLO models
   *   classesOfInterest: ['PERSON', 'CAR']
   * });
   *
   * // Pixel data
   * const detections2 = await model.forward({
   *   dataPtr: new Uint8Array(rgbPixels),
   *   sizes: [480, 640, 3],
   *   scalarType: ScalarType.BYTE
   * }, { detectionThreshold: 0.5 });
   * ```
   */
  forward: (
    input: string | PixelData,
    options?: ObjectDetectionOptions<L>
  ) => Promise<Detection<L>[]>;

  /**
   * Returns the available input sizes for multi-method models (e.g., YOLO).
   * Returns undefined for single-method models (e.g., RF-DETR, SSDLite).
   * @returns Array of available input sizes or undefined
   * @example
   * ```typescript
   * const sizes = model.getAvailableInputSizes(); // [384, 512, 640] for YOLO models
   * ```
   */
  getAvailableInputSizes: () => readonly number[] | undefined;

  /**
   * Synchronous worklet function for real-time VisionCamera frame processing.
   * Automatically handles native buffer extraction and cleanup.
   *
   * **Use this for VisionCamera frame processing in worklets.**
   * For async processing, use `forward()` instead.
   *
   * Available after model is loaded (`isReady: true`).
   * @param frame - VisionCamera Frame object
   * @param isFrontCamera - Whether the front camera is active, used for mirroring corrections.
   * @param options - Optional configuration for detection inference
   * @returns Array of Detection objects representing detected items in the frame.
   */
  runOnFrame:
    | ((
        frame: Frame,
        isFrontCamera: boolean,
        options?: ObjectDetectionOptions<L>
      ) => Detection<L>[])
    | null;
}
