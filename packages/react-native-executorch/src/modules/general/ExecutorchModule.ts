import { TensorPtr } from '../../types/common';
import { BaseModule } from '../BaseModule';
import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ETErrorCode } from '../../errors/ErrorCodes';
import { ExecutorchError } from '../../errors/errorUtils';

export class ExecutorchModule extends BaseModule {
  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      modelSource
    );
    if (paths === null || paths.length < 1) {
      throw new ExecutorchError(
        ETErrorCode.DownloadInterrupted,
        'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
      );
    }
    this.nativeModule = global.loadExecutorchModule(paths[0] || '');
  }

  async forward(inputTensor: TensorPtr[]): Promise<TensorPtr[]> {
    return await this.forwardET(inputTensor);
  }
}
