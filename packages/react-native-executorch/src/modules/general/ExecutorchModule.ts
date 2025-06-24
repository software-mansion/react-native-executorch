import { TensorPtr } from '../../types/common';
import { BaseNonStaticModule } from '../BaseNonStaticModule';
import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';

export class ExecutorchModule extends BaseNonStaticModule {
  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = (await ResourceFetcher.fetchMultipleResources(
      onDownloadProgressCallback,
      modelSource
    ))!;
    this.nativeModule = global.loadExecutorchModule(paths[0] || '');
  }

  async forward(inputTensor: TensorPtr[]): Promise<TensorPtr[]> {
    return await this.forwardET(inputTensor);
  }
}
