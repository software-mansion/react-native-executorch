import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModule(modelSource: string): Promise<number>;

  forward(
    input: string,
    classesOfInterest: string[],
    resize: boolean
  ): Promise<{ [category: string]: number[] }>;
}

export default TurboModuleRegistry.get<Spec>('ImageSegmentation');
