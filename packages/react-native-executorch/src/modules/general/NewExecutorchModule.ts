import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { TensorPtr } from '../../types/common';

export class NewExecutorchModule {
  nativeModule: any = null;

  async load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetchMultipleResources(
      onDownloadProgressCallback,
      modelSource
    );
    this.nativeModule = global.loadExecutorchModule(paths[0] || '');
  }

  async forward(inputTensor: TensorPtr[]): Promise<ArrayBuffer[]> {
    return await this.nativeModule.forward(inputTensor);
  }

  async getInputShape(methodName: string, index: number): Promise<number[]> {
    return this.nativeModule.getInputShape(methodName, index);
  }
}
