import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from './common';

/**
 * Props for the `useImageEmbeddings` hook.
 *
 * @category Types
 * @property {Object} model - An object containing the model source.
 * @property {ResourceSource} model.modelSource - The source of the image embeddings model binary.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface ImageEmbeddingsProps {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

/**
 * Return type for the `useImageEmbeddings` hook.
 * Manages the state and operations for generating image embeddings (feature vectors) used in Computer Vision tasks.
 *
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
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.
   * @returns A Promise that resolves to a `Float32Array` containing the generated embedding vector.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (imageSource: string) => Promise<Float32Array>;
}
