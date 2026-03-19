import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource, PixelData, Frame } from './common';

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
   *
   * Supports two input types:
   * 1. **String path/URI**: File path, URL, or Base64-encoded string
   * 2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)
   *
   * **Note**: For VisionCamera frame processing, use `runOnFrame` instead.
   *
   * @param input - Image source (string or PixelData object)
   * @param outputType - Output format: `'pixelData'` (default) returns raw RGBA pixel data; `'url'` saves the result to a temp file and returns its `file://` path.
   * @returns A Promise resolving to `PixelData` when `outputType` is `'pixelData'` (default), or a `file://` URL string when `outputType` is `'url'`.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward<O extends 'pixelData' | 'url' = 'pixelData'>(
    input: string | PixelData,
    outputType?: O
  ): Promise<O extends 'url' ? string : PixelData>;

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
   * @returns PixelData containing the stylized frame as raw RGB pixel data.
   */
  runOnFrame: ((frame: Frame, isMirrored: boolean) => PixelData) | null;
}
