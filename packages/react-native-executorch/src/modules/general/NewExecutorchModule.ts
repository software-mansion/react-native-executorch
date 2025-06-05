import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';

type TensorBuffer =
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array;

enum ScalarType {
  FLOAT16 = 1,
}

interface TensorPtr {
  data: TensorBuffer;
  shape: number[];
  scalarType: ScalarType;
}

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

  async forward(inputTensor: TensorPtr[]): Promise<void> {
    return await this.nativeModule.forward(inputTensor);
  }

  async getInputShape(methodName: string, index: number): Promise<number[]> {
    return this.nativeModule.getInputShape(methodName, index);
  }
}
