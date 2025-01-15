import { BaseModule } from './BaseModule';
import { _ObjectDetectionModule } from '../../native/RnExecutorchModules';
import { Detection } from '../../types/object_detection';

export class ObjectDetectionModule {
  static async load(modelSource: string | number) {
    await BaseModule.load(_ObjectDetectionModule, modelSource);
  }

  static async forward(input: string): Promise<Detection[]> {
    return await BaseModule.forward(_ObjectDetectionModule, input);
  }
}
