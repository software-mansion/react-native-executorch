import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModule(modelSource: string, tokenizerSource: string): Promise<number>;
  forward(input: string, meanPooling: boolean): Promise<number[]>;
}

export default TurboModuleRegistry.get<Spec>('TextEmbeddings');
