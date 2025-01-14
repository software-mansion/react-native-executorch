import { BaseModule } from './BaseModule';
import { _ClassificationModule } from '../../native/RnExecutorchModules';

export class ClassificationModule extends BaseModule {
  constructor() {
    super(new _ClassificationModule());
  }
}
