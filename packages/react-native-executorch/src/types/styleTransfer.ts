import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from './common';

/**
 * Union of all built-in style transfer model names.
 *
 * @category Types
 */
export type StyleTransferModelName =
  | 'style-transfer-candy'
  | 'style-transfer-candy-quantized'
  | 'style-transfer-mosaic'
  | 'style-transfer-mosaic-quantized'
  | 'style-transfer-rain-princess'
  | 'style-transfer-rain-princess-quantized'
  | 'style-transfer-udnie'
  | 'style-transfer-udnie-quantized';

/**
 * Configuration properties for the `useStyleTransfer` hook.
 *
 * @category Types
 * @property {Object} model - Object containing the model configuration.
 * @property {StyleTransferModelName} model.modelName - Unique name identifying the model.
 * @property {ResourceSource} model.modelSource - `ResourceSource` that specifies the location of the style transfer model binary.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
 */
export interface StyleTransferProps {
  model: { modelName: StyleTransferModelName; modelSource: ResourceSource };
  preventLoad?: boolean;
}

/**
 * Return type for the `useStyleTransfer` hook.
 * Manages the state and operations for applying artistic style transfer to images.
 *
 * @category Types
 */
export interface StyleTransferType {
  /**
   * Contains the error object if the model failed to load, download, or encountered a runtime error during style transfer.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the style transfer model is loaded and ready to process images.
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
   * Executes the model's forward pass to apply the specific artistic style to the provided image.
   * @param imageSource - A string representing the input image source (e.g., a file path, URI, or base64 string) to be stylized.
   * @returns A Promise that resolves to a string containing the stylized image (typically as a base64 string or a file URI).
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (imageSource: string) => Promise<string>;
}
