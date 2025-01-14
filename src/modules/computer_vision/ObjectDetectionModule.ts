import { BaseModule } from './BaseModule';
import { _ObjectDetectionModule } from '../../native/RnExecutorchModules';

export class ObjectDetectionModule extends BaseModule {
  constructor() {
    super(new _ObjectDetectionModule());
  }
}
