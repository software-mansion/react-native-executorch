import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { ObjectDetectionResult } from '../models/object_detection/types';

export interface Spec extends TurboModule {
  loadModule(modelSource: string): Promise<number>;
  forward(input: string): Promise<ObjectDetectionResult>;
}

export default TurboModuleRegistry.get<Spec>('ObjectDetection');
