import { RnExecutorchError } from "../errors/errorUtils";
import { ResourceSource } from "./common";

/**
 * Props for the `useClassification` hook.
 * 
 * @category Types
 * @property {Object} model - An object containing the model source.
 * @property {ResourceSource} model.modelSource - The source of the classification model binary.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface ClassificationProps {
  model: { modelSource: ResourceSource };
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
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or base64 string) to be classified.
   * @returns A Promise that resolves to the classification result (typically containing labels and confidence scores).
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (imageSource: string) => Promise<{ [category: string]: number }>
}