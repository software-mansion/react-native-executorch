import { BaseModule } from './BaseModule';
import { _StyleTransferModule } from '../../native/RnExecutorchModules';

export class StyleTransfer extends BaseModule {
  constructor() {
    super(new _StyleTransferModule());
  }
}
