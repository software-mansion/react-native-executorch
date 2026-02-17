import { Frame, ResourceSource } from '../types/common';
import { TensorPtr } from '../types/common';

/**
 * Base class for all React Native Executorch modules.
 *
 * Provides core functionality for loading models, running inference,
 * and managing native resources.
 *
 * @category Base Classes
 */
export abstract class BaseModule {
  /**
   * Native module instance (JSI Host Object)
   * @internal
   */
  nativeModule: any = null;

  /**
   * Process a camera frame directly for real-time inference.
   *
   * This method is bound to a native JSI function after calling `load()`,
   * making it worklet-compatible and safe to call from VisionCamera's
   * frame processor thread.
   *
   * **Performance characteristics:**
   * - **Zero-copy path**: When using `frame.getNativeBuffer()` from VisionCamera v5,
   *   frame data is accessed directly without copying (fastest, recommended).
   * - **Copy path**: When using `frame.toArrayBuffer()`, pixel data is copied
   *   from native to JS, then accessed from native code (slower, fallback).
   *
   * **Usage with VisionCamera:**
   * ```typescript
   * const frameOutput = useFrameOutput({
   *   pixelFormat: 'rgb',
   *   onFrame(frame) {
   *     'worklet';
   *     // Zero-copy approach (recommended)
   *     const nativeBuffer = frame.getNativeBuffer();
   *     const result = model.generateFromFrame(
   *       { nativeBuffer: nativeBuffer.pointer, width: frame.width, height: frame.height },
   *       ...args
   *     );
   *     nativeBuffer.release();
   *     frame.dispose();
   *   }
   * });
   * ```
   *
   * @param frameData Frame data object with either nativeBuffer (zero-copy) or data (ArrayBuffer)
   * @param args Additional model-specific arguments (e.g., threshold, options)
   * @returns Model-specific output (e.g., detections, classifications, embeddings)
   *
   * @see {@link Frame} for frame data format details
   */
  public generateFromFrame!: (frameData: Frame, ...args: any[]) => any;

  /**
   * Load the model and prepare it for inference.
   *
   * @param modelSource - Resource location of the model binary
   * @param onDownloadProgressCallback - Optional callback to monitor download progress (0-1)
   * @param args - Additional model-specific loading arguments
   */

  abstract load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void,
    ...args: any[]
  ): Promise<void>;

  /**
   * Runs the model's forward method with the given input tensors.
   * It returns the output tensors that mimic the structure of output from ExecuTorch.
   *
   * @param inputTensor - Array of input tensors.
   * @returns Array of output tensors.
   * @internal
   */
  protected async forwardET(inputTensor: TensorPtr[]): Promise<TensorPtr[]> {
    return await this.nativeModule.forward(inputTensor);
  }

  /**
   * Gets the input shape for a given method and index.
   *
   * @param methodName method name
   * @param index index of the argument which shape is requested
   * @returns The input shape as an array of numbers.
   */
  async getInputShape(methodName: string, index: number): Promise<number[]> {
    return this.nativeModule.getInputShape(methodName, index);
  }

  /**
   * Unloads the model from memory and releases native resources.
   *
   * Always call this method when you're done with a model to prevent memory leaks.
   */
  delete() {
    if (this.nativeModule !== null) {
      this.nativeModule.unload();
    }
  }
}
