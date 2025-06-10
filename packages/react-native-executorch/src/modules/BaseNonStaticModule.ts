import { ResourceSource } from '../types/common';
import { ResourceFetcher } from '../utils/ResourceFetcher';
import { TensorPtr } from '../types/common';

export class BaseNonStaticModule {
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

  protected async forwardET(inputTensor: TensorPtr[]): Promise<TensorPtr[]> {
    return await this.nativeModule.forward(inputTensor);
  }

  async getInputShape(methodName: string, index: number): Promise<number[]> {
    return this.nativeModule.getInputShape(methodName, index);
  }

  delete() {
    if (this.nativeModule !== null) {
      this.nativeModule.unload();
    }
  }
}
