import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource, PixelData, Frame } from './common';

/**
 * Union of all built-in image embeddings model names.
 * @category Types
 */
export type ImageEmbeddingsModelName =
  | 'clip-vit-base-patch32-image'
  | 'clip-vit-base-patch32-image-quantized';

/**
 * Props for the `useImageEmbeddings` hook.
 * @category Types
 * @property {object} model - An object containing the model configuration.
 * @property {ImageEmbeddingsModelName} model.modelName - Unique name identifying the model.
 * @property {ResourceSource} model.modelSource - The source of the image embeddings model binary.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface ImageEmbeddingsProps {
  model: { modelName: ImageEmbeddingsModelName; modelSource: ResourceSource };
  preventLoad?: boolean;
}

/**
 * Return type for the `useImageEmbeddings` hook.
 * Manages the state and operations for generating image embeddings (feature vectors) used in Computer Vision tasks.
 * @category Types
 */
export interface ImageEmbeddingsType {
  /**
   * Contains the error object if the model failed to load, download, or encountered a runtime error during embedding generation.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the image embeddings model is loaded and ready to process images.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently generating embeddings for an image.
   */
  isGenerating: boolean;

  /**
   * Represents the download progress of the model binary as a value between 0 and 1.
   */
  downloadProgress: number;

  /**
   * Executes the model's forward pass to generate embeddings (a feature vector) for the provided image.
   *
   * Supports two input types:
   * 1. **String path/URI**: File path, URL, or Base64-encoded string
   * 2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)
   *
   * **Note**: For VisionCamera frame processing, use `runOnFrame` instead.
   * @param input - Image source (string or {@link PixelData} object)
   * @returns A Promise that resolves to a `Float32Array` containing the generated embedding vector.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (input: string | PixelData) => Promise<Float32Array>;

  /**
   * Synchronous worklet function for real-time VisionCamera frame processing.
   * Automatically handles native buffer extraction and cleanup.
   *
   * **Use this for VisionCamera frame processing in worklets.**
   * For async processing, use `forward()` instead.
   *
   * Available after model is loaded (`isReady: true`).
   * @param frame - VisionCamera Frame object
   * @returns Float32Array containing the embedding vector for the frame.
   */
  runOnFrame: ((frame: Frame) => Float32Array) | null;
}
