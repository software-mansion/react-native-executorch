import { TensorPtr } from '../../types/common';
import { BaseNonStaticModule } from '../BaseNonStaticModule';

export class NewExecutorchModule extends BaseNonStaticModule {
  async forward(inputTensor: TensorPtr[]): Promise<ArrayBuffer[]> {
    // As TypeScript doesn't provide overloading, this method is just a proxy for the users
    return await this.forwardET(inputTensor);
  }
}
