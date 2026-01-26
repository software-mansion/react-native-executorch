import { ResourceSource } from '../types/common';
import { TensorPtr } from '../types/common';

export abstract class BaseModule {
  /**
   * Native module instance
   */
  nativeModule: any = null;

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
   * Unloads the model from memory.
   */
  delete() {
    if (this.nativeModule !== null) {
      this.nativeModule.unload();
    }
  }
}
