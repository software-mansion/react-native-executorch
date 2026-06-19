import { TensorPtr } from '../../types/common';
import { BaseModule } from '../BaseModule';
import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * General module for executing custom Executorch models.
 * @category Typescript API
 */
export class ExecutorchModule extends BaseModule {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates an Executorch instance from a model binary.
   * @param modelSource - Source of the model to be loaded.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ExecutorchModule` instance.
   */
  static async fromModelSource(
    modelSource: ResourceSource,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ExecutorchModule> {
    try {
      const paths = await ResourceFetcher.fetch(
        onDownloadProgress,
        modelSource
      );
      if (!paths?.[0]) {
        throw new RnExecutorchError(RnExecutorchErrorCode.DownloadInterrupted);
      }
      const nativeModule = await global.loadExecutorchModule(paths[0]);
      return new ExecutorchModule(nativeModule);
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass, where input is an array of `TensorPtr` objects.
   * If the inference is successful, an array of tensor pointers is returned.
   * @param inputTensor - Array of input tensor pointers.
   * @returns An array of output tensor pointers.
   */
  async forward(inputTensor: TensorPtr[]): Promise<TensorPtr[]> {
    return await this.forwardET(inputTensor);
  }
}
