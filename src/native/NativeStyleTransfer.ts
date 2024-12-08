import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModule(modelSource: string): Promise<number>;

  forward(input: string): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('StyleTransfer');
