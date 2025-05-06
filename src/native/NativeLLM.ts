import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  loadLLM(modelSource: string, tokenizerSource: string): Promise<string>;
  forward(input: string): Promise<string>;
  interrupt(): void;
  releaseResources(): void;

  readonly onToken: EventEmitter<string>;
}

export default TurboModuleRegistry.get<Spec>('LLM');
