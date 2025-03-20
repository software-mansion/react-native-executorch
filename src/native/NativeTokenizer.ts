import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModule(modelSource: string): Promise<number>;
  decode(input: number[]): Promise<string>;
  encode(input: string): Promise<number[]>;
}

export default TurboModuleRegistry.get<Spec>('Tokenizer');
