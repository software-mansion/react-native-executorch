import { TensorPtr } from '../../types/common';
import { BaseModule } from '../BaseModule';
import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * General module for executing custom Executorch models.
 *
 * @category Typescript API
 */
export class ExecutorchModule extends BaseModule {
  /**
   * Loads the model, where `modelSource` is a string, number, or object that specifies the location of the model binary.
   * Optionally accepts a download progress callback.
   *
   * @param modelSource - Source of the model to be loaded.
   * @param onDownloadProgressCallback - Optional callback to monitor download progress.
   */
  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    try {
      const paths = await ResourceFetcher.fetch(
        onDownloadProgressCallback,
        modelSource
      );
      if (paths === null || paths.length < 1 || paths[0] === undefined) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
      }
      this.nativeModule = global.loadExecutorchModule(paths[0]);
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass, where input is an array of `TensorPtr` objects.
   * If the inference is successful, an array of tensor pointers is returned.
   *
   * @param inputTensor - Array of input tensor pointers.
   * @returns An array of output tensor pointers.
   */
  async forward(inputTensor: TensorPtr[]): Promise<TensorPtr[]> {
    return await this.forwardET(inputTensor);
  }
}
