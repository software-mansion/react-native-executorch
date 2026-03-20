import { RnExecutorchError } from '../errors/errorUtils';
import { LabelEnum, Triple, ResourceSource, PixelData, Frame } from './common';
import { Imagenet1kLabel } from '../constants/classification';
export { Imagenet1kLabel };

/**
 * Configuration for a custom classification model.
 *
 * @typeParam T - The {@link LabelEnum} type for the model.
 * @property labelMap - The enum-like object mapping class names to indices.
 * @property preprocessorConfig - Optional preprocessing parameters.
 * @property preprocessorConfig.normMean - Per-channel mean values for input normalization.
 * @property preprocessorConfig.normStd - Per-channel standard deviation values for input normalization.
 *
 * @category Types
 */
export type ClassificationConfig<T extends LabelEnum> = {
  labelMap: T;
  preprocessorConfig?: { normMean?: Triple<number>; normStd?: Triple<number> };
};

/**
 * Per-model config for {@link ClassificationModule.fromModelName}.
 * Each model name maps to its required fields.
 *
 * @category Types
 */
export type ClassificationModelSources =
  | { modelName: 'efficientnet-v2-s'; modelSource: ResourceSource }
  | { modelName: 'efficientnet-v2-s-quantized'; modelSource: ResourceSource };

/**
 * Union of all built-in classification model names.
 *
 * @category Types
 */
export type ClassificationModelName = ClassificationModelSources['modelName'];

/**
 * Props for the `useClassification` hook.
 *
 * @typeParam C - A {@link ClassificationModelSources} config specifying which built-in model to load.
 * @property model - The model config containing `modelName` and `modelSource`.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 *
 * @category Types
 */
export interface ClassificationProps<C extends ClassificationModelSources> {
  model: C;
  preventLoad?: boolean;
}

/**
 * Return type for the `useClassification` hook.
 * Manages the state and operations for Computer Vision image classification.
 *
 * @typeParam L - The {@link LabelEnum} representing the model's class labels.
 *
 * @category Types
 */
export interface ClassificationType<L extends LabelEnum> {
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
   * @returns A Promise that resolves to the classification result mapping label keys to confidence scores.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (input: string | PixelData) => Promise<Record<keyof L, number>>;

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
  runOnFrame: ((frame: Frame) => Record<keyof L, number>) | null;
}
