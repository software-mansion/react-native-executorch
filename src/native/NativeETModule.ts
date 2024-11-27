import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModule(modelSource: string): Promise<number>;

  forward(
    input: number[],
    shape: number[],
    inputType: number
  ): Promise<number[]>;
  loadMethod(methodName: string): Promise<number>;
}

export default TurboModuleRegistry.get<Spec>('ETModule');
