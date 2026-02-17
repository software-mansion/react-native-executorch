import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';

/**
 * Raw pixel data for vision model inference.
 */
export type PixelData = {
  data: ArrayBuffer;
  width: number;
  height: number;
  channels: number;
};

/**
 * VisionCamera Frame object for real-time processing.
 */
export type Frame = {
  getNativeBuffer(): { pointer: number; release(): void };
  width: number;
  height: number;
};

/**
 * Base class for computer vision models that support multiple input types.
 *
 * VisionModule extends BaseModule with:
 * - Unified `forward()` API accepting string paths or raw pixel data
 * - `runOnFrame` getter for real-time VisionCamera frame processing
 * - Shared frame processor creation logic
 *
 * Subclasses should only implement model-specific loading logic.
 *
 * @category Typescript API
 */
export abstract class VisionModule<TOutput> extends BaseModule {
  /**
   * Synchronous worklet function for real-time VisionCamera frame processing.
   *
   * Only available after the model is loaded. Returns null if not loaded.
   *
   * **Use this for VisionCamera frame processing in worklets.**
   * For async processing, use `forward()` instead.
   *
   * @example
   * ```typescript
   * const model = new ClassificationModule();
   * await model.load({ modelSource: MODEL });
   *
   * const frameOutput = useFrameOutput({
   *   onFrame(frame) {
   *     'worklet';
   *     if (!model.runOnFrame) return;
   *     const result = model.runOnFrame(frame);
   *     frame.dispose();
   *   }
   * });
   * ```
   */
  get runOnFrame(): ((frame: Frame, ...args: any[]) => TOutput) | null {
    if (!this.nativeModule?.generateFromFrame) {
      return null;
    }

    // Extract pure JSI function reference (runs on JS thread)
    const nativeGenerateFromFrame = this.nativeModule.generateFromFrame;

    // Return worklet that captures ONLY the JSI function
    return (frame: any, ...args: any[]): TOutput => {
      'worklet';

      let nativeBuffer: any = null;
      try {
        nativeBuffer = frame.getNativeBuffer();
        const frameData = {
          nativeBuffer: nativeBuffer.pointer,
          width: frame.width,
          height: frame.height,
        };
        return nativeGenerateFromFrame(frameData, ...args);
      } finally {
        if (nativeBuffer?.release) {
          nativeBuffer.release();
        }
      }
    };
  }

  /**
   * Executes the model's forward pass with automatic input type detection.
   *
   * Supports two input types:
   * 1. **String path/URI**: File path, URL, or Base64-encoded string
   * 2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)
   *
   * **Note**: For VisionCamera frame processing, use `forwardSync` instead.
   * This method is async and cannot be called in worklet context.
   *
   * @param input - Image source (string path or PixelData object)
   * @param args - Additional model-specific arguments
   * @returns A Promise that resolves to the model output.
   *
   * @example
   * ```typescript
   * // String path (async)
   * const result1 = await model.forward('file:///path/to/image.jpg');
   *
   * // Pixel data (async)
   * const result2 = await model.forward({
   *   data: pixelBuffer,
   *   width: 640,
   *   height: 480,
   *   channels: 3
   * });
   *
   * // For VisionCamera frames, use runOnFrame in worklet:
   * const frameOutput = useFrameOutput({
   *   onFrame(frame) {
   *     'worklet';
   *     if (!model.runOnFrame) return;
   *     const result = model.runOnFrame(frame);
   *   }
   * });
   * ```
   */
  async forward(input: string | PixelData, ...args: any[]): Promise<TOutput> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );

    // Type detection and routing
    if (typeof input === 'string') {
      // String path → generateFromString()
      return await this.nativeModule.generateFromString(input, ...args);
    } else if (
      typeof input === 'object' &&
      'data' in input &&
      input.data instanceof ArrayBuffer &&
      typeof input.width === 'number' &&
      typeof input.height === 'number' &&
      typeof input.channels === 'number'
    ) {
      // Pixel data → generateFromPixels()
      return await this.nativeModule.generateFromPixels(input, ...args);
    } else {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidArgument,
        'Invalid input: expected string path or PixelData object. For VisionCamera frames, use runOnFrame instead.'
      );
    }
  }
}
