import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { Detection } from '../types/object_detection';

export interface Spec extends TurboModule {
  loadModule(modelSource: string): Promise<number>;
  forward(input: string): Promise<Detection[]>;
}

export default TurboModuleRegistry.get<Spec>('ObjectDetection');
