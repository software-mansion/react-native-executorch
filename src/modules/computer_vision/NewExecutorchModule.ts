import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { getError, ETError } from '../../Error';
import { ResourceSource } from '../../types/common';

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

  async forward(imageSource: string) {
    if (this.nativeModule == null)
      throw new Error(getError(ETError.ModuleNotLoaded));
    return await this.nativeModule.forward(imageSource);
  }

  async getInputShape(methodName: string, index: number): Promise<any> {
    try {
      return await this.nativeModule.getInputShape(methodName, index);
    } catch (e) {
      console.error('o kurczaki');
    }
  }

  async methodNames(): Promise<any> {
    try {
      return await this.nativeModule.methodNames();
    } catch (e) {
      console.error(e);
    }
  }
}
