import { ResourceSource } from '../types/common';
import { TensorPtr } from '../types/common';

export abstract class BaseModule {
  nativeModule: any = null;

  abstract load(
    modelSource: ResourceSource,
    onDownloadProgressCallback: (_: number) => void,
    ...args: any[]
  ): Promise<void>;

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
