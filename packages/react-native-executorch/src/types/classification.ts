import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource, PixelData, Frame } from './common';

/**
 * Union of all built-in classification model names.
 *
 * @category Types
 */
export type ClassificationModelName =
  | 'efficientnet-v2-s'
  | 'efficientnet-v2-s-quantized';

/**
 * Props for the `useClassification` hook.
 *
 * @category Types
 * @property {Object} model - An object containing the model configuration.
 * @property {ClassificationModelName} model.modelName - Unique name identifying the model.
 * @property {ResourceSource} model.modelSource - The source of the classification model binary.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface ClassificationProps {
  model: { modelName: ClassificationModelName; modelSource: ResourceSource };
  preventLoad?: boolean;
}

/**
 * Return type for the `useClassification` hook.
 * Manages the state and operations for Computer Vision image classification.
 *
 * @category Types
 */
export interface ClassificationType {
  /**
   * Contains the error object if the model failed to load, download, or encountered a runtime error during classification.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the classification model is loaded and ready to process images.
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
   * Executes the model's forward pass to classify the provided image.
   *
   * Supports two input types:
   * 1. **String path/URI**: File path, URL, or Base64-encoded string
   * 2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)
   *
   * **Note**: For VisionCamera frame processing, use `runOnFrame` instead.
   *
   * @param input - Image source (string or PixelData object)
   * @returns A Promise that resolves to the classification result (labels and confidence scores).
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (
    input: string | PixelData
  ) => Promise<{ [category: string]: number }>;

  /**
   * Synchronous worklet function for real-time VisionCamera frame processing.
   * Automatically handles native buffer extraction and cleanup.
   *
   * **Use this for VisionCamera frame processing in worklets.**
   * For async processing, use `forward()` instead.
   *
   * Available after model is loaded (`isReady: true`).
   *
   * @param frame - VisionCamera Frame object
   * @returns Object mapping class labels to confidence scores.
   */
  runOnFrame: ((frame: Frame) => { [category: string]: number }) | null;
}
