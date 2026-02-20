import { RnExecutorchError } from '../errors/errorUtils';
import { LabelEnum, Triple, ResourceSource } from './common';
import { CocoLabel } from '../constants/commonVision';

/**
 * Represents a bounding box for a detected object in an image.
 *
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
 *
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
 * Per-model config for {@link ObjectDetectionModule.fromModelName}.
 * Each model name maps to its required fields.
 *
 * @category Types
 */
export type ObjectDetectionModelSources =
  | { modelName: 'ssdlite-320-mobilenet-v3-large'; modelSource: ResourceSource }
  | { modelName: 'rf-detr-nano'; modelSource: ResourceSource };

/**
 * Union of all built-in object detection model names.
 *
 * @category Types
 */
export type ObjectDetectionModelName = ObjectDetectionModelSources['modelName'];

/**
 * Configuration for a custom object detection model.
 *
 * @category Types
 */
export type ObjectDetectionConfig<T extends LabelEnum> = {
  labelMap: T;
  preprocessorConfig?: { normMean?: Triple<number>; normStd?: Triple<number> };
};

/**
 * Props for the `useObjectDetection` hook.
 *
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
 *
 * @typeParam L - The {@link LabelEnum} representing the model's class labels.
 *
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
   * Executes the model's forward pass to detect objects within the provided image.
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.
   * @param detectionThreshold - An optional number between 0 and 1 representing the minimum confidence score required for an object to be included in the results. Default is 0.7.
   * @returns A Promise that resolves to an array of `Detection` objects, where each object typically contains bounding box coordinates, a class label, and a confidence score.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (
    imageSource: string,
    detectionThreshold?: number
  ) => Promise<Detection<L>[]>;
}
