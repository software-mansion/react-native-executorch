import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  loadLLM(
    modelSource: string,
    tokenizerSource: string,
    systemPrompt: string,
    contextWindowLength: number
  ): Promise<string>;
  runInference(input: string): Promise<string>;
  interrupt(): void;
  deleteModule(): void;

  readonly onToken: EventEmitter<string>;
  readonly onDownloadProgress: EventEmitter<number>;
}

export default TurboModuleRegistry.get<Spec>('LLM');
